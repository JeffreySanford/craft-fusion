#!/bin/bash
# FedRAMP Rev 5 Security Controls Monitoring Script (Lite)
# Checks AC-2 (UID 0 accounts) and CM-7 (world-writable files) every minute

# Set project root for relative paths
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OSCAL_DIR="$PROJECT_ROOT/oscal-analysis"
OSCAL_STANDARD_RESULT_FILE="$OSCAL_DIR/oscap-results-standard.xml" # Specific to standard profile
OSCAL_STANDARD_REPORT_FILE="$OSCAL_DIR/oscap-report-standard.html"
OSCAL_MAX_AGE_DAYS=7

# Ensure oscal-analysis directory exists (with sudo if needed)
if [ ! -d "$OSCAL_DIR" ]; then
  if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Creating oscal-analysis directory with sudo...${NC}"
    sudo mkdir -p "$OSCAL_DIR"
    sudo chown "$USER":"$USER" "$OSCAL_DIR"
  else
    mkdir -p "$OSCAL_DIR"
  fi
fi

# If no OSCAL scan results for "standard" profile, run the standard scan automatically
if [ ! -f "$OSCAL_STANDARD_RESULT_FILE" ] && [ ! -f "$OSCAL_DIR/user-readable-results-standard.xml" ] && [ ! -f "$OSCAL_DIR/oscap-results.xml" ]; then # Check primary, user-readable, and generic legacy for standard
  echo -e "${YELLOW}[OSCAL] No OpenSCAP scan results found! Running standard scan...${NC}"
  if [ -x "$PROJECT_ROOT/scripts/fedramp-oscal.sh" ]; then
    sudo "$PROJECT_ROOT/scripts/fedramp-oscal.sh" standard
  else
    echo -e "${RED}fedramp-oscal.sh not found or not executable!${NC}"
  fi
fi

# Use a user-writable log file
LOG_FILE="$PROJECT_ROOT/fedramp-monitor.log"

SCAN_INTERVAL=60

# === COLORS ===
# Use tput for color codes to avoid bash arithmetic errors
GREEN=$(tput setaf 2)
BLUE=$(tput setaf 4)
YELLOW=$(tput setaf 3)
RED=$(tput setaf 1)
NC=$(tput sgr0)
BOLD=$(tput bold)
WHITE=$(tput setaf 7)
PURPLE=$(tput setaf 5)
CYAN=$(tput setaf 6)
MAGENTA=$(tput setaf 5)

# Defensive: ensure color variables are always set
: "${GREEN:=$(tput setaf 2)}"
: "${BLUE:=$(tput setaf 4)}"
: "${YELLOW:=$(tput setaf 3)}"
: "${RED:=$(tput setaf 1)}"
: "${NC:=$(tput sgr0)}"
: "${BOLD:=$(tput bold)}"
: "${WHITE:=$(tput setaf 7)}"
: "${PURPLE:=$(tput setaf 5)}"
: "${CYAN:=$(tput setaf 6)}"
: "${MAGENTA:=$(tput setaf 5)}"

# Defensive: bar fallback values
bar() {
  local label="$1"; local value="$2"; local max="$3"; local color="$4"
  value=${value:-0}
  max=${max:-30}
  color=${color:-$NC}
  # Defensive: ensure value and max are valid integers
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then value=0; fi
  if ! [[ "$max" =~ ^[0-9]+$ ]]; then max=30; fi
  local n=$((value > max ? max : value))
  printf "%s%-18s [" "$color" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "]%s %s\n" "$NC" "$value"
}

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🛡️  FedRAMP Monitor Environment              ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"

