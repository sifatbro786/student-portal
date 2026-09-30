#!/usr/bin/env bash
# Build + (re)start on the VPS. Run as the app user from the repo folder:
#   bash deploy/deploy.sh
# The 1 GB VPS needs the 2 GB swap file from the setup guide for `next build`.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "✗ .env missing (copy deploy/env.production.example)"; exit 1; }
[ "$(stat -c %a .env)" = "600" ] || { echo "✗ run: chmod 600 .env"; exit 1; }

echo "→ Pull"
git pull --ff-only

echo "→ Install (exact lockfile)"
npm ci --no-audit --no-fund

echo "→ Checks"
npm run lint
npm run check:syntax

echo "→ Build"
NODE_OPTIONS=--max-old-space-size=1024 npm run build

echo "→ Assemble standalone (static files + public/)"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "→ (Re)start"
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "→ Health"
for _ in $(seq 1 20); do
    if curl -fsS http://127.0.0.1:3000/api/health >/dev/null; then echo "✓ Up"; exit 0; fi
    sleep 2
done
echo "✗ Health check failed — see: pm2 logs web --lines 100"
exit 1
