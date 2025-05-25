#!/bin/bash
# fedramp-minor.sh - Run all OSCAL/FedRAMP OpenSCAP scans (all profiles) and ensure reports are user-readable


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

set -e # Set after color definitions to ensure they are always set

mkdir -p "$OSCAL_DIR"

echo -e "${BOLD}${CYAN}🛡️  FedRAMP Minor Scan: Running all OSCAL profiles${NC}"
echo -e "${WHITE}This will run standard, ospp, pci-dss, and cusp scans${NC}"
echo

# === Actionable OSCAL Scans Summary ===
OSCAL_PROFILES_TO_CHECK=(standard ospp pci-dss cusp)
OSCAL_MAX_AGE_DAYS=7
actionable_scans_display=()
all_scans_ok=true

echo -e "${BOLD}${CYAN}Checking status of all OSCAL profiles before running scans...${NC}"
for profile_to_check in "${OSCAL_PROFILES_TO_CHECK[@]}"; do
    current_profile_result_file=""
    # Define potential file names
    user_readable_profile_specific="$OSCAL_DIR/user-readable-results-$profile_to_check.xml"
    admin_profile_specific="$OSCAL_DIR/oscap-results-$profile_to_check.xml"
    user_readable_generic_standard="$OSCAL_DIR/user-readable-results.xml" # Only for standard profile legacy
    admin_generic_standard="$OSCAL_DIR/oscap-results.xml"               # Only for standard profile legacy

    # Prefer user-readable files
    if [ -f "$user_readable_profile_specific" ]; then
        current_profile_result_file="$user_readable_profile_specific"
    elif [ "$profile_to_check" = "standard" ]; then # Check for legacy standard files
        if [ -f "$user_readable_generic_standard" ]; then
            current_profile_result_file="$user_readable_generic_standard"
        elif [ -f "$admin_generic_standard" ]; then
            current_profile_result_file="$admin_generic_standard"
        fi
    fi
    # Fallback to admin profile-specific if no user-readable or generic standard found
    if [ -z "$current_profile_result_file" ] && [ -f "$admin_profile_specific" ]; then
        current_profile_result_file="$admin_profile_specific"
    fi

    if [ -n "$current_profile_result_file" ] && [ -f "$current_profile_result_file" ]; then
        LAST_RUN=$(stat -c %Y "$current_profile_result_file")
        NOW_TS=$(date +%s)
        AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
        if [ "$AGE_DAYS" -gt "$OSCAL_MAX_AGE_DAYS" ]; then
            actionable_scans_display+=("${YELLOW}${profile_to_check} (stale - $AGE_DAYS days old)${NC}")
            all_scans_ok=false
        fi
    else
        actionable_scans_display+=("${RED}${profile_to_check} (missing)${NC}")
        all_scans_ok=false
    fi
done

if [ "$all_scans_ok" = false ] && [ ${#actionable_scans_display[@]} -gt 0 ]; then
  printf "${BOLD}${CYAN}Actionable OSCAL Scans (before running new scans):${NC} %s\n\n" "$(IFS=, ; echo "${actionable_scans_display[*]}")"
else
  echo -e "${GREEN}✓ All OSCAL profiles appear up-to-date before running new scans.${NC}\n"
fi
# === End of Actionable OSCAL Scans Summary ===

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
