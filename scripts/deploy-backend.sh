#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/ecomerce"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Deploying e-commerce backend (${BRANCH})"

cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/${BRANCH}"

cd "$APP_DIR/backend"
npm ci --omit=dev

pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
pm2 save

echo "==> Health check"
sleep 2
curl -fsS "http://127.0.0.1:${PORT:-5010}/api/health" && echo ""
echo "==> Deploy complete"
