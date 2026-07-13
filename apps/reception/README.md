# BM Booking Reception

React + Vite app for reception staff. Docker service: **`reception`**.

## Prerequisites

- Docker & Docker Compose
- Root `.env` (see `../../.env.example`)

## Start (Docker Compose)

**Full stack** (from repo root):

```bash
cp .env.example .env
docker compose up -d --build
```

**This app + API + database:**

```bash
docker compose up -d --build reception backend db
```

**From this folder:**

```bash
npm run docker:up
```

Open: **http://localhost:3001** (or `RECEPTION_PORT` in `.env`).

## Stop / logs / restart

```bash
docker compose stop reception
docker compose logs -f reception
docker compose restart reception
```

```bash
npm run docker:down
npm run docker:logs
npm run docker:restart
```

## Environment

**`../.env`** — [../docs/DOCKER-NETWORKING.md](../docs/DOCKER-NETWORKING.md):

| Variable | Purpose |
|----------|---------|
| `PUBLIC_API_URL` | Public API / media URLs |
| `VITE_API_URL` | `/api` prefix |
| `VITE_API_PROXY_TARGET` | `http://backend:5000` in compose |

API client: `src/api/client.ts`.

## Production build

```bash
docker compose run --rm reception npm run build
```

## Related

[../README.md](../README.md) · [../backend/README.md](../backend/README.md)
