# BM Booking

Healthcare monorepo — run everything with **Docker Compose** from this directory.

## Structure

```
apps/
  backend/          # Node.js API + Prisma (Postgres)
  admin-dashboard/  # Hospital admin panel (Vite + React)
  reception/        # Reception staff dashboard (Vite + React)
  mobile/           # Patient mobile app (Expo + React Native)
  tg-bot/           # Telegram bot (Node.js)
  tg-mini-app/      # Telegram Mini App (vanilla JS)
  landing/          # Public landing + legal pages (Next.js)
  docs/             # Documentation & API collections
scripts/            # Dev & deployment scripts
```

## Quick Start

```bash
cp .env.example .env
docker compose up -d --build
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `backend` | 52400 | API server |
| `admin-dashboard` | 53400 | Hospital admin |
| `reception` | 53401 | Reception dashboard |
| `telebirr-h5` | 53402 | Telebirr payments |
| `tg-mini-app` | 53403 | Telegram Mini App |
| `landing` | 53404 | Landing page + legal |
| `db` | 5433 | PostgreSQL |

## Docs

See [apps/docs/](apps/docs/) for architecture, API collections, and guides.

## Install (outside Docker)

```bash
npm run install:all
npm run dev:mobile
```
