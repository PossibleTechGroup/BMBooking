#!/usr/bin/env bash
set -e

# Full stack: build, start, wait for health, migrate, seed, print URLs.
# Usage:  npm run dev
#         SKIP_SEED=true npm run dev
#         NO_BUILD=true npm run dev   (reuse existing images)

SCRIPT_DIR="$(dirname "$0")"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No .env found — running setup first..."
  "$SCRIPT_DIR/setup.sh"
fi

load_env

echo "Building and starting full Docker stack..."
NO_BUILD="${NO_BUILD:-false}" "$SCRIPT_DIR/start.sh"

wait_for_db
wait_for_backend

echo "Syncing database schema..."
compose exec -T backend npx prisma db push

if [[ "${SKIP_SEED:-}" != "true" ]]; then
  compose exec -T backend npx prisma db seed
  echo "Database seeded (admin@bm-booking.com / Password@123)."
else
  echo "Skipped seed (SKIP_SEED=true). Run: npm run seed"
fi

print_urls

echo ""
echo "Mobile (runs outside Docker):  npm run dev:mobile"
