#!/usr/bin/env bash
# One-time fix-up of the live server (P9, 2026-10-01). Run as root, at a quiet hour:
#   cd /var/www/student-portal && git fetch origin && git reset --hard origin/main && bash deploy/fix-live.sh
# The site is down for ~5 minutes while it rebuilds (steps 5–6).
#
# Safe to run again: every step checks what is already done. It asks before anything
# that deletes data or could lock you out. It never prints secrets.
set -euo pipefail
trap 'echo; echo "✗ Stopped at line $LINENO. Copy the last ~30 lines to Claude."' ERR

APP=/var/www/student-portal
DATA=/var/www/tm-data
DOMAIN=tm-english.org
TEST_MODE="${TEST_MODE:-}" # set by our CI test only: skips systemd/ufw/timezone

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
ok() { printf '  ✓ %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*"; }
ask() { local a; read -r -p "  → $1 " a; printf '%s' "$a"; }
as_tm() { sudo -u tm -H bash -lc "cd $APP && $*"; }

# ------------------------------------------------------------------ 0. checks
say "0/12 Checks"
[ "$(id -u)" = 0 ] || { echo "Run with sudo (as root)."; exit 1; }
[ -f "$APP/.env" ] || { echo "$APP/.env not found."; exit 1; }
grep -q '/var/www/student-portal' "$APP/deploy/nginx/tm-english.conf" ||
    { echo "Old deploy files — push from your PC first, then: git -C $APP pull"; exit 1; }
UPLOAD_ROOT="$(grep -E '^UPLOAD_ROOT=' "$APP/.env" | cut -d= -f2- | tr -d '"'"'"'')"
[ "$UPLOAD_ROOT" = "$DATA/uploads" ] ||
    { echo "UPLOAD_ROOT in .env is '$UPLOAD_ROOT', expected $DATA/uploads."; exit 1; }
grep -qE '^NODE_ENV=production' "$APP/.env" || { echo ".env must have NODE_ENV=production"; exit 1; }
CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
[ -f "$CERT" ] || { echo "No certificate at $CERT — run: certbot certificates, and tell Claude the name."; exit 1; }
git config --global --add safe.directory "$APP" 2>/dev/null || true
ok "app, .env, uploads path and certificate found"

# ------------------------------------------------------------------ 1. packages
say "1/12 Packages, timezone, Node 24, MongoDB tools"
[ -n "$TEST_MODE" ] || timedatectl set-timezone Asia/Dhaka
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git gnupg cron ufw fail2ban python3-systemd unattended-upgrades rclone >/dev/null
NODE_MAJOR="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
if [ "${NODE_MAJOR:-0}" -lt 24 ] && [ -z "$TEST_MODE" ]; then
    curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
    bash /tmp/nodesource_setup.sh >/dev/null
    apt-get install -y -qq nodejs >/dev/null
fi
npm install -g pm2@latest --silent >/dev/null
if ! command -v mongodump >/dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc |
        gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
        >/etc/apt/sources.list.d/mongodb-org-8.0.list
    apt-get update -qq
    apt-get install -y -qq mongodb-database-tools mongodb-mongosh >/dev/null
fi
ok "node $(node -v), pm2 $(pm2 -v), $(mongodump --version | head -1)"

# ------------------------------------------------------------------ 2. backup first
say "2/12 Backup before changing anything"
grep -q '^BACKUP_DIR=' "$APP/.env" || echo "BACKUP_DIR=$DATA/backups" >>"$APP/.env"
mkdir -p "$DATA/backups"
bash "$APP/deploy/backup.sh"

# ------------------------------------------------------------------ 3. user tm
say "3/12 User 'tm' (the site stops running as root)"
if ! id tm >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" tm >/dev/null
    usermod -aG sudo tm
    ok "user tm created"
else
    ok "user tm exists"
fi
install -d -m 700 -o tm -g tm /home/tm/.ssh
touch /home/tm/.ssh/authorized_keys
chown tm:tm /home/tm/.ssh/authorized_keys && chmod 600 /home/tm/.ssh/authorized_keys
if ! grep -q '^ssh-' /home/tm/.ssh/authorized_keys; then
    echo "  Paste your PC's PUBLIC key (one line starting with ssh-ed25519)."
    echo "  On the PC: Get-Content \$env:USERPROFILE\\.ssh\\id_ed25519.pub   (Enter = skip)"
    KEY="$(ask "public key:")"
    if [[ "$KEY" =~ ^ssh-(ed25519|rsa)\ [A-Za-z0-9+/=]+ ]]; then
        echo "$KEY" >>/home/tm/.ssh/authorized_keys
        ok "key added for tm"
    else
        warn "no valid key added — root/password login will NOT be switched off (step 11)"
    fi
fi
if ! passwd -S tm | grep -q ' P '; then
    echo "  Set a password for tm (needed for sudo; save it in your password manager):"
    passwd tm
fi

# ------------------------------------------------------------------ 4. ownership
say "4/12 File ownership and permissions"
chown -R tm:tm "$APP" "$DATA"
chmod 600 "$APP/.env"
chmod 755 "$DATA" "$DATA/uploads"
chmod 700 "$DATA/backups"
[ -d "$DATA/uploads/private" ] && chmod 750 "$DATA/uploads/private"
ok "owner tm; .env 600; private uploads not readable by Nginx"

# ------------------------------------------------------------------ 5. stop the old process
say "5/12 Stop the old root process (site is down from here until step 6 finishes)"
pm2 delete all >/dev/null 2>&1 || true
pm2 save --force >/dev/null 2>&1 || true
[ -n "$TEST_MODE" ] || pm2 unstartup systemd >/dev/null 2>&1 || true
ok "old PM2 process removed"

# ------------------------------------------------------------------ 6. build + web + cron
say "6/12 Build and start web + cron as tm (takes a few minutes)"
as_tm "bash deploy/deploy.sh"
[ -n "$TEST_MODE" ] || env PATH="$PATH:/usr/bin" pm2 startup systemd -u tm --hp /home/tm >/dev/null
as_tm "pm2 save" >/dev/null
as_tm "pm2 status"

# ------------------------------------------------------------------ 7. nginx
say "7/12 Nginx (fixes /media, upload limits, X-Real-IP, HSTS, rate limits)"
BK="/root/nginx-backup-$(date +%F-%H%M%S)"
mkdir -p "$BK" && cp -a /etc/nginx/sites-enabled /etc/nginx/conf.d "$BK/"
mkdir -p /var/www/certbot
cp "$APP/deploy/nginx/tm-english.conf" /etc/nginx/conf.d/tm-english.conf
rm -f /etc/nginx/sites-enabled/*
if nginx -t 2>/dev/null; then
    if [ -n "$TEST_MODE" ]; then nginx -s reload; else systemctl reload nginx; fi
    ok "new config active (old one saved in $BK)"
else
    nginx -t || true
    rm -f /etc/nginx/conf.d/tm-english.conf
    cp -a "$BK/sites-enabled/." /etc/nginx/sites-enabled/
    cp -a "$BK/conf.d/." /etc/nginx/conf.d/
    echo "✗ New Nginx config failed the test — the old one is back. Send the output above to Claude."
    exit 1
fi

# ------------------------------------------------------------------ 8. images
say "8/12 Missing images"
as_tm "npm run --silent seed:honor-photos"
as_tm "npm run --silent check:media" || true

# ------------------------------------------------------------------ 9. demo data
say "9/12 Demo data on the live site"
echo "  Removes ONLY @demo.test records: demo students (+ their admissions, results, fees,"
echo "  reviews), demo notices, materials, assignments. Real data is untouched."
if [ "$(ask "Type RESET to remove demo data now (Enter = skip):")" = "RESET" ]; then
    if as_tm "npm run --silent seed:demo -- --reset --allow-production"; then
        as_tm "npm run --silent check:media" || true
    else
        warn "demo reset failed (see above) — the rest continues; send that part to Claude"
    fi
else
    warn "skipped — run later: npm run seed:demo -- --reset --allow-production"
fi

# ------------------------------------------------------------------ 10. firewall etc.
say "10/12 Firewall, fail2ban, automatic security updates, daily backup"
if [ -z "$TEST_MODE" ]; then
    ufw default deny incoming >/dev/null
    ufw default allow outgoing >/dev/null
    ufw allow OpenSSH >/dev/null
    ufw allow 80,443/tcp >/dev/null
    ufw --force enable >/dev/null
    ok "ufw: $(ufw status | grep -c ALLOW) allow rules (22, 80, 443)"
fi
mkdir -p /etc/fail2ban
cat >/etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
backend = systemd
JAIL
[ -n "$TEST_MODE" ] || { systemctl enable --now fail2ban >/dev/null 2>&1; systemctl restart fail2ban; }
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT
LINE="0 2 * * * $APP/deploy/backup.sh >> $DATA/backups/backup.log 2>&1"
{ crontab -u tm -l 2>/dev/null | grep -vF "deploy/backup.sh" || true; echo "$LINE"; } | crontab -u tm -
ok "fail2ban, auto security updates, backup every night at 02:00"

# ------------------------------------------------------------------ 11. ssh
say "11/12 SSH: key only, no root login"
if grep -q '^ssh-' /home/tm/.ssh/authorized_keys; then
    IP="$(hostname -I | awk '{print $1}')"
    echo "  Open a NEW PowerShell window on your PC and run:  ssh tm@$IP"
    echo "  Keep THIS window open."
    if [ "$(ask "Did 'ssh tm@$IP' log you in? Type YES to switch off root/password login:")" = "YES" ]; then
        mkdir -p /etc/ssh/sshd_config.d
        cat >/etc/ssh/sshd_config.d/01-hardening.conf <<'SSH'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
SSH
        if [ -n "$TEST_MODE" ]; then ok "(test) sshd config written"; else
            sshd -t && systemctl restart ssh
            ok "$(sshd -T | grep -E '^(permitrootlogin|passwordauthentication) ' | tr '\n' ' ')"
        fi
    else
        warn "skipped — root/password login still on"
    fi
else
    warn "skipped — tm has no SSH key yet"
fi

# ------------------------------------------------------------------ 12. report
say "12/12 Report (send this part to Claude)"
echo "  commit:  $(git -C "$APP" log -1 --oneline)"
echo "  node:    $(node -v)"
as_tm "pm2 jlist" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const p of JSON.parse(s))console.log("  pm2:     "+p.name+" "+p.pm2_env.status)})'
echo "  https:   $(curl -s -o /dev/null -m 15 -w '%{http_code}' "https://$DOMAIN/" 2>/dev/null) (200 = OK)"
echo "  health:  $(curl -s http://127.0.0.1:3000/api/health || echo fail)"
echo "  media:   $(as_tm "npm run --silent check:media" 2>&1 | grep -cE '✗') area(s) with missing files"
[ -n "$TEST_MODE" ] || echo "  ufw:     $(ufw status | head -1)"
echo "  backup:  $(tail -1 "$DATA/backups/backup.log" 2>/dev/null || echo 'first nightly run at 02:00')"
echo
echo "Still manual (see the runbook): Google Drive backup copy (rclone), admin panel cleanup"
echo "(Gallery → Remove placeholders, real batch times), npm run mail:test -- you@example.com"
