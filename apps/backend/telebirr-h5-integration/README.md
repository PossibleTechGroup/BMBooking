# Telebirr H5 integration

Payment bridge for Telebirr checkout. Configuration file: **`telebirr.credentials`** (must **not** end in `.env`).

Prisma scans every `*.env` file under `backend/` (including `secrets.env`). PEM keys in those files break `prisma db push`.

## Setup

```bash
cp telebirr.credentials.example telebirr.credentials
# Edit telebirr.credentials — PRIVATE_KEY must be one quoted line (see example)
```

Migrating from `.env` or `secrets.env`:

```bash
bash ../scripts/migrate-telebirr-credentials.sh
```

## PRIVATE_KEY format

**Wrong** (`.envy` / backticks / bare PEM on the next line):

```
PRIVATE_KEY=`
-----BEGIN PRIVATE KEY-----
MIIEvgIBADAN...
```

**Right**:

```
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADAN...\n-----END PRIVATE KEY-----"
```

## Docker

Root compose loads `telebirr.credentials` via `env_file` on the `telebirr-h5` service.
