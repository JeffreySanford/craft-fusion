#!/bin/bash
# FedRAMP Rev 5 Security Controls Monitoring Script (Lite)
# Checks AC-2 (UID 0 accounts) and CM-7 (world-writable files) every minute

# Set project root for relative paths
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OSCAL_DIR="$PROJECT_ROOT/oscal-analysis"
OSCAL_RESULT_FILE="$OSCAL_DIR/oscap-results.xml"
OSCAL_REPORT_FILE="$OSCAL_DIR/oscap-report.html"
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

# If no OSCAL scan results, run the standard scan automatically
if [ ! -f "$OSCAL_RESULT_FILE" ]; then
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
  local n=$((value > max ? max : value))
  printf "%s%-18s [" "$color" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "]%s %s\n" "$NC" "$value"
}

# === Environment & Time Estimate Infographic ===
CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')

bar() {
  local label="$1"; local value="$2"; local max="$3"; local color="$4"
  value=${value:-0}
  max=${max:-30}
  color=${color:-$NC}
  local n=$((value > max ? max : value))
  printf "%s%-18s [" "$color" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "]%s %s\n" "$NC" "$value"
}

MONITOR_EST=1
if [ "$CPU_CORES" -le 1 ]; then MONITOR_EST=2; fi
if [ "$MEM_TOTAL_MB" -lt 1500 ]; then MONITOR_EST=$((MONITOR_EST+1)); fi

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🛡️  FedRAMP Monitor Environment              ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
bar "Monitoring" $MONITOR_EST 10 "$GREEN"
echo -e "${BOLD}${WHITE}Estimated Time: Continuous${NC}\n"

# Check for recent OSCAL (OpenSCAP) scan results
while true; do
  NOW=$(date -u '+%a %b %d %I:%M:%S %p UTC %Y')
  {
    echo -e "${BOLD}${CYAN}==== FedRAMP Security Scan (Lite): $NOW ====${NC}"
    echo -e "${MAGENTA}Controls Checked: 2 (AC-2, CM-7)${NC}"

    # OSCAL/SCAP scan check
    echo -e "${BOLD}${CYAN}🛡️  OSCAL/FedRAMP Compliance Scan:${NC}"
    if [ -f "$OSCAL_RESULT_FILE" ]; then
        LAST_RUN=$(stat -c %Y "$OSCAL_RESULT_FILE")
        NOW_TS=$(date +%s)
        AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
        if [ "$AGE_DAYS" -le "$OSCAL_MAX_AGE_DAYS" ]; then
            echo -e "   ${GREEN}✓ OpenSCAP scan found ($AGE_DAYS days ago)${NC}"
        else
            echo -e "   ${YELLOW}⚠️  OpenSCAP scan is older than $OSCAL_MAX_AGE_DAYS days ($AGE_DAYS days ago)${NC}"
        fi
        echo -e "   Report: ${CYAN}$OSCAL_REPORT_FILE${NC}"
        # Optional: show pass/fail summary if xmllint is available
        if command -v xmllint &>/dev/null; then
            PASS=$(xmllint --xpath 'count(//rule-result[result="pass"])' "$OSCAL_RESULT_FILE" 2>/dev/null)
            FAIL=$(xmllint --xpath 'count(//rule-result[result="fail"])' "$OSCAL_RESULT_FILE" 2>/dev/null)
            PASS=${PASS:-0}
            FAIL=${FAIL:-0}
            echo -e "   ${GREEN}Pass: $PASS${NC}  ${RED}Fail: $FAIL${NC}"
        fi
    else
        echo -e "   ${RED}✗ No OpenSCAP scan results found in oscal-analysis/${NC}"
        echo -e "   ${YELLOW}Running OSCAL scan now...${NC}"
        if ./scripts/fedramp-oscal.sh standard; then
            echo -e "   ${GREEN}✓ OSCAL scan complete. See ./oscal-analysis/oscap-report.html${NC}"
        else
            echo -e "   ${RED}✗ OSCAL scan failed or incomplete${NC}"
        fi
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
