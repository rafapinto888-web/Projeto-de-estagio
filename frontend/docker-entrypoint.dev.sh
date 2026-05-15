#!/bin/sh
set -e
cd /app

# Em cada arranque (novo PC ou package-lock atualizado) alinha node_modules ao lock.
if [ -f package-lock.json ]; then
  npm ci --prefer-offline --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
