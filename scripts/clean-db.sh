#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🔄 Starting database wipe..."

# 1. Clear out the public schema using piped input
echo "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;" | \
docker compose exec -T backend npx prisma db execute --stdin --schema prisma/schema.prisma

echo "✅ Database schema wiped cleanly."

# 2. Push the current prisma schema
echo "🚀 Pushing Prisma schema..."
docker compose exec backend npx prisma db push


echo "✨ Database reset complete and ready to use!"