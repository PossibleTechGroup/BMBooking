# Hospital & Reception Admin Guide

Admin manages **hospitals** (with visit **card price** in ETB), **receptionist accounts**, and **medical tools** linked to a hospital. Reception staff can update their hospital’s card price.

## Hospital model

| Field | Description |
|-------|-------------|
| `name` | Unique facility name |
| `address`, `phone`, `email` | Contact / location |
| `latitude`, `longitude` | Map coordinates |
| `cardPrice` | Visit / registration **card fee (ETB)** |

## Admin API (`/api/admin`, Bearer admin JWT)

| Method | Path | Body |
|--------|------|------|
| `GET` | `/hospitals` | — |
| `POST` | `/hospitals` | `{ name, cardPrice, address?, phone?, email?, latitude?, longitude? }` |
| `PUT` | `/hospitals/:id` | Partial hospital fields |
| `GET` | `/receptionists` | — |
| `POST` | `/receptionists` | `{ username, password, hospitalId, phone?, email? }` |
| `POST` | `/equipment` | `{ name, category, hospitalId, ... }` (multipart optional `photo`) |

## Reception API (`/api/receptionist`, Bearer receptionist JWT)

| Method | Path | Body |
|--------|------|------|
| `GET` | `/hospital` | Current hospital profile |
| `PATCH` | `/hospital/card-price` | `{ cardPrice }` |

## Admin dashboard

- **Hospitals** — create/edit hospitals and card price; create receptionists with hospital assignment.
- **Medical Tools** — required **hospital** dropdown; **+ New** opens inline hospital create, then posts tool with `hospitalId`.
- **Tool Alert** — optional hospital filter by `hospitalId`.

## Reception web

- **Hospital** sidebar — view facility details and update **card price**.

## Database migration

From **repo root** (Docker):

```bash
docker compose exec backend npx prisma db push
docker compose exec backend npx prisma db seed
```

If Prisma fails on a Telebirr `*.env` file, run `apps/backend/scripts/migrate-telebirr-credentials.sh` and fix `PRIVATE_KEY` quoting — see [apps/backend/README.md](../../apps/backend/README.md).

Seed sets default `cardPrice: 50` on sample hospitals.
