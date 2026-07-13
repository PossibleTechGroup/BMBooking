#!/usr/bin/env bash
set -e

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

if [[ -f "$ENV_FILE" ]]; then
  echo ".env already exists at $ENV_FILE"
else
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created $ENV_FILE"
fi

# Optional: detect LAN IP for physical-phone testing (Expo Go)
if grep -qE '^HOST_LAN_IP=$' "$ENV_FILE" 2>/dev/null; then
  DETECTED=""
  if command -v hostname >/dev/null 2>&1; then
    DETECTED=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  if [[ -n "$DETECTED" ]]; then
    echo ""
    echo "Detected LAN IP: $DETECTED (optional, for Expo Go on a physical phone)"
    REPLY="n"
    if [[ -t 0 ]]; then
      read -r -p "Set HOST_LAN_IP and PUBLIC_API_URL for phone testing? [y/N] " REPLY
    fi
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
      sed -i "s|^HOST_LAN_IP=.*|HOST_LAN_IP=$DETECTED|" "$ENV_FILE"
      sed -i "s|^PUBLIC_API_URL=.*|PUBLIC_API_URL=http://$DETECTED:5000|" "$ENV_FILE"
      sed -i "s|^PUBLIC_TELEBIRR_URL=.*|PUBLIC_TELEBIRR_URL=http://$DETECTED:8080|" "$ENV_FILE"
      sed -i "s|^EXPO_DEV_HOST=.*|EXPO_DEV_HOST=$DETECTED|" "$ENV_FILE"
      echo "Updated PUBLIC_* and EXPO_DEV_HOST for phone testing."
    fi
  fi
fi

TELEBIRR_ENV="$ROOT/apps/backend/telebirr-h5-integration/telebirr.credentials"
TELEBIRR_EXAMPLE="$ROOT/apps/backend/telebirr-h5-integration/telebirr.credentials.example"
if [[ ! -f "$TELEBIRR_ENV" && -f "$TELEBIRR_EXAMPLE" ]]; then
  cp "$TELEBIRR_EXAMPLE" "$TELEBIRR_ENV"
  echo "Created telebirr-h5-integration/telebirr.credentials"
fi
if [[ -f "$ROOT/apps/backend/telebirr-h5-integration/secrets.env" ]]; then
  echo "Run: apps/backend/scripts/migrate-telebirr-credentials.sh (secrets.env breaks Prisma — rename to telebirr.credentials)"
fi

echo ""
echo "Docker-first setup complete. Edit JWT_SECRET in .env if needed."
echo "Networking: docs/DOCKER-NETWORKING.md"
echo "Next:  npm run dev"
