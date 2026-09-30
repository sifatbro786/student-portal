#!/usr/bin/env bash
# Restore a backup made by backup.sh.
#
# TEST restore (default, safe — production is not touched):
#   deploy/restore.sh /var/www/tm-data/backups/daily/db-2026-10-05_0200.archive.gz \
#                     /var/www/tm-data/backups/daily/uploads-2026-10-05_0200.tar.gz
#   → database copied into "<db>_restore_test", files into /tmp/tm-restore-test,
#     then document counts of both databases are printed side by side.
#
# REAL restore (disaster recovery — overwrites production data):
#   deploy/restore.sh <db-archive> <uploads-tar> --live
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
set -a; . "$APP/.env"; set +a

DB_ARCHIVE="${1:?db archive path}"
FILES_TAR="${2:-}"
LIVE="${3:-}"

# Database name = path part of MONGODB_URI (mongodb[+srv]://host/<db>?…)
DB="$(printf '%s' "$MONGODB_URI" | sed -E 's#^mongodb(\+srv)?://[^/]+/([^?]+).*#\2#')"
[ -n "$DB" ] && [ "$DB" != "$MONGODB_URI" ] || { echo "✗ MONGODB_URI has no database name"; exit 1; }

if [ "$LIVE" = "--live" ]; then
    echo "This OVERWRITES the live database '$DB' and $UPLOAD_ROOT."
    read -r -p "Type RESTORE to continue: " answer
    [ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }
    pm2 stop web cron || true
    mongorestore --uri="$MONGODB_URI" --archive="$DB_ARCHIVE" --gzip --drop \
        --nsInclude="$DB.*"
    if [ -n "$FILES_TAR" ]; then
        tar -xzf "$FILES_TAR" -C "$UPLOAD_ROOT"
    fi
    pm2 start web cron
    echo "✓ Live restore finished. Check the site, then: pm2 logs --lines 50"
    exit 0
fi

TEST_DB="${DB}_restore_test"
TEST_DIR="/tmp/tm-restore-test"
echo "→ Database → $TEST_DB"
mongorestore --uri="$MONGODB_URI" --archive="$DB_ARCHIVE" --gzip --drop \
    --nsFrom="$DB.*" --nsTo="$TEST_DB.*"

if [ -n "$FILES_TAR" ]; then
    echo "→ Files → $TEST_DIR"
    rm -rf "$TEST_DIR" && mkdir -p "$TEST_DIR"
    tar -xzf "$FILES_TAR" -C "$TEST_DIR"
    echo "  files restored: $(find "$TEST_DIR" -type f | wc -l)  (live: $(find "$UPLOAD_ROOT" -type f -not -path "$UPLOAD_ROOT/cache/*" -not -path "$UPLOAD_ROOT/tmp/*" | wc -l))"
fi

echo "→ Document counts (live vs restored)"
mongosh "$MONGODB_URI" --quiet --eval "
  const live = db.getSiblingDB('$DB'), test = db.getSiblingDB('$TEST_DB');
  for (const c of live.getCollectionNames().sort())
    print(c.padEnd(22), String(live[c].countDocuments()).padStart(7), String(test[c].countDocuments()).padStart(7));
"
echo
echo "When the numbers match (restored may be slightly lower if data changed since the backup):"
echo "  mongosh \"\$MONGODB_URI\" --eval 'db.getSiblingDB(\"$TEST_DB\").dropDatabase()'  &&  rm -rf $TEST_DIR"
