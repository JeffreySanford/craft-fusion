#!/bin/bash
# fedramp-minor.sh - Run all OSCAL/FedRAMP OpenSCAP scans (all profiles) and ensure reports are user-readable

set -e

PROFILES=(standard ospp pci-dss cusp)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OSCAL_DIR="$SCRIPT_DIR/../oscal-analysis"

mkdir -p "$OSCAL_DIR"

for profile in "${PROFILES[@]}"; do
  echo -e "\033[1;36m\n=== Running OSCAL scan for profile: $profile ===\033[0m"
  sudo "$SCRIPT_DIR/fedramp-oscal.sh" "$profile"
  # Make results user-readable
  sudo chown "$USER":"$USER" "$OSCAL_DIR"/oscap-results-$profile.xml "$OSCAL_DIR"/oscap-report-$profile.html 2>/dev/null || true
  # Also handle legacy names for standard
  if [ "$profile" = "standard" ]; then
    sudo chown "$USER":"$USER" "$OSCAL_DIR"/oscap-results.xml "$OSCAL_DIR"/oscap-report.html 2>/dev/null || true
  fi
done

echo -e "\033[1;32mAll OSCAL scans complete. Reports are user-readable in $OSCAL_DIR.\033[0m"
