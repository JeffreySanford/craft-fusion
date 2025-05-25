#!/bin/bash
# system-prep.sh - Centralized system preparation for Craft Fusion scripts
# Usage: source ./system-prep.sh OR bash ./system-prep.sh

set -euo pipefail

# Colors (define if not already set by parent script)
GREEN=${GREEN:-'\033[0;32m'}
RED=${RED:-'\033[0;31m'}
YELLOW=${YELLOW:-'\033[1;33m'}
BLUE=${BLUE:-'\033[0;34m'}
CYAN=${CYAN:-'\033[0;36m'}
BOLD=${BOLD:-'\033[1m'}
NC=${NC:-'\033[0m'}

PREP_SUMMARY=""

# 1. Kill lingering Node/Nx/PM2/build processes (non-root, non-critical)
PREP_SUMMARY+="\nKilling lingering build/Node/Nx/PM2 processes..."
for pname in node nx npm tsc pm2; do
  pkill -f "$pname" 2>/dev/null && PREP_SUMMARY+="\n  - Killed $pname processes" || PREP_SUMMARY+="\n  - No $pname processes found"
done

# 2. Drop filesystem caches (if root)
if [ "$(id -u)" = "0" ]; then
  sync && echo 3 > /proc/sys/vm/drop_caches && PREP_SUMMARY+="\nDropped filesystem caches (as root)"
else
  PREP_SUMMARY+="\nNot root: skipping drop_caches"
fi

# 3. Clear swap if in use (if root)
if [ "$(id -u)" = "0" ]; then
  SWAP_USED=$(free | awk '/^Swap:/ {print $3}')
  if [ "$SWAP_USED" -gt 0 ]; then
    swapoff -a && swapon -a && PREP_SUMMARY+="\nCleared swap memory"
  else
    PREP_SUMMARY+="\nNo swap in use"
  fi
else
  PREP_SUMMARY+="\nNot root: skipping swap clear"
fi

# 4. Optionally run system optimization script if present
if [ -x "$(dirname "$0")/system-optimize.sh" ]; then
  PREP_SUMMARY+="\nRunning system-optimize.sh..."
  "$(dirname "$0")/system-optimize.sh" || PREP_SUMMARY+="\n(system-optimize.sh failed)"
else
  PREP_SUMMARY+="\n(system-optimize.sh not found)"
fi

# 5. Print summary
printf "${BOLD}${CYAN}System Prep Complete:${NC}%s\n" "$PREP_SUMMARY"
