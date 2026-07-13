# BM Backend

Express + Prisma API. Docker service: **`backend`** (Postgres: **`db`**, Telebirr: **`telebirr-h5`**).

## Prerequisites

- Docker & Docker Compose
- Root `.env` (see `../../.env.example`)

## Start (Docker Compose)

**Full stack** (from repo root):

```bash
cp .env.example .env
docker compose up -d --build
```

**API + database + Telebirr:**

```bash
docker compose up -d --build backend db telebirr-h5
```

**From this folder:**

```bash
npm run docker:up
```

**Backend-only** (uses `backend/docker-compose.yml`):

```bash
docker compose up -d --build
npm run docker:up:local
```

Health: `curl http://localhost:5000/health` (or `PUBLIC_API_URL` from `.env`).

## Database

Run from **repo root** (`BMBookingIntegrated/`), not `backend/` (service name is `backend` in root compose, `app` in `backend/docker-compose.yml`):

```bash
cd ..   # if you are in backend/
docker compose exec backend npx prisma db push
docker compose exec backend npx prisma db seed
```

Or from `backend/`:

```bash
npm run docker:push
npm run docker:seed
```

### Prisma error: `unexpected character "/"` in Telebirr env

Prisma scans every file matching `*.env` under `backend/` (including `secrets.env`). Telebirr PEM keys must **not** live in any `*.env` file.

1. Run: `bash scripts/migrate-telebirr-credentials.sh` (renames to `telebirr.credentials`)
2. Fix `PRIVATE_KEY` to one **double-quoted** line with `\n` (see `telebirr.credentials.example`)
3. From repo root: `docker compose exec backend npx prisma db push`

Telebirr loads `telebirr.credentials` via `telebirr-h5-integration/load-env.js`.

Admin after seed: `admin@bm-booking.com` / `Password@123`

## Stop / logs / restart

```bash
docker compose stop backend telebirr-h5
docker compose logs -f backend
docker compose restart backend
```

```bash
npm run docker:down
npm run docker:logs
npm run docker:restart
```

## Environment

**`../.env`** — [../docs/DOCKER-NETWORKING.md](../docs/DOCKER-NETWORKING.md):

| Variable | Role |
|----------|------|
| `PUBLIC_API_URL` | URL for browsers / phones |
| `JWT_SECRET`, `DB_*` | Auth and database |
| `DATABASE_URL` | Uses host `db` inside compose |

## API

| Method | Endpoint |
|--------|----------|
| `GET` | `/health` |
| `POST` | `/api/auth/request-otp` |
| `POST` | `/api/auth/verify-otp` |
| `POST` | `/api/admin/login` |

Postman: `docs/api-collections/bm-postman.json` → `baseUrl` = `PUBLIC_API_URL`.

## Layout

```
backend/
├── src/
├── prisma/
├── docker-compose.yml    # backend-only stack
└── Dockerfile
```

## Related

[../README.md](../README.md) · [../admin-dashboard/README.md](../admin-dashboard/README.md)
