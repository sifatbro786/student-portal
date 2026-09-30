#!/usr/bin/env bash
# Daily backup (PRD §10): database + uploaded files. Run by the app user's crontab at 02:00:
#   0 2 * * * /var/www/student-portal/deploy/backup.sh >> /var/www/tm-data/backups/backup.log 2>&1
# Keeps 14 daily + 8 weekly (Sunday) copies locally, then copies the day's files off the
# server with rclone when RCLONE_REMOTE is set (e.g. RCLONE_REMOTE=gdrive:tm-backups).
# A backup that has never been restored is not a backup — see deploy/restore.sh.
set -euo pipefail
trap 'echo "[$(date +%F_%H%M)] ✗ backup FAILED at line $LINENO" >&2' ERR
APP="$(cd "$(dirname "$0")/.." && pwd)"
set -a; . "$APP/.env"; set +a

DEST="${BACKUP_DIR:-/var/www/tm-data/backups}"
TS="$(TZ=Asia/Dhaka date +%F_%H%M)"
mkdir -p "$DEST/daily" "$DEST/weekly"
umask 077 # backups hold personal data: owner-only

DB_FILE="$DEST/daily/db-$TS.archive.gz"
FILES_FILE="$DEST/daily/uploads-$TS.tar.gz"

echo "[$TS] database → $DB_FILE"
mongodump --uri="$MONGODB_URI" --archive="$DB_FILE" --gzip --quiet

echo "[$TS] uploads → $FILES_FILE (without cache/ and tmp/)"
# exit code 1 = "a file changed while reading" (live uploads) — the archive is still valid
tar -czf "$FILES_FILE" -C "$UPLOAD_ROOT" --exclude=./cache --exclude=./tmp . || [ $? -eq 1 ]

# Sunday → weekly copy
if [ "$(TZ=Asia/Dhaka date +%u)" = "7" ]; then
    cp "$DB_FILE" "$FILES_FILE" "$DEST/weekly/"
fi

# Retention
find "$DEST/daily" -type f -mtime +14 -delete
for kind in db uploads; do
    # newest 8 stay; `|| true` because an empty folder is not an error
    (ls -1t "$DEST/weekly/$kind"-* 2>/dev/null || true) | tail -n +9 | xargs -r rm -f
done

# Off-site copy (the VPS disk can die too)
if [ -n "${RCLONE_REMOTE:-}" ]; then
    rclone copy "$DEST/daily" "$RCLONE_REMOTE/daily" --max-age 25h
    rclone copy "$DEST/weekly" "$RCLONE_REMOTE/weekly" --max-age 8d
    echo "[$TS] off-site copy → $RCLONE_REMOTE"
else
    echo "[$TS] ! RCLONE_REMOTE not set — backups exist only on this server"
fi

echo "[$TS] ✓ done ($(du -h "$DB_FILE" | cut -f1) db, $(du -h "$FILES_FILE" | cut -f1) files)"
