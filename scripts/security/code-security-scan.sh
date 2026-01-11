#!/bin/bash
# code-security-scan.sh - Project-wide code security scanner (SAST & dependency checks)
# Usage: bash scripts/code-security-scan.sh [--full|--quick]
#
# Scans all supported code in the repo for vulnerabilities, secrets, and risky patterns.
# Outputs vibrant, color-coded summaries. Modular for future Go/Rust migration.

set -e

# === COLORS ===
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

SCAN_MODE=${1:---quick}

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# --- Node/TypeScript SAST ---
echo -e "${BOLD}${CYAN}== Node.js/TypeScript SAST (semgrep, eslint) ==${NC}"
if command -v semgrep &>/dev/null; then
  semgrep --config=auto apps/ libs/ || true
else
  echo -e "${YELLOW}semgrep not found. Skipping SAST.${NC}"
fi
if command -v npx &>/dev/null; then
  npx eslint apps/ libs/ || true
else
  echo -e "${YELLOW}ESLint not found. Skipping lint.${NC}"
fi

# --- Dependency Checks ---
echo -e "${BOLD}${CYAN}== Node.js Dependency Audit (npm audit) ==${NC}"
if [ -f package.json ]; then
  npm audit --audit-level=moderate || true
else
  echo -e "${YELLOW}No package.json found. Skipping npm audit.${NC}"
fi

# --- Go SAST & Dependency Check ---
echo -e "${BOLD}${CYAN}== Go SAST & Dependency Check (gosec, govulncheck) ==${NC}"
if command -v gosec &>/dev/null; then
  gosec ./... || true
else
  echo -e "${YELLOW}gosec not found. Skipping Go SAST.${NC}"
fi
if command -v govulncheck &>/dev/null; then
  govulncheck ./... || true
else
  echo -e "${YELLOW}govulncheck not found. Skipping Go vuln check.${NC}"
fi

# --- Secret Scanning ---
echo -e "${BOLD}${CYAN}== Secret Scanning (truffleHog) ==${NC}"
if command -v trufflehog &>/dev/null; then
  trufflehog filesystem --directory . --no-update || true
else
  echo -e "${YELLOW}truffleHog not found. Skipping secret scan.${NC}"
fi

# --- Length/Complexity Checks (Basic) ---
echo -e "${BOLD}${CYAN}== File Length/Complexity Checks ==${NC}"
find apps/ libs/ -type f \( -name '*.js' -o -name '*.ts' -o -name '*.go' \) -exec wc -l {} + | sort -nr | head -10

# --- Summary ---
echo -e "${GREEN}✓ Code security scan complete.${NC}"
