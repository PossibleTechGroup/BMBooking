#!/usr/bin/env bash
set -e

BACKEND_CONTAINER="bm-backend"

# Check if backend container is running
if ! docker ps --format '{{.Names}}' | grep -qx "$BACKEND_CONTAINER"; then
  echo "Backend container is not running: $BACKEND_CONTAINER"
  echo "Start it first using docker compose or docker run"
  exit 1
fi

echo "Running Prisma db push (schema sync)..."
docker exec -it "$BACKEND_CONTAINER" npx prisma db push

echo "Running Prisma seed..."
docker exec -it "$BACKEND_CONTAINER" npx prisma db seed

echo "Seeding complete."
echo "Default admin: admin@bm-booking.com / Password@123"