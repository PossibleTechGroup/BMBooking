#!/bin/bash
set -e

# Start the standard postgres entrypoint in the background
docker-entrypoint.sh postgres &
PID=$!

# Wait for postgres to be ready
until pg_isready -U postgres 2>/dev/null; do
  sleep 1
done

# Ensure LOGIN is always enabled
psql -U postgres -d "${POSTGRES_DB:-bm_booking_db}" -c "ALTER ROLE postgres WITH LOGIN PASSWORD '${POSTGRES_PASSWORD:-postgres}';" 2>/dev/null || true

# Keep the container running
wait $PID
