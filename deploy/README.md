# deploy/ — production files (P9)

Target: Namecheap **VPS Spark** (reinstalled with **Ubuntu 24.04 LTS**, 1 GB RAM + 2 GB swap, 20 GB disk) · domain **tm-english.org** · MongoDB **Atlas M0 (free)**.
The step-by-step server guide is given in P9 Step 2 (server) and Step 3 (app + backups).

| File | Goes to / used by |
|---|---|
| `nginx/bootstrap-http.conf` | temporary port-80 config used once to get the first Let's Encrypt certificate |
| `nginx/tm-english.conf` | `/etc/nginx/conf.d/tm-english.conf` — HTTPS, `/media`, upload limits, rate limits, `X-Real-IP` |
| `ecosystem.config.cjs` | PM2: `web` (Next standalone on 127.0.0.1:3000) + `cron` |
| `deploy.sh` | every release: pull → `npm ci` → lint/syntax → build → assemble standalone → reload → health check |
| `backup.sh` | daily 02:00 (crontab): `mongodump` + uploads tar, 14 daily + 8 weekly, optional rclone off-site |
| `restore.sh` | restore test into `<db>_restore_test` (default) or `--live` disaster recovery |
| `env.production.example` | template for `/var/www/student-portal/.env` (chmod 600) |

Folders on the server:

```
/var/www/student-portal    ← this repo (owner: tm)
/var/www/tm-data/uploads   ← UPLOAD_ROOT (ONLY uploads/public/ is served at /media; private/ never)
/var/www/tm-data/backups   ← backup.sh output (chmod 700)
/var/www/certbot           ← Let's Encrypt webroot
```

After the first deploy, once (production-safe seeds): `npm run seed:admin`, `seed:site`, `seed:seo`,
`seed:honor`, `seed:honor-photos`. Never run `seed:demo` in production.

Checks on the server: `npm run check:media` (DB records whose files are missing on this disk),
`npm run mail:test -- you@example.com`, `pm2 status` (must show `web` AND `cron` online).
