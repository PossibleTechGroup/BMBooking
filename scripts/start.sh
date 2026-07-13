#!/usr/bin/env bash
set -e

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

load_env

up_args=(-d)
if [[ "${NO_BUILD:-}" != "true" ]]; then
  up_args+=(--build)
fi

if [[ $# -eq 0 ]]; then
  echo "Starting full Docker stack..."
  compose up "${up_args[@]}"
  exit 0
fi

# shellcheck disable=SC2207
SERVICES=($(resolve_services "$@"))
echo "Starting: ${SERVICES[*]}"
compose up "${up_args[@]}" "${SERVICES[@]}"
