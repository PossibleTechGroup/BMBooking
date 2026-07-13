#!/usr/bin/env bash
set -e

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

require_env

if [[ $# -eq 0 ]]; then
  compose logs -f
  exit 0
fi

# shellcheck disable=SC2207
SERVICES=($(resolve_services "$@"))
compose logs -f "${SERVICES[@]}"
