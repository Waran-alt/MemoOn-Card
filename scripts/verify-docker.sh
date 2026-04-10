#!/usr/bin/env bash
# Validate Docker Compose files (syntax + interpolation) without starting containers.
# Uses dummy secrets only for `config -q`; do not use these values in production.
#
# Usage: bash scripts/verify-docker.sh
# Requires: docker compose v2 (docker CLI).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI not found; skipping compose validation." >&2
  exit 0
fi

export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-verify-docker-compose-dummy}"
export JWT_SECRET="${JWT_SECRET:-verify-docker-jwt-secret-32-chars-min}"

validate() {
  local file=$1
  shift
  echo "==> Validating ${file} $@"
  docker compose -f "$file" "$@" config -q
}

validate docker-compose.yml
validate docker-compose.prod.yml
validate docker-compose.monitoring.yml
validate docker-compose.deploy.yml

echo "OK: All Docker Compose files passed config validation."
