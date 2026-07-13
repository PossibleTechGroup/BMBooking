# Docker networking & environment files

BM Booking runs with **Docker Compose** from the repository root:

```bash
cd BMBookingIntegrated
docker compose up -d --build
```

Compose **automatically loads** `.env` from the same folder as `docker-compose.yml`. You do **not** need `--env-file .env` for the default setup.

Use `--env-file` only for a **non-default** env file (e.g. `docker compose --env-file .env.production up -d`).

---

## How many `.env` files do you need?

| # | File | Required? | Purpose |
|---|------|-----------|---------|
| **1** | **`BMBookingIntegrated/.env`** | **Yes** | Single source for the full stack: DB, JWT, `PUBLIC_API_URL`, ports, Expo, Chapa/SMS keys |
| **2** | `apps/backend/telebirr-h5-integration/.env` | **Optional** | Telebirr merchant credentials only (real payments). Copy from `.env.example` in that folder |
| — | `apps/admin-dashboard/.env` | **Not for Docker** | Only if you run Vite on the host without Compose |
| — | `apps/reception/.env` | **Not for Docker** | Same |
| — | `apps/mobile/.env` | **Not for Docker** | Same |
| — | `apps/backend/.env` | **Not for root Compose** | Only for `cd apps/backend && docker compose up` (backend-only stack) |

**Summary:** use **one** root `.env` for normal development. Add a **second** file only if you configure live Telebirr payments.

### Where to create the main `.env`

```text
BMBookingIntegrated/          ← repo root (where docker-compose.yml lives)
├── .env.example           ← template (committed)
├── .env                   ← YOU CREATE THIS (gitignored)
├── docker-compose.yml
├── backend/
├── admin-dashboard/
├── reception/
└── mobile/
```

```bash
cd BMBookingIntegrated
cp .env.example .env
# edit .env — at minimum JWT_SECRET and DB_PASSWORD
```

Do **not** copy the root `.env` into subfolders for Docker. Compose reads **`BMBookingIntegrated/.env`** and injects values into every service.

Component `npm run docker:*` scripts use `-f ../docker-compose.yml`; Compose still picks up `../.env` next to that compose file.

### Optional Telebirr `.env` (file #2)

```text
backend/telebirr-h5-integration/
├── .env.example    ← template
└── .env            ← merchant keys (gitignored)
```

```bash
cp apps/backend/telebirr-h5-integration/.env.example apps/backend/telebirr-h5-integration/.env
```

Used when the Telebirr container needs `APP_SECRET`, `MERCHANT_CODE`, etc. Not required to start the stack; required for production Telebirr checkout.

`npm run setup` from the root can create both files.

---

## What goes in the root `.env`?

| Variable | Who consumes it |
|----------|-----------------|
| `JWT_SECRET`, `DB_*` | `backend` |
| `PUBLIC_API_URL`, `PUBLIC_TELEBIRR_URL` | `backend` (callbacks), `admin-dashboard`, `reception`, `mobile` (on device) |
| `ADMIN_PORT`, `RECEPTION_PORT`, … | Published ports in `docker-compose.yml` |
| `CHAPA_SECRET_KEY`, `AFROMESSAGE_*` | `backend` (optional) |

`docker-compose.yml` maps `PUBLIC_*` into each container. You do **not** duplicate these in per-app `.env` files when using Docker.

---

## Two kinds of URLs

| Kind | Who uses it | Example | Where it is set |
|------|-------------|---------|-----------------|
| **Internal** | Container → container | `http://backend:5000`, `db:5432` | `docker-compose.yml` (fixed) |
| **Public** | Browser, phone, Postman on the host | `http://localhost:5000` | Root `.env` → `PUBLIC_API_URL` |

```text
┌─────────────────────────────────────────────────────────────┐
│  Docker network (bm-network)                            │
│  ┌──────┐  ┌─────────┐  ┌────────┐  ┌───────┐              │
│  │  db  │  │ backend │  │telebirr│  │ admin │              │
│  └──┬───┘  └────┬────┘  └───┬────┘  └───┬───┘              │
│      └──────────┴───────────┴───────────┘                   │
│              http://backend:5000  (internal)                │
└─────────────────────────────────────────────────────────────┘
                                    │ published ports
┌───────────────────────────────────┼─────────────────────────┐
│  Host machine                     ▼                         │
│  Browser → http://localhost:3000 ──proxy──► backend:5000   │
│  Phone   → PUBLIC_API_URL (localhost or LAN IP)            │
│  Mobile  → npm run dev (outside Docker)                    │
└─────────────────────────────────────────────────────────────┘
```

### Why not `http://backend:5000` everywhere?

- **Admin / reception:** The browser runs on the **host**. Vite inside Docker proxies `/api` to `http://backend:5000` (internal). Image/upload links use `PUBLIC_API_URL` so the browser hits the **published** API port (`localhost:5000`).
- **Mobile:** The app runs on the **device** (outside Docker). Devices cannot resolve the hostname `backend`. They use `PUBLIC_API_URL` from the root `.env` or a local `apps/mobile/.env`.
- **Backend → Postgres:** Uses `db:5432` via `DATABASE_URL` built in `docker-compose.yml`.

---

## Defaults (same machine / simulators)

Root `.env`:

```env
PUBLIC_API_URL=http://localhost:5000
PUBLIC_TELEBIRR_URL=http://localhost:53402
```

No extra files needed.

---

## Physical phone (Expo Go on Wi‑Fi) — required settings

If Metro shows `exp://localhost:8081`, **Expo Go on your phone will fail** (`Failed to download remote update`). The phone cannot reach `localhost`.

Set your **laptop Wi‑Fi IP** when starting Expo:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:5000 \
EXPO_PUBLIC_TELEBIRR_URL=http://192.168.1.50:53402 \
npm run dev
```

Or create `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:5000
EXPO_PUBLIC_TELEBIRR_URL=http://192.168.1.50:53402
```

Find your IP: `hostname -I | awk '{print $1}'`

**Alternative:** `npm run dev:tunnel` (uses Expo tunnel; slower but works across networks).

| Client | `PUBLIC_API_URL` |
|--------|------------------|
| iOS Simulator (same host) | `http://localhost:5000` |
| Android emulator | `http://10.0.2.2:5000` |
| Physical phone | `http://<HOST_LAN_IP>:5000` |

---

## Do not change (already in Compose)

| Setting | Value | Reason |
|---------|-------|--------|
| `VITE_API_PROXY_TARGET` | `http://backend:5000` | Admin/reception container → API |
| `DATABASE_URL` host | `db` | Backend → Postgres |
| `SHEGA_BACKEND_URL` / `BM_BACKEND_URL` | `http://backend:5000` | Telebirr → API |

---

## Quick reference

```bash
# Repo root; ./.env is auto-loaded
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```
