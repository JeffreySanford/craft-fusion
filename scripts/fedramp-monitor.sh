#!/bin/bash
# FedRAMP Rev 5 Security Controls Monitoring Script (Lite)
# Checks AC-2 (UID 0 accounts) and CM-7 (world-writable files) every minute

LOG_FILE="/var/log/fedramp-monitor.log"
SCAN_INTERVAL=60

# === COLORS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

bar() {
  local label="$1"; local value="$2"; local color="$3"; local max=30
  local n=$((value > max ? max : value))
  printf "${color}%-20s [" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "]${NC} %s\n" "$value"
}

# Check for recent OSCAL (OpenSCAP) scan results
OSCAL_DIR="$PROJECT_ROOT/oscal-analysis"
OSCAL_RESULT_FILE="$OSCAL_DIR/oscap-results.xml"
OSCAL_REPORT_FILE="$OSCAL_DIR/oscap-report.html"
OSCAL_MAX_AGE_DAYS=7

# Ensure oscal-analysis directory exists
mkdir -p "$OSCAL_DIR"

while true; do
  NOW=$(date -u '+%a %b %d %I:%M:%S %p UTC %Y')
  {
    echo -e "${BOLD}${CYAN}==== FedRAMP Security Scan (Lite): $NOW ====${NC}"
    echo -e "${MAGENTA}Controls Checked: 2 (AC-2, CM-7)${NC}"

    # OSCAL/SCAP scan check
    echo -e "${BLUE}[OSCAL] Checking for recent OpenSCAP scan...${NC}"
    if [ -f "$OSCAL_RESULT_FILE" ]; then
      LAST_RUN=$(stat -c %Y "$OSCAL_RESULT_FILE")
      NOW_TS=$(date +%s)
      AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
      if [ "$AGE_DAYS" -le "$OSCAL_MAX_AGE_DAYS" ]; then
        echo -e "${GREEN}  [✓] OpenSCAP scan found ($AGE_DAYS days ago)${NC}"
        bar "OSCAL" 30 "$GREEN"
      else
        echo -e "${YELLOW}  [!] OpenSCAP scan is older than $OSCAL_MAX_AGE_DAYS days ($AGE_DAYS days ago)${NC}"
        bar "OSCAL" 10 "$YELLOW"
      fi
      echo -e "  Report: $OSCAL_REPORT_FILE"
    else
      echo -e "${RED}  [!] No OpenSCAP scan results found!${NC}"
      bar "OSCAL" 0 "$RED"
    fi

    # AC-2: Unauthorized UID 0 Accounts
    echo -e "${BLUE}[AC-2] Checking for unauthorized UID 0 accounts...${NC}"
    ROOT_USERS=$(awk -F: '($3 == 0) {print $1}' /etc/passwd | grep -vE '^root$')
    if [ -n "$ROOT_USERS" ]; then
      echo -e "${RED}  [!] Unauthorized UID 0 accounts: $ROOT_USERS${NC}"
      bar "AC-2" 5 "$RED"
    else
      echo -e "${GREEN}  [✓] No unauthorized UID 0 accounts${NC}"
      bar "AC-2" 30 "$GREEN"
    fi

    # CM-7: World-writable Files
    echo -e "${BLUE}[CM-7] Checking for world-writable files...${NC}"
    WW_FILES=$(find /etc /var /home -xdev -type f -perm -0002 2>/dev/null | head -5)
    if [ -n "$WW_FILES" ]; then
      while read -r f; do
        echo -e "${YELLOW}  [!] World-writable file: $f${NC}"
      done <<< "$WW_FILES"
      bar "CM-7" 10 "$YELLOW"
    else
      echo -e "${GREEN}  [✓] No world-writable files found${NC}"
      bar "CM-7" 30 "$GREEN"
    fi

    echo
  } | tee -a "$LOG_FILE"
  sleep $SCAN_INTERVAL
done
