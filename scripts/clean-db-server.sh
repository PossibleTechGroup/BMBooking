echo "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;" | docker compose exec -T backend npx prisma db execute --stdin --schema prisma/schema.prisma
