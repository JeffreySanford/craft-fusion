#!/bin/bash
# fedramp-oscal.sh - Run OpenSCAP (oscap) with selected SCAP Security Guide profile for Fedora
# Usage:
#   sudo ./scripts/fedramp-oscal.sh [standard|ospp|pci-dss|cusp]
#
# Runs an OpenSCAP (oscap) scan using the selected SCAP Security Guide profile for Fedora.
# Generates XML and HTML reports in ./oscal-analysis/ for each profile.
#
# Profiles:
#   standard   - Baseline security (recommended for most)
#   ospp       - Protection Profile for General Purpose Operating Systems
#   pci-dss    - Payment Card Industry Data Security Standard
#   cusp       - Custom User Security Profile (Fedora-specific)
#
# Example:
#   sudo ./scripts/fedramp-oscal.sh standard
#   sudo ./scripts/fedramp-oscal.sh ospp
#
# Reports:
#   XML:  ./oscal-analysis/oscap-results-<profile>.xml
#   HTML: ./oscal-analysis/oscap-report-<profile>.html
#
# Requires: openscap, scap-security-guide, xmllint (optional for summary)
#
# For vibrant environment summary and time estimate, see script output.

# === COLORS (ensure all used colors are defined) ===
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m'

OSCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/oscal-analysis"
mkdir -p "$OSCAL_DIR"

PROFILE=${1:-standard}
SUPPRESS_PRE_SCAN_SUMMARY_FLAG=$2 # Expects --no-summary or nothing
PROFILE_ID=""

case "$PROFILE" in
  standard)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_standard" ;;
  ospp)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_ospp" ;;
  pci-dss)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_pci-dss" ;;
  cusp)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_cusp_fedora" ;;
  *)
    echo "Unknown profile: $PROFILE"
    echo "Usage: $0 [standard|ospp|pci-dss|cusp]"
    exit 1
    ;;
esac

if [ "$SUPPRESS_PRE_SCAN_SUMMARY_FLAG" != "--no-summary" ]; then
  # === Actionable OSCAL Scans Summary (pre-scan check) ===
  OSCAL_PROFILES_TO_CHECK=(standard ospp pci-dss cusp)
  OSCAL_MAX_AGE_DAYS=7
  actionable_scans_display=()
  all_scans_ok=true

  echo -e "${BOLD}${CYAN}Checking status of all OSCAL profiles...${NC}"
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
    printf "${BOLD}${CYAN}Actionable OSCAL Scans:${NC} %s\n\n" "$(IFS=, ; echo "${actionable_scans_display[*]}")"
  else
    echo -e "${GREEN}✓ All OSCAL profiles appear up-to-date.${NC}\n"
  fi
  # === End of Actionable OSCAL Scans Summary (pre-scan check) ===
fi

SCAP_CONTENT="/usr/share/xml/scap/ssg/content/ssg-fedora-ds.xml"
RESULTS="$OSCAL_DIR/oscap-results-$PROFILE.xml"
REPORT="$OSCAL_DIR/oscap-report-$PROFILE.html"

if [ ! -f "$SCAP_CONTENT" ]; then
  echo "SCAP Security Guide content not found: $SCAP_CONTENT"
  exit 1
fi

# Vibrant OSCAL scan header for each profile
PROFILE_LABEL="Standard"
CURRENT_PROFILE_COLOR="$PURPLE" # Default color
if [ "$PROFILE" = "ospp" ]; then PROFILE_LABEL="OSPP"; CURRENT_PROFILE_COLOR="$CYAN"; fi
if [ "$PROFILE" = "pci-dss" ]; then PROFILE_LABEL="PCI-DSS"; CURRENT_PROFILE_COLOR="$YELLOW"; fi
if [ "$PROFILE" = "cusp" ]; then PROFILE_LABEL="CUSP"; CURRENT_PROFILE_COLOR="$GREEN"; fi

bar() {
  local label="$1"; local value="$2"; local max="$3"; local color="$4"
  value=${value:-0}
  max=${max:-10}
  color=${color:-$NC}
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then value=0; fi
  if ! [[ "$max" =~ ^[0-9]+$ ]]; then max=10; fi
  local n=$((value > max ? max : value))
  printf "%s%-18s [" "$color" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "] %s min%s\n" "$value" "$NC"
}

CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')
OSCAL_EST=3
if [ "$CPU_CORES" -le 1 ]; then OSCAL_EST=7; fi
if [ "$CPU_CORES" -le 2 ]; then OSCAL_EST=5; fi
if [ "$MEM_TOTAL_MB" -lt 1500 ]; then OSCAL_EST=$((OSCAL_EST+2)); fi

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🛡️  FedRAMP OSCAL Scan: %-10s Environment      ║\n" "$PROFILE_LABEL"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
bar "OSCAL $PROFILE_LABEL" $OSCAL_EST 10 "$CURRENT_PROFILE_COLOR"
echo -e "${BOLD}${WHITE}Estimated Time: ~${OSCAL_EST} min${NC}\n"

echo -e "${BOLD}${CYAN}Running OpenSCAP scan with profile: ${YELLOW}$PROFILE_ID${NC}"
oscap xccdf eval --profile "$PROFILE_ID" \
  --results "$RESULTS" \
  --report "$REPORT" \
  "$SCAP_CONTENT"

# After OpenSCAP scan, parse and print vibrant pass/fail summary with progress bars
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ OpenSCAP scan complete.${NC}"
  echo -e "${WHITE}Results: ${CYAN}$RESULTS${NC}"
  echo -e "${WHITE}HTML Report: ${CYAN}$REPORT${NC}"
  # Show vibrant pass/fail summary for each control if xmllint is available
  if command -v xmllint &>/dev/null; then
    TOTAL=$(xmllint --xpath 'count(//rule-result)' "$RESULTS" 2>/dev/null)
    PASS=$(xmllint --xpath 'count(//rule-result[result="pass"])' "$RESULTS" 2>/dev/null)
    FAIL=$(xmllint --xpath 'count(//rule-result[result="fail"])' "$RESULTS" 2>/dev/null)
    OTHER=$((TOTAL - PASS - FAIL))
    echo -e "${BOLD}${CYAN}\nFedRAMP OSCAL Control Results:${NC}"
    echo -e "${GREEN}Pass: $PASS${NC}  ${RED}Fail: $FAIL${NC}  ${YELLOW}Other: $OTHER${NC}  ${WHITE}Total: $TOTAL${NC}"
    # Print a vibrant progress bar for each control
    xmllint --xpath '//rule-result' "$RESULTS" 2>/dev/null | \
      grep -oP '<rule-result[\s\S]*?</rule-result>' | \
      while read -r rule; do
        TITLE=$(echo "$rule" | grep -oP 'idref="[^"]+"' | cut -d'"' -f2)
        RESULT=$(echo "$rule" | grep -oP '<result>[^<]+</result>' | sed 's/<\/?result>//g')
        COLOR="$WHITE"; BAR_COLOR="$WHITE"; ICON="·"
        if [ "$RESULT" = "pass" ]; then COLOR="$GREEN"; BAR_COLOR="$GREEN"; ICON="✓"; fi
        if [ "$RESULT" = "fail" ]; then COLOR="$RED"; BAR_COLOR="$RED"; ICON="✗"; fi
        if [ "$RESULT" = "notapplicable" ]; then COLOR="$YELLOW"; BAR_COLOR="$YELLOW"; ICON="!"; fi
        printf "%b%-40s %b%-8s %b" "$COLOR" "$TITLE" "$BAR_COLOR" "$RESULT" "$NC"
        # Progress bar: pass=full green, fail=full red, notapplicable=yellow
        if [ "$RESULT" = "pass" ]; then printf " [${GREEN}████████${NC}] "; fi
        if [ "$RESULT" = "fail" ]; then printf " [${RED}████████${NC}] "; fi
        if [ "$RESULT" = "notapplicable" ]; then printf " [${YELLOW}████████${NC}] "; fi
        printf "%b\n" "$NC"
      done
  fi
else
  echo -e "${RED}✗ OpenSCAP scan failed.${NC}"
fi
