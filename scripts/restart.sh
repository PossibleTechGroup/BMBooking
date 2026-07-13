#!/usr/bin/env bash
set -e

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

SCRIPT_DIR="$(dirname "$0")"

if [[ $# -eq 0 ]]; then
  "$SCRIPT_DIR/stop.sh"
  NO_BUILD="${NO_BUILD:-false}" "$SCRIPT_DIR/start.sh"
  exit 0
fi

# shellcheck disable=SC2207
SERVICES=($(resolve_services "$@"))
"$SCRIPT_DIR/stop.sh" "${SERVICES[@]}"
NO_BUILD="${NO_BUILD:-false}" "$SCRIPT_DIR/start.sh" "${SERVICES[@]}"
