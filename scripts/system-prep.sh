#!/bin/bash
# system-prep.sh - Centralized system preparation for Craft Fusion scripts
# Usage: source ./system-prep.sh OR bash ./system-prep.sh

set -euo pipefail

# Parse --power argument
POWER_MODE=false
for arg in "$@"; do
  if [ "$arg" == "--power" ]; then
    POWER_MODE=true
    export POWER_MODE=true
  fi
done

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
  # Only kill processes owned by current user, unless root
  if [ "$(id -u)" = "0" ]; then
    # As root, kill all except this script's own PID
    pkill -9 -f "$pname" --signal SIGKILL 2>/dev/null && PREP_SUMMARY+="\n  - Killed $pname processes (root)" || PREP_SUMMARY+="\n  - No $pname processes found (root)"
  else
    # As non-root, only kill own processes, never kill this script's own PID
    pids=$(pgrep -u "$(id -u)" -f "$pname" | grep -v "^$$\$" || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null && PREP_SUMMARY+="\n  - Killed $pname processes (user)" || PREP_SUMMARY+="\n  - Failed to kill $pname (user)"
    else
      PREP_SUMMARY+="\n  - No $pname processes found (user)"
    fi
  fi
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
if [ "$POWER_MODE" = true ]; then
  PREP_SUMMARY+="\nPower mode enabled: running system-optimize.sh with aggressive settings..."
  # --power is passed to system-optimize.sh if present
  if [ -x "$(dirname "$0")/system-optimize.sh" ]; then
    "$(dirname "$0")/system-optimize.sh" --power || PREP_SUMMARY+="\n(system-optimize.sh failed)"
  else
    PREP_SUMMARY+="\n(system-optimize.sh not found)"
  fi
else
  if [ -x "$(dirname "$0")/system-optimize.sh" ]; then
    PREP_SUMMARY+="\nRunning system-optimize.sh..."
    "$(dirname "$0")/system-optimize.sh" || PREP_SUMMARY+="\n(system-optimize.sh failed)"
  else
    PREP_SUMMARY+="\n(system-optimize.sh not found)"
  fi
fi

# 5. Print summary with available tools and usage tips
# Only print summary if run as a script, not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  printf "${BOLD}${CYAN}System Prep Complete:${NC}\n"
  IFS=$'\n'
  for line in $(echo -e "$PREP_SUMMARY"); do
    trimmed=$(echo "$line" | sed 's/^ *//;s/ *$//')
    [ -n "$trimmed" ] && echo -e "$trimmed"
  done
  unset IFS
fi
