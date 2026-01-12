#!/usr/bin/env bash
set -euo pipefail

# clean-build.sh - Clean build artifacts (fast) or full clean when requested
# Usage:
#   ./scripts/clean-build.sh            # remove build outputs (dist, temp)
#   ./scripts/clean-build.sh --full-clean  # also remove node_modules and Nx caches

FULL=false
for arg in "$@"; do
  case "$arg" in
    --full-clean) FULL=true ;;
  esac
done

echo "[clean] Removing build outputs..."
sudo rm -rf dist/ 2>/dev/null || true
sudo rm -rf .angular/ 2>/dev/null || true

if [[ "$FULL" == "true" ]]; then
  echo "[clean] Full clean requested: removing node_modules and Nx caches..."
  sudo rm -rf node_modules 2>/dev/null || true
  sudo rm -rf .nx/cache 2>/dev/null || true
  sudo rm -rf node_modules/.cache/nx 2>/dev/null || true
fi

echo "[clean] Done."
