#!/usr/bin/env bash
# Rename Telebirr config so Prisma db push does not parse PEM keys (*.env files are scanned).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../telebirr-h5-integration" && pwd)"
cd "$DIR"

if [[ -f secrets.env && ! -f telebirr.credentials ]]; then
  mv secrets.env telebirr.credentials
  echo "Renamed secrets.env -> telebirr.credentials"
elif [[ -f .env && ! -f telebirr.credentials ]]; then
  mv .env telebirr.credentials
  echo "Renamed .env -> telebirr.credentials"
fi

if [[ ! -f telebirr.credentials ]]; then
  cp telebirr.credentials.example telebirr.credentials
  echo "Created telebirr.credentials from example — edit before using Telebirr."
fi

echo ""
echo "If prisma still fails, fix PRIVATE_KEY in telebirr.credentials:"
echo "  Use double quotes and \\n between PEM lines (see telebirr.credentials.example)."
echo "  Do NOT leave bare MIIE... lines or backtick multiline (.envy) format."
echo ""
echo "Then from repo root: docker compose exec backend npx prisma db push"
