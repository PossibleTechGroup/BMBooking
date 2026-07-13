#!/usr/bin/env bash
set -e

# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

require_env

echo "Container status:"
compose ps

print_urls
