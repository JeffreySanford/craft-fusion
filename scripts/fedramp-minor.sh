#!/bin/bash
# fedramp-minor.sh - Run all OSCAL/FedRAMP OpenSCAP scans (all profiles) and ensure reports are user-readable


PROFILES=(standard ospp pci-dss cusp)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OSCAL_DIR="$SCRIPT_DIR/../oscal-analysis"

# === COLORS ===
GREEN=$'\033[0;32m'
BLUE=$'\033[0;34m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
NC=$'\033[0m'
BOLD=$'\033[1m'
WHITE=$'\033[1;37m'
PURPLE=$'\033[0;35m'
CYAN=$'\033[0;36m'

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

# --- Progress Function (copied from deploy-all.sh / fedramp-oscal.sh) ---
print_progress() {
    local title="$1"
    local estimated_total_seconds="$2"
    local start_time_epoch="$3"
    local progress_bar_width=30
    local color_arg="${4:-$MAGENTA}" # Use passed color or default to MAGENTA

    if [ ! -t 1 ]; then return; fi # Only run if TTY

    while true; do
        local current_time_epoch=$(date +%s)
        local elapsed_seconds=$((current_time_epoch - start_time_epoch))
        local remaining_seconds=$((estimated_total_seconds - elapsed_seconds))

        [ "$remaining_seconds" -lt 0 ] && remaining_seconds=0

        local percent_done=0
        [ "$estimated_total_seconds" -gt 0 ] && percent_done=$((elapsed_seconds * 100 / estimated_total_seconds))
        [ "$percent_done" -gt 100 ] && percent_done=100

        local filled_width=$((percent_done * progress_bar_width / 100))
        local empty_width=$((progress_bar_width - filled_width))

        local bar_str=""
        for ((i=0; i<filled_width; i++)); do bar_str+="█"; done
        for ((i=0; i<empty_width; i++)); do bar_str+="░"; done

        local rem_min=$((remaining_seconds / 60))
        local rem_sec=$((remaining_seconds % 60))
        local time_left_str=$(printf "%02d:%02d" "$rem_min" "$rem_sec")

        printf "\r${BOLD}${color_arg}%-25s ${WHITE}[%s] ${GREEN}%3d%%${NC} ${YELLOW}(%s remaining)${NC}\033[K" "$title:" "$bar_str" "$percent_done" "$time_left_str"

        if [ "$remaining_seconds" -eq 0 ] && [ "$elapsed_seconds" -ge "$estimated_total_seconds" ]; then break; fi
        command sleep 5 # Update interval (e.g., 5 seconds for this higher-level script)
    done
}

cleanup_progress_line() { [ -t 1 ] && printf "\r\033[K"; }
# --- End of Progress Function ---

copy_scan_reports() {
    local current_profile="$1"
    echo -e "  ${BLUE}Processing reports for $current_profile...${NC}"
    ADMIN_XML="$OSCAL_DIR/oscap-results-$current_profile.xml"
    ADMIN_HTML="$OSCAL_DIR/oscap-report-$current_profile.html"
    USER_XML="$OSCAL_DIR/user-readable-results-$current_profile.xml"
    USER_HTML="$OSCAL_DIR/user-readable-report-$current_profile.html"

    # Copy admin files to user-readable versions
    if [ -f "$ADMIN_XML" ]; then
      sudo cp "$ADMIN_XML" "$USER_XML"
      sudo chown "$USER":"$USER" "$USER_XML" # Ensure current user owns the copy
      echo -e "  ${CYAN}Created user-readable: $USER_XML${NC}"
    else
      echo -e "  ${YELLOW}Warning: Admin XML report not found for $current_profile: $ADMIN_XML${NC}"
    fi
    
    if [ -f "$ADMIN_HTML" ]; then
      sudo cp "$ADMIN_HTML" "$USER_HTML"
      sudo chown "$USER":"$USER" "$USER_HTML" # Ensure current user owns the copy
      echo -e "  ${CYAN}Created user-readable: $USER_HTML${NC}"
    else
      echo -e "  ${YELLOW}Warning: Admin HTML report not found for $current_profile: $ADMIN_HTML${NC}"
    fi
    
    # Also handle legacy names for standard profile (oscap-results.xml / oscap-report.html)
    if [ "$current_profile" = "standard" ]; then
      if [ -f "$OSCAL_DIR/oscap-results.xml" ]; then # Legacy admin XML
        sudo cp "$OSCAL_DIR/oscap-results.xml" "$OSCAL_DIR/user-readable-results.xml" # Legacy user XML
        sudo chown "$USER":"$USER" "$OSCAL_DIR/user-readable-results.xml"
        echo -e "  ${CYAN}Created user-readable (legacy): $OSCAL_DIR/user-readable-results.xml${NC}"
      fi
      if [ -f "$OSCAL_DIR/oscap-report.html" ]; then # Legacy admin HTML
        sudo cp "$OSCAL_DIR/oscap-report.html" "$OSCAL_DIR/user-readable-report.html" # Legacy user HTML
        sudo chown "$USER":"$USER" "$OSCAL_DIR/user-readable-report.html"
        echo -e "  ${CYAN}Created user-readable (legacy): $OSCAL_DIR/user-readable-report.html${NC}"
      fi
    fi
}

