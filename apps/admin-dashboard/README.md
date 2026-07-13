# BM Admin Dashboard

React + Vite admin portal. Docker service: **`admin-dashboard`**.

## Prerequisites

- Docker & Docker Compose
- Root `.env` (see `../../.env.example`)

## Start (Docker Compose)

**Full stack** (from repo root `BMBookingIntegrated/`):

```bash
cp .env.example .env   # first time only; set JWT_SECRET
docker compose up -d --build
```

**This app + API + database:**

```bash
# from repo root
docker compose up -d --build admin-dashboard backend db
```

**From this folder** (same command via `package.json`):

```bash
npm run docker:up
```

Open: **http://localhost:3000** (or `ADMIN_PORT` in `.env`).

## Stop / logs / restart

```bash
# repo root
docker compose stop admin-dashboard
docker compose logs -f admin-dashboard
docker compose restart admin-dashboard
```

```bash
# this folder
npm run docker:down
npm run docker:logs
npm run docker:restart
```

## Database seed (admin login)

```bash
docker compose exec backend npx prisma db push
docker compose exec backend npx prisma db seed
```

Login: `admin@bm-booking.com` / `Password@123`

## Environment

Configure in **`../.env`** — see [../docs/DOCKER-NETWORKING.md](../docs/DOCKER-NETWORKING.md):

| Variable | Purpose |
|----------|---------|
| `PUBLIC_API_URL` | Browser / upload URLs |
| `VITE_API_URL` | `/api` in app code |
| `VITE_API_PROXY_TARGET` | Set in compose: `http://backend:5000` (internal) |

## Production build (image / CI)

```bash
docker compose run --rm admin-dashboard npm run build
```

Or build static assets on the host: `npm run build` (requires `npm install` in this folder).

## Related

[../README.md](../README.md) · [../backend/README.md](../backend/README.md)
