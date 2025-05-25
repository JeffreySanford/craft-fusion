#!/bin/bash
# fedramp-minor.sh - Run all OSCAL/FedRAMP OpenSCAP scans (all profiles) and ensure reports are user-readable

set -e

PROFILES=(standard ospp pci-dss cusp)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OSCAL_DIR="$SCRIPT_DIR/../oscal-analysis"

# === COLORS ===
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'
WHITE='\033[1;37m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'

mkdir -p "$OSCAL_DIR"

echo -e "${BOLD}${CYAN}🛡️  FedRAMP Minor Scan: Running all OSCAL profiles${NC}"
echo -e "${WHITE}This will run standard, ospp, pci-dss, and cusp scans${NC}"
echo

for profile in "${PROFILES[@]}"; do
  echo -e "${BOLD}${CYAN}=== Running OSCAL scan for profile: $profile ===${NC}"
  
  if sudo "$SCRIPT_DIR/fedramp-oscal.sh" "$profile"; then
    echo -e "${GREEN}✓ $profile scan completed${NC}"
    
    # Create user-readable copies with simplified names
    ADMIN_XML="$OSCAL_DIR/oscap-results-$profile.xml"
    ADMIN_HTML="$OSCAL_DIR/oscap-report-$profile.html"
    USER_XML="$OSCAL_DIR/user-readable-results-$profile.xml"
    USER_HTML="$OSCAL_DIR/user-readable-report-$profile.html"
    
    # Copy admin files to user-readable versions
    if [ -f "$ADMIN_XML" ]; then
      sudo cp "$ADMIN_XML" "$USER_XML"
      sudo chown "$USER":"$USER" "$USER_XML"
      echo -e "  ${CYAN}Created user-readable: $USER_XML${NC}"
    fi
    
    if [ -f "$ADMIN_HTML" ]; then
      sudo cp "$ADMIN_HTML" "$USER_HTML"
      sudo chown "$USER":"$USER" "$USER_HTML"
      echo -e "  ${CYAN}Created user-readable: $USER_HTML${NC}"
    fi
    
    # Also handle legacy names for standard
    if [ "$profile" = "standard" ]; then
      if [ -f "$OSCAL_DIR/oscap-results.xml" ]; then
        sudo cp "$OSCAL_DIR/oscap-results.xml" "$OSCAL_DIR/user-readable-results.xml"
        sudo chown "$USER":"$USER" "$OSCAL_DIR/user-readable-results.xml"
      fi
      if [ -f "$OSCAL_DIR/oscap-report.html" ]; then
        sudo cp "$OSCAL_DIR/oscap-report.html" "$OSCAL_DIR/user-readable-report.html"
        sudo chown "$USER":"$USER" "$OSCAL_DIR/user-readable-report.html"
      fi
    fi
  else
    echo -e "${RED}✗ $profile scan failed${NC}"
  fi
  echo
done

echo -e "${BOLD}${GREEN}🎉 All OSCAL scans complete!${NC}"
echo -e "${WHITE}Admin reports (root-owned): ${CYAN}$OSCAL_DIR/oscap-*${NC}"
echo -e "${WHITE}User-readable copies: ${CYAN}$OSCAL_DIR/user-readable-*${NC}"
