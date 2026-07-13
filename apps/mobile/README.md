# BM Booking Mobile

Expo app (patients & doctors). Runs **outside** Docker — natively on your machine.

## Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- Docker stack running (`db`, `backend`, `telebirr-h5` from repo root)
- `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_TELEBIRR_URL` configured (see below)

## Quick start

```bash
# Terminal 1 — start Docker services
cd ../..
docker compose up -d --build db backend telebirr-h5 admin-dashboard reception

# Terminal 2 — start Expo locally
cd apps/mobile
npm run dev
```

Or from repo root:

```bash
npm run docker:bootstrap   # starts Docker stack
npm run dev:mobile         # starts Expo locally
```

Metro: **http://localhost:8081** — scan QR code with Expo Go.

## Environment

Variables are read from the **root `../../.env`** at build time. The app also
falls back to sensible defaults for local development (see `constants/api.ts`).

| Variable | Purpose | Default for dev |
|----------|---------|-----------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |
| `EXPO_PUBLIC_TELEBIRR_URL` | Telebirr H5 URL | `http://localhost:53402` |
| `EXPO_PUBLIC_LOCAL_IP` | LAN IP override (phone testing) | `192.168.1.21` (fallback) |

Set `EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:5000` when testing on a
physical phone (same Wi‑Fi). The `../scripts/setup.sh` script can help detect
your IP.

## Physical phone (Expo Go on Wi‑Fi)

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:5000 \
EXPO_PUBLIC_TELEBIRR_URL=http://192.168.1.50:53402 \
npm run dev
```

Or edit `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:5000
EXPO_PUBLIC_TELEBIRR_URL=http://192.168.1.50:53402
```

## Related

[../README.md](../README.md) · [../backend/README.md](../backend/README.md) · [../docs/DOCKER-NETWORKING.md](../docs/DOCKER-NETWORKING.md)
