#!/usr/bin/env bash
# Run docker compose with merged env files (interpolation only). Order: root → backend → frontend
# (later keys override earlier). Files that are missing are skipped.
#
# Must run on the Docker host (where the docker CLI exists). App images do not ship docker;
# if you see "command not found: docker" you likely ran root `yarn dev` inside a container with
# working dir /app — use `yarn workspace @memoon-card/backend dev` instead (see documentation/TROUBLESHOOTING.md).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI not found. This script is for your machine (host), not inside an app container." >&2
  if [[ -f /.dockerenv ]]; then
    echo "Inside a container: from /app run: yarn workspace @memoon-card/backend dev" >&2
  fi
  exit 127
fi

env_args=()
for f in .env backend/.env frontend/.env; do
  if [[ -f "$f" ]]; then
    env_args+=(--env-file "$f")
  fi
done

exec docker compose "${env_args[@]}" "$@"
