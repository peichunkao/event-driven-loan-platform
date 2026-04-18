#!/usr/bin/env bash
set -euo pipefail
# Part A: ensure fnm Node and Corepack match repo .nvmrc (run from repo root)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v fnm >/dev/null 2>&1; then
  echo "Install fnm first: brew install fnm"
  exit 1
fi

eval "$(fnm env)"
fnm install
fnm use
corepack enable
node -v
pnpm -v 2>/dev/null || npm -v
echo "OK: Node active for this repo."
