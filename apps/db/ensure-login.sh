#!/bin/bash
set -e

# Start postgres normally first to let docker-entrypoint.sh do its initialization
docker-entrypoint.sh postgres &
EPID=$!

# Wait for the init to finish and postgres to start, then stop it
sleep 5
kill $EPID 2>/dev/null || true
wait $EPID 2>/dev/null || true

# Fix LOGIN in single-user mode
if command -v postgres &>/dev/null; then
  su - postgres -c "postgres --single -D /var/lib/postgresql/data ${POSTGRES_DB:-bm_booking_db}" <<SQL || true
ALTER ROLE postgres WITH LOGIN PASSWORD '${POSTGRES_PASSWORD:-postgres}';
SQL
fi

# Start postgres for real (no entrypoint, just postgres directly)
exec postgres -D /var/lib/postgresql/data
