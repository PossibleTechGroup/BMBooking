#!/usr/bin/env bash
# Shared helpers for BM Booking Docker scripts.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.yml"
ENV_FILE="$ROOT/.env"
ENV_EXAMPLE="$ROOT/.env.example"

resolve_service() {
  case "$1" in
    admin|admin-dashboard) echo "admin-dashboard" ;;
    reception) echo "reception" ;;
    # mobile runs outside Docker — no compose service
    backend|api) echo "backend" ;;
    db|postgres) echo "db" ;;
    telebirr|telebirr-h5) echo "telebirr-h5" ;;
    "") echo "" ;;
    *) echo "$1" ;;
  esac
}

resolve_services() {
  local out=()
  for arg in "$@"; do
    out+=("$(resolve_service "$arg")")
  done
  echo "${out[@]}"
}

require_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing $ENV_FILE"
    echo "Run:  npm run setup   (or:  cp .env.example .env)"
    exit 1
  fi
}

load_env() {
  require_env
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
}

compose() {
  # .env next to docker-compose.yml is loaded automatically — no --env-file needed
  docker compose -f "$COMPOSE_FILE" "$@"
}

wait_for_db() {
  echo "Waiting for PostgreSQL..."
  for _ in $(seq 1 30); do
    if compose exec -T db pg_isready -U "${DB_USER:-postgres}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "PostgreSQL did not become ready in time."
  return 1
}

wait_for_backend() {
  local url="${PUBLIC_API_URL:-http://localhost:5000}"
  local health="${url%/}/health"
  echo "Waiting for backend at $health ..."
  for _ in $(seq 1 60); do
    if curl -sf "$health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Backend did not become healthy in time."
  return 1
}

print_urls() {
  load_env
  local api="${PUBLIC_API_URL:-http://localhost:5000}"
  cat <<EOF

BM Booking (Docker) — open on the host
───────────────────────────────────────────────────────────────
  API (PUBLIC_API_URL)   $api
  Admin dashboard        http://localhost:${ADMIN_PORT:-3000}
  Reception              http://localhost:${RECEPTION_PORT:-3001}
  Telebirr H5            http://localhost:${TELEBIRR_H5_PORT:-8080}

Inside Docker (automatic — do not put in browser code)
───────────────────────────────────────────────────────────────
  backend:5000, db:5432 — see docs/DOCKER-NETWORKING.md

Mobile (runs outside Docker)
───────────────────────────────────────────────────────────────
  cd apps/mobile && npm run dev    (or: npm run dev:mobile)

Commands: npm run status | stop | logs:backend

EOF
}

# mobile runs outside Docker — see apps/mobile/README.md