for profile in "${PROFILES[@]}"; do
  echo -e "${BOLD}${CYAN}=== Running OSCAL scan for profile: $profile ===${NC}"

  # Estimate time for this profile's scan (similar to fedramp-oscal.sh)
  CPU_CORES_EST=$(nproc 2>/dev/null || echo 1)
  MEM_TOTAL_MB_EST=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
  PROFILE_EST_MIN=3 # Base estimate in minutes
  if [ "$CPU_CORES_EST" -le 1 ]; then PROFILE_EST_MIN=7; fi
  if [ "$CPU_CORES_EST" -le 2 ]; then PROFILE_EST_MIN=5; fi
  if [ "$MEM_TOTAL_MB_EST" -lt 1500 ]; then PROFILE_EST_MIN=$((PROFILE_EST_MIN+2)); fi
  PROFILE_ESTIMATE_SECONDS=$((PROFILE_EST_MIN * 60))

  # Determine color for progress bar based on profile
  PROGRESS_COLOR="$PURPLE" # Default
  if [ "$profile" = "ospp" ]; then PROGRESS_COLOR="$CYAN"; fi
  if [ "$profile" = "pci-dss" ]; then PROGRESS_COLOR="$YELLOW"; fi
  if [ "$profile" = "cusp" ]; then PROGRESS_COLOR="$GREEN"; fi

  phase_start_time=$(date +%s)
  print_progress "Scan: $profile" "$PROFILE_ESTIMATE_SECONDS" "$phase_start_time" "$PROGRESS_COLOR" &
  progress_pid=$!

  # Run the scan and capture its exit code.
  # The 'if' structure handles 'set -e' correctly by not exiting immediately on non-zero.
  if sudo "$SCRIPT_DIR/fedramp-oscal.sh" "$profile" --no-summary; then
    oscal_script_exit_code=0
  else
    oscal_script_exit_code=$?
  fi
  kill "$progress_pid" &>/dev/null || true
  wait "$progress_pid" &>/dev/null || true
  cleanup_progress_line

  if [ $oscal_script_exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ $profile scan completed successfully${NC}"
    copy_scan_reports "$profile"
  elif [ $oscal_script_exit_code -eq 2 ]; then # OpenSCAP uses 2 for completed scan with rule failures
    echo -e "${YELLOW}⚠ $profile scan completed with rule failures (exit code $oscal_script_exit_code)${NC}"
    copy_scan_reports "$profile"
  else # Handles other exit codes (e.g., 1 for fedramp-oscal.sh script error or oscap critical error)
    echo -e "${RED}✗ $profile scan command failed (exit code $oscal_script_exit_code)${NC}"
  fi
  echo
done

echo -e "${BOLD}${GREEN}🎉 All OSCAL scans complete!${NC}"
echo -e "${WHITE}Admin reports (root-owned): ${CYAN}$OSCAL_DIR/oscap-*${NC}"
echo -e "${WHITE}User-readable copies: ${CYAN}$OSCAL_DIR/user-readable-*${NC}"