# Check for recent OSCAL (OpenSCAP) scan results
while true; do
  NOW=$(date -u '+%a %b %d %I:%M:%S %p UTC %Y')
  {
    echo -e "${BOLD}${CYAN}==== FedRAMP Security Scan (Lite): $NOW ====${NC}"
    echo -e "${MAGENTA}Controls Checked: 2 (AC-2, CM-7)${NC}"

    # OSCAL/SCAP scan check for all profiles
    echo -e "${BOLD}${CYAN}🛡️  OSCAL/FedRAMP Compliance Scan:${NC}"

    # Show OSCAL scan status for all profiles
    OSCAL_PROFILES=(standard ospp pci-dss cusp medium-high rev5 truenorth) # Added truenorth profile

    missing_profiles=()
    missing_standard=false # Initialize missing_standard flag
    for profile in "${OSCAL_PROFILES[@]}"; do
      # Determine the most relevant result file for the current profile
      current_profile_result_file=""
      current_profile_report_file=""

      # Define potential file names
      user_readable_profile_specific="$OSCAL_DIR/user-readable-results-$profile.xml"
      admin_profile_specific="$OSCAL_DIR/oscap-results-$profile.xml"
      user_readable_generic_standard="$OSCAL_DIR/user-readable-results.xml" # Only for standard profile legacy
      admin_generic_standard="$OSCAL_DIR/oscap-results.xml"               # Only for standard profile legacy

      # Prefer user-readable files
      if [ -f "$user_readable_profile_specific" ]; then
        current_profile_result_file="$user_readable_profile_specific"
        current_profile_report_file="${user_readable_profile_specific/.xml/.html}"
      elif [ "$profile" = "standard" ]; then
        if [ -f "$user_readable_generic_standard" ]; then
          current_profile_result_file="$user_readable_generic_standard"
          current_profile_report_file="${user_readable_generic_standard/.xml/.html}"
        elif [ -f "$admin_generic_standard" ]; then
          current_profile_result_file="$admin_generic_standard"
          current_profile_report_file="${admin_generic_standard/.xml/.html}"
        fi
      fi
      # Fallback to admin profile-specific if no user-readable or generic standard found
      if [ -z "$current_profile_result_file" ] && [ -f "$admin_profile_specific" ]; then
          current_profile_result_file="$admin_profile_specific"
          current_profile_report_file="${admin_profile_specific/.xml/.html}"
      fi

      if [ -n "$current_profile_result_file" ] && [ -f "$current_profile_result_file" ]; then
        LAST_RUN=$(stat -c %Y "$current_profile_result_file")
        NOW_TS=$(date +%s)
        AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
        printf "   ${GREEN}✓ %s scan found (%d days ago)${NC}\n" "$profile" "$AGE_DAYS"
        printf "   Report: ${CYAN}%s${NC}\n" "$current_profile_report_file"
        if command -v xmllint &>/dev/null; then
          # Use more robust XPath and add notapplicable
          TOTAL_XPATH="count(//TestResult//rule-result)"
          PASS_XPATH="count(//TestResult//rule-result[result='pass'])"
          FAIL_XPATH="count(//TestResult//rule-result[result='fail'])"
          NOTAPPLICABLE_XPATH="count(//TestResult//rule-result[result='notapplicable'])"
          TOTAL=$(xmllint --xpath "$TOTAL_XPATH" "$current_profile_result_file" 2>/dev/null)
          PASS=$(xmllint --xpath "$PASS_XPATH" "$current_profile_result_file" 2>/dev/null)
          FAIL=$(xmllint --xpath "$FAIL_XPATH" "$current_profile_result_file" 2>/dev/null)
          NOTAPPLICABLE=$(xmllint --xpath "$NOTAPPLICABLE_XPATH" "$current_profile_result_file" 2>/dev/null)
          PASS=${PASS:-0}
          FAIL=${FAIL:-0}
          TOTAL=${TOTAL:-0}
          NOTAPPLICABLE=${NOTAPPLICABLE:-0}
          if [[ "$PASS" =~ ^[0-9]+$ ]] && [[ "$FAIL" =~ ^[0-9]+$ ]] && [[ "$TOTAL" =~ ^[0-9]+$ ]] && [[ "$NOTAPPLICABLE" =~ ^[0-9]+$ ]]; then
            printf "   ${GREEN}Pass: %s${NC}  ${RED}Fail: %s${NC}  ${YELLOW}N/A: %s${NC}  ${WHITE}Total: %s${NC}\n" "$PASS" "$FAIL" "$NOTAPPLICABLE" "$TOTAL"
          fi
        fi
      else
        missing_profiles+=("$profile")
        if [ "$profile" = "standard" ]; then
          missing_standard=true # Set flag if standard profile is missing
        fi
        # Add a note for placeholder profiles if they are missing
        if [ "$profile" = "medium-high" ] || [ "$profile" = "rev5" ]; then
          local profile_label_temp="$profile"
          if [ "$profile" = "medium-high" ]; then profile_label_temp="Med-High R5"; fi
          if [ "$profile" = "rev5" ]; then profile_label_temp="FedRAMP Rev5"; fi
          printf "   ${YELLOW}Note: '$profile_label_temp' is a placeholder for a future FedRAMP Rev 5 profile.${NC}\n"
          printf "   ${YELLOW}      Update its Profile ID in 'fedramp-oscal.sh' when available.${NC}\n"
          missing_standard=true # Set flag if standard profile is missing
        fi
      fi
    done

    # Display actionable OSCAL scans (missing or stale)
    actionable_scans_display=()
    all_scans_ok=true
    for profile_check in "${OSCAL_PROFILES[@]}"; do
        # Re-check status for display (similar logic to above loop)
        # This part assumes current_profile_result_file and AGE_DAYS were determined correctly in the loop above for each profile
        # For simplicity, we'll re-evaluate based on missing_profiles array and age check (if not missing)
        if [[ " ${missing_profiles[*]} " =~ " ${profile_check} " ]]; then # Check if profile is in missing_profiles
            actionable_scans_display+=("${RED}${profile_check} (missing)${NC}")
            all_scans_ok=false
        # Add age check here if you want to show stale ones too, e.g. by checking AGE_DAYS for that profile if it wasn't missing
        fi
    done
    if [ "$all_scans_ok" = false ] && [ ${#actionable_scans_display[@]} -gt 0 ]; then
      printf "${BOLD}${YELLOW}Actionable OSCAL Scans (need to be run):${NC} %s\n" "$(IFS=, ; echo "${actionable_scans_display[*]}")"
    fi
    echo -e "${CYAN}Monitored OSCAL profiles:${NC} ${WHITE}${OSCAL_PROFILES[*]}${NC}"

    # If standard scan is missing, run it automatically
    if [ "$missing_standard" = true ]; then # Check the flag
      echo -e "${YELLOW}[OSCAL] No OpenSCAP scan results found for standard! Running standard scan...${NC}"
      if [ -x "$PROJECT_ROOT/scripts/fedramp-oscal.sh" ]; then
        sudo "$PROJECT_ROOT/scripts/fedramp-oscal.sh" standard
      else
        echo -e "${RED}fedramp-oscal.sh not found or not executable!${NC}"
      fi
    fi

    # AC-2: Unauthorized UID 0 Accounts
    echo -e "${BLUE}[AC-2] Checking for unauthorized UID 0 accounts...${NC}"
    ROOT_USERS=$(awk -F: '($3 == 0) {print $1}' /etc/passwd | grep -vE '^root$')
    if [ -n "$ROOT_USERS" ]; then
      echo -e "${RED}  [!] Unauthorized UID 0 accounts: $ROOT_USERS${NC}"
      bar "AC-2" 5 30 "$RED"
    else
      echo -e "${GREEN}  [✓] No unauthorized UID 0 accounts${NC}"
      bar "AC-2" 30 30 "$GREEN"
    fi

    # CM-7: World-writable Files
    echo -e "${BLUE}[CM-7] Checking for world-writable files...${NC}"
    WW_FILES=$(find /etc /var /home -xdev -type f -perm -0002 2>/dev/null | head -5)
    if [ -n "$WW_FILES" ]; then
      while read -r f; do
        if [ -n "$f" ]; then
          echo -e "${YELLOW}  [!] World-writable file: $f${NC}"
        fi
      done <<< "$WW_FILES"
      bar "CM-7" 10 30 "$YELLOW"
    else
      echo -e "${GREEN}  [✓] No world-writable files found${NC}"
      bar "CM-7" 30 30 "$GREEN"
    fi

    echo
  } | tee -a "$LOG_FILE"
  sleep $SCAN_INTERVAL
done
