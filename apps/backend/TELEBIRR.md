# Telebirr H5 (from your zip only)

Only **telebirr-h5-integration** from `telebirr-h5-integration.tar.gz` is used — no separate telebirr-api service.

## What it does

- Serves H5 payment pages (test.html, driver-topup, etc.)
- `POST /create/order` — builds Telebirr payment URL
- `POST /verify-payment` — webhook when Telebirr confirms payment

## Run with BM Booking

```bash
cd ~/Documents/BM Booking/backend
docker compose up -d
```

| Service | Port |
|---------|------|
| BM Booking API | 5000 |
| PostgreSQL | 5433 |
| **Telebirr H5** | **53402** |

- H5 UI: http://localhost:53402/
- Docker env: `telebirr-h5-integration/.env.docker` (credentials; not committed)

## Extract zip manually (if needed)

```bash
cd ~/Documents/BM Booking/backend
tar -xzf telebirr-h5-integration.tar.gz \
  --exclude='telebirr-h5-integration/.git' \
  --exclude='telebirr-h5-integration/node_modules'
```
