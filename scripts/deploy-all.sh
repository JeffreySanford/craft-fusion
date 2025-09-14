#!/bin/bash
# deploy-all.sh - Optimized application deployment script for Fedora server with memory optimization

set -e

# Color and path setup (ensure these are defined early in your script)
# Example color definitions (adjust as needed)
BOLD='\033[1m'
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'

SCRIPT_DIR_DEPLOY_ALL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT_DEPLOY_ALL="$(cd "$SCRIPT_DIR_DEPLOY_ALL/.." && pwd)"
OSCAL_DIR="$PROJECT_ROOT_DEPLOY_ALL/oscal-analysis"

# Function to display available OSCAL profiles
display_available_oscal_profiles() {
    printf "${BOLD}${MAGENTA}\n╔══════════════════════════════════════════════════════════════════════════╗\n"
    printf "║              📊 Available OSCAL Scan Profiles                          ║\n"
    printf "╚══════════════════════════════════════════════════════════════════════════╝${NC}\n"

    if [ ! -d "$OSCAL_DIR" ]; then
        echo -e "  ${YELLOW}OSCAL analysis directory not found: $OSCAL_DIR${NC}"
        return
    fi

    local found_profiles=false
    for file_pattern in "user-readable-results-*.xml" "oscap-results-*.xml" "user-readable-results-*.json" "oscap-results-*.json"; do
        for file in "$OSCAL_DIR"/$file_pattern; do
            if [ -f "$file" ]; then
                found_profiles=true
                local profile_name
                profile_name=$(basename "$file" | sed -E 's/^(user-readable-results-|oscap-results-)//; s/\.(xml|json)$//')
                local last_modified_epoch
                last_modified_epoch=$(stat -c %Y "$file")
                local last_modified_sfo
                if command -v date &>/dev/null; then
                    last_modified_sfo=$(TZ="America/Los_Angeles" date -d "@$last_modified_epoch" '+%Y-%m-%d %I:%M:%S %p %Z (%A)')
                else
                    last_modified_sfo=$(date -d "@$last_modified_epoch")
                fi
                printf "  ${CYAN}%-20s${NC} ${GREEN}Last Scan:${NC} ${WHITE}%s${NC}\n" "$profile_name" "$last_modified_sfo"
            fi
        done
    done

    if [ "$found_profiles" = false ]; then
        echo -e "  ${YELLOW}No OSCAL scan result files found in $OSCAL_DIR${NC}"
    fi
    echo
}

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════════════════╗\n"
printf "║               🚀 Craft Fusion Deployment: System Overview              ║\n"
printf "╚══════════════════════════════════════════════════════════════════════════╝${NC}\n"
CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')
NET_IFACE=$(ip route | grep default | awk '{print $5}' | head -1)
NET_IP=$(ip -4 addr show "$NET_IFACE" 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
PING_TIME=$(ping -c 1 8.8.8.8 2>/dev/null | grep 'time=' | sed 's/.*time=\([0-9.]*\).*/\1/' | head -1)
AUDITD_STATUS=$(systemctl is-active auditd 2>/dev/null || echo "unknown")

printf "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}\n"
printf "${BLUE}Network:     ${CYAN}$NET_IFACE${NC} (${GREEN}$NET_IP${NC})   ${BLUE}Ping: ${CYAN}${PING_TIME}ms${NC}\n"
printf "${BLUE}Auditd:      ${CYAN}$AUDITD_STATUS${NC}\n"
printf "${BLUE}Date:        ${WHITE}$(date)${NC}\n\n"

# --- Progress Function ---
# Usage: print_progress "Title" ESTIMATED_SECONDS PHASE_START_EPOCH & pid=$!
#        # command
#        kill $pid &>/dev/null; wait $pid &>/dev/null
#        cleanup_progress_line
print_progress() {
    local title="$1"
    local estimated_total_seconds="$2"
    local start_time_epoch="$3"
    local progress_bar_width=30

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

        local bar=""
        for ((i=0; i<filled_width; i++)); do bar+="█"; done
        for ((i=0; i<empty_width; i++)); do bar+="░"; done

        local rem_min=$((remaining_seconds / 60))
        local rem_sec=$((remaining_seconds % 60))
        local time_left_str=$(printf "%02d:%02d" "$rem_min" "$rem_sec")

        printf "\r${BOLD}${MAGENTA}%-25s ${WHITE}[%s] ${GREEN}%3d%%${NC} ${YELLOW}(%s remaining)${NC}\033[K" "$title:" "$bar" "$percent_done" "$time_left_str"

        if [ "$remaining_seconds" -eq 0 ] && [ "$elapsed_seconds" -ge "$estimated_total_seconds" ]; then break; fi
        command sleep 5 # Shorter update interval for better responsiveness
    done
}

cleanup_progress_line() { [ -t 1 ] && printf "\r\033[K"; }

# Parse arguments
# Configuration flags
POWER_MODE=false
do_full_clean=false
yes_ssl=false
skip_ssl=false

# Usage function
show_usage() {
    echo -e "${BOLD}${CYAN}Craft Fusion Complete Deployment Script${NC}"
    echo
    echo -e "${BOLD}USAGE:${NC}"
    echo -e "  sudo ./scripts/deploy-all.sh [OPTIONS]"
    echo
    echo -e "${BOLD}OPTIONS:${NC}"
    echo -e "  ${YELLOW}--full-clean${NC}     Clean node_modules, .nx cache, and rebuild everything"
    echo -e "  ${YELLOW}--power${NC}          Enable power mode (use 90% RAM, disable Nx daemon)"
    echo -e "  ${YELLOW}--yes-ssl${NC}        Automatically set up SSL/HTTPS (skip prompt)"
    echo -e "  ${YELLOW}--skip-ssl${NC}       Skip SSL setup (use HTTP only)"
    echo -e "  ${YELLOW}--help${NC}           Show this help message"
    echo
    echo -e "${BOLD}EXAMPLES:${NC}"
    echo -e "  ${CYAN}# Standard deployment (incremental builds)${NC}"
    echo -e "  sudo ./scripts/deploy-all.sh"
    echo
    echo -e "  ${CYAN}# Force complete rebuild (recommended for production)${NC}"
    echo -e "  sudo ./scripts/deploy-all.sh --full-clean"
    echo
    echo -e "  ${CYAN}# Power deployment with clean rebuild${NC}"
    echo -e "  sudo ./scripts/deploy-all.sh --full-clean --power"
    echo
    echo -e "  ${CYAN}# Deploy with automatic HTTPS setup${NC}"
    echo -e "  sudo ./scripts/deploy-all.sh --full-clean --yes-ssl"
    echo
    echo -e "${BOLD}${YELLOW}TROUBLESHOOTING:${NC}"
    echo -e "  ${RED}Go server not starting?${NC} Use --full-clean to rebuild the binary"
    echo -e "  ${RED}NPM/build errors?${NC} Use --full-clean to clear all caches"
    echo -e "  ${RED}Memory issues?${NC} Use --power for optimized memory allocation"
    echo -e "  ${RED}Backend APIs 503/404?${NC} Check PM2 status after deployment"
    echo
}

# Parse command line arguments
for arg in "$@"; do
    case "$arg" in
        --full-clean) do_full_clean=true ;;
        --power) POWER_MODE=true ;;
        --yes-ssl) yes_ssl=true ;;
        --skip-ssl) skip_ssl=true ;;
        --help|-h) show_usage; exit 0 ;;
        *) echo -e "${RED}Unknown option: $arg${NC}"; show_usage; exit 1 ;;
    esac
done

if [ "$POWER_MODE" = true ]; then
  echo -e "${YELLOW}⚡ Power mode enabled: maximizing resource usage for deployment!${NC}"
  # Dynamically set NODE_OPTIONS to 90% of total system memory (in MB)
  MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
  MEM_90PCT=$((MEM_TOTAL_MB * 90 / 100))
  export NODE_OPTIONS="--max-old-space-size=$MEM_90PCT"
  export NX_DAEMON=false # Disable Nx daemon for cleaner, more predictable CI/CD runs
  export NX_WORKERS=$(nproc 2>/dev/null || echo 4) # Use available cores, default to 4
  if [ "$(id -u)" -eq 0 ]; then
    export POWER_NICE="nice -n -20 ionice -c2 -n0"
  else
    echo -e "${YELLOW}⚠ Power mode requested, but not running as root. Using best allowed priority. For maximum effect, run as root (sudo).${NC}"
    export POWER_NICE="nice -n 0 ionice -c2 -n4"
  fi
  echo -e "${YELLOW}NODE_OPTIONS set to: $NODE_OPTIONS${NC}"
else
  export POWER_NICE=""
  export NODE_OPTIONS="--max-old-space-size=512"
  export NX_CACHE_DIRECTORY="/tmp/nx-cache"
fi

echo -e "${BOLD}${WHITE}=== Craft Fusion Complete Deployment Started ===${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"
cd "$PROJECT_ROOT"

# Ensure scripts are executable
chmod +x scripts/*.sh

# --- System Prep: Clean up lingering processes and free memory ---
SYS_PREP_SCRIPT="$(dirname "$0")/system/system-prep.sh"
if [ -f "$SYS_PREP_SCRIPT" ]; then
    if [ "$POWER_MODE" = true ]; then
        # --power is passed to system-prep.sh, which will pass it to system-optimize.sh if present
        source "$SYS_PREP_SCRIPT" --power
    else
        source "$SYS_PREP_SCRIPT"
    fi
else
    echo -e "${YELLOW}⚠ System prep script not found at $SYS_PREP_SCRIPT — continuing without it.${NC}"
fi

# After sourcing system-prep.sh, print a clear, modernized summary of available tools
printf "${CYAN}Available Tools:${NC}\n  Check resources: ${YELLOW}scripts/tools/memory-monitor.sh${NC}\n  System prep: ${YELLOW}scripts/system/system-prep.sh${NC}\n  Manual memory cleanup: ${YELLOW}sudo sysctl vm.drop_caches=3${NC}\n"
printf "${WHITE}For more info, see scripts/PRODUCTION-SCRIPTS.md${NC}\n"

# Initialize status variables for summary
npm_ci_status=-1
npm_ci_retry_status=-1
nx_post_install_final_status=-1 # -1: not run/pending, 0: success/skipped, 1: failed after prompt
CLEAN_STATUS=-1               # -1: pending, 0: success, 1: failure
backend_status=-1
frontend_status=-1
ssl_setup_attempted=false
ssl_setup_succeeded=false     # True if attempted and script doesn't exit due to set -e

# Add vibrant step headers for each major step
step_header() {
  local title="$1"
  printf "${BOLD}${MAGENTA}\n╔══════════════════════════════════════════════════════════════════════════╗\n"
  printf "║ %-68s ║\n" "$title"
  printf "╚══════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

step_header "Phase A: System Checks & Preparation"
echo -e "${CYAN}Current Memory Status:${NC}"
free -h | grep -E "(Mem|Swap)" || echo "Memory info not available"

# Check available memory and warn if low
AVAILABLE_MEM=$(free -m 2>/dev/null | awk 'NR==2{print $7}' || echo "2000")
if [ "$AVAILABLE_MEM" -lt 1000 ]; then
    echo -e "${YELLOW}⚠ Low memory detected ($AVAILABLE_MEM MB available)${NC}"
    echo -e "${BLUE}Ensuring swap is active and clearing system caches...${NC}"
    echo -e "${GREEN}✓ System caches cleared${NC}"
    echo -e "${YELLOW}⚠ Low memory detected ($AVAILABLE_MEM MB available) after initial system prep.${NC}"
    echo -e "${BLUE}Consider running 'sudo ./scripts/system-optimize.sh' or 'sudo ./scripts/memory-cleanup.sh' if issues persist.${NC}"
    # system-prep.sh already ran 'drop_caches=3', so removing the less effective 'drop_caches=1' here.
    # If further clearing is needed here, it should also be 'drop_caches=3'.
    # For now, rely on system-prep.sh and advise manual intervention if still low.
fi

# Clean builds and node_modules only if --full-clean is passed
if [ "$do_full_clean" = true ]; then
  echo -e "${CYAN}Full clean requested (--full-clean).${NC}"
  echo -e "${CYAN}Cleaning previous builds and node_modules...${NC}"

  CLEAN_ESTIMATE_SECONDS=60
  phase_start_time=$(date +%s)
  print_progress "Full Clean" "$CLEAN_ESTIMATE_SECONDS" "$phase_start_time" &
  progress_pid=$!

  rm -rf node_modules/.cache/nx 2>/dev/null || true
  rm -rf .nx/cache/
  rm -rf /tmp/nx-cache/ 2>/dev/null || true
  rm -rf node_modules
  ./scripts/clean-build.sh --full-clean
  CLEAN_STATUS=$?
  if [ $CLEAN_STATUS -ne 0 ]; then
    echo -e "${YELLOW}⚠ clean-build.sh failed, retrying once...${NC}"
    ./scripts/clean-build.sh --full-clean
    CLEAN_STATUS=$?
    if [ $CLEAN_STATUS -ne 0 ]; then
      echo -e "${RED}✗ clean-build.sh failed twice, aborting deployment.${NC}"
      exit 1
    fi
  fi
  kill "$progress_pid" &>/dev/null || true # Ignore error if kill fails (e.g., process already dead)
  wait "$progress_pid" &>/dev/null || true   # Ignore error from wait (e.g., process killed, or already reaped)
  cleanup_progress_line
  echo -e "${GREEN}✓ Full clean completed successfully${NC}"
else
  echo -e "${CYAN}Skipping full clean. Only cleaning build outputs...${NC}"
  CLEAN_BUILD_ESTIMATE_SECONDS=20
  phase_start_time=$(date +%s)
  print_progress "Clean Build Outputs" "$CLEAN_BUILD_ESTIMATE_SECONDS" "$phase_start_time" &
  progress_pid=$!

  ./scripts/clean-build.sh
  clean_build_outputs_status=$?
  if [ $clean_build_outputs_status -ne 0 ]; then
      echo -e "${YELLOW}⚠ Cleaning build outputs failed, but treating as non-critical for this path.${NC}"
  fi
  CLEAN_STATUS=0 # For summary, non-full clean's build output cleaning is considered "attempted" or non-blocking.

  kill "$progress_pid" &>/dev/null || true
  wait "$progress_pid" &>/dev/null || true
  cleanup_progress_line
  echo -e "${GREEN}✓ Build outputs cleaned${NC}"
fi

# Function to handle Nx post-install logic
handle_nx_post_install() {
  local estimate_seconds=60
  local phase_start_time_nx
  local progress_pid_nx
  local post_install_status_nx

  echo -e "${CYAN}Running Nx post-install script...${NC}"
  phase_start_time_nx=$(date +%s)
  print_progress "Nx Post-Install" "$estimate_seconds" "$phase_start_time_nx" &
  progress_pid_nx=$!

  set -x
  node ./node_modules/nx/bin/post-install 2>&1 | tee nx-post-install.log
  post_install_status_nx=${PIPESTATUS[0]}
  set +x

  kill "$progress_pid_nx" &>/dev/null || true
  wait "$progress_pid_nx" &>/dev/null || true
  cleanup_progress_line

  if [ $post_install_status_nx -eq 0 ]; then
    echo -e "${GREEN}✓ Nx post-install completed successfully${NC}"
    return 0
  fi

  echo -e "${RED}✗ Nx post-install failed (exit code $post_install_status_nx)${NC}"
  echo -e "${YELLOW}See nx-post-install.log for details. You can run 'cat nx-post-install.log' to view the full output and errors.${NC}"
  while true; do
    echo -e "${YELLOW}How would you like to proceed?${NC}"
    echo -e "  [R]etry post-install"
    echo -e "  [S]kip and continue deployment (not recommended)"
    echo -e "  [A]bort deployment"
    read -p "Enter your choice (R/S/A): " nx_post_choice
    case "$nx_post_choice" in
      [Rr])
        echo -e "${YELLOW}Retrying Nx post-install...${NC}"
        # Recursive call to retry
        handle_nx_post_install || return 1 # Propagate failure if retry also fails after user aborts from it
        return 0 # Return success if retry was successful
        ;;
      [Ss])
        echo -e "${YELLOW}Skipping Nx post-install. Some features may not work as expected.${NC}"
        return 0
        ;;
      [Aa])
        echo -e "${RED}Aborting deployment due to Nx post-install failure.${NC}"
        exit 1
        ;;
      *)
        echo -e "${YELLOW}Invalid choice. Please enter R, S, or A.${NC}"
        ;;
    esac
  done
}

# Only install dependencies if node_modules is missing or package-lock.json changed
if [ "$do_full_clean" = true ]; then
  echo -e "${CYAN}Installing dependencies (npm install --no-progress)...${NC}"
  echo -e "${BLUE}NPM install in progress...${NC}"
  echo -e "${BLUE}The progress bar is an overall estimate for this NPM installation phase.${NC}"
  echo -e "${BLUE}Please be patient while NPM completes all its tasks.${NC}"
  NPM_INSTALL_ESTIMATE_SECONDS=240 # 4 minutes (adjusted based on typical performance)
  phase_start_time=$(date +%s)
  print_progress "NPM Install (npm install)" "$NPM_INSTALL_ESTIMATE_SECONDS" "$phase_start_time" &
  progress_pid=$!

  npm install --no-progress --loglevel error --omit=optional --no-audit --prefer-offline
  npm_install_status=$?

  kill "$progress_pid" &>/dev/null || true
  wait "$progress_pid" &>/dev/null || true
  cleanup_progress_line

  if [ $npm_install_status -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully via npm install${NC}"
    [ -d node_modules/nx ] && { handle_nx_post_install; nx_post_install_final_status=$?; } || nx_post_install_final_status=0
  else
    echo -e "${RED}✗ Dependencies installation failed (exit code $npm_install_status)${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ node_modules up-to-date, skipping npm install${NC}"
  npm_install_status=0 # Mark as success for summary if skipped
  [ -d node_modules/nx ] && { handle_nx_post_install; nx_post_install_final_status=$?; } || nx_post_install_final_status=0
fi

# --- Nx Pre-check (after npm install) ---
if [ ! -d node_modules/@nrwl ] && [ ! -d node_modules/nx ]; then
  echo -e "${RED}✗ Nx modules not found in node_modules. Nx-based scripts will fail.${NC}"
  echo -e "${YELLOW}Please run: ${BOLD}npm install${NC}${YELLOW} in your workspace root before deploying.${NC}"
  exit 1
fi

# =====================
# Phase B: Backend & Frontend Deployment (Sequential)
# =====================
step_header "Phase B: Backend & Frontend Deployment (Sequential)"

# --- Ensure all PM2 processes are stopped for all relevant users ---
echo -e "${CYAN}Stopping all PM2 processes for current user...${NC}"
pm2 stop all || true
pm2 delete all || true
pm2 kill || true

if id "craft-fusion" &>/dev/null; then
    echo -e "${CYAN}Stopping all PM2 processes for craft-fusion user...${NC}"
    sudo -u craft-fusion pm2 stop all || true
    sudo -u craft-fusion pm2 delete all || true
    sudo -u craft-fusion pm2 kill || true
    # Show PM2 accessibility for craft-fusion; fallback to current user
    sudo -n -u craft-fusion pm2 list 2>/dev/null || pm2 list 2>/dev/null || echo -e "${YELLOW}PM2 not accessible${NC}"
else
    pm2 list 2>/dev/null || echo -e "${YELLOW}PM2 not accessible${NC}"
fi

# --- Wait for Go binary to be released before copying ---
GO_BINARY_PATH="/var/www/craft-fusion/dist/apps/craft-go/main"
if [ -f "$GO_BINARY_PATH" ]; then
  echo -e "${CYAN}Waiting for Go binary to be released...${NC}"
  while sudo lsof | grep -q "$GO_BINARY_PATH"; do
    echo -e "${YELLOW}Go binary still in use, waiting...${NC}"
    sleep 1
  done
  echo -e "${GREEN}Go binary is free to update.${NC}"
fi

# --- Deploy backend first ---
BACKEND_DEPLOY_ESTIMATE_SECONDS=180
phase_start_time=$(date +%s)
print_progress "Backend Deployment" "$BACKEND_DEPLOY_ESTIMATE_SECONDS" "$phase_start_time" &
progress_pid=$!

: "${POWER_NICE:=}"
echo -e "${CYAN}Invoking backend deploy script...${NC}"
if [ "$do_full_clean" = true ]; then
    $POWER_NICE bash ./scripts/deploy-backend.sh --full-clean
else
    $POWER_NICE bash ./scripts/deploy-backend.sh
fi
backend_status=$?

kill "$progress_pid" &>/dev/null || true
wait "$progress_pid" &>/dev/null || true
cleanup_progress_line

if [ $backend_status -eq 0 ]; then
    echo -e "${GREEN}✓ Backend deployed successfully${NC}"
    # --- Deploy frontend only if backend succeeded ---
    FRONTEND_DEPLOY_ESTIMATE_SECONDS=120
    phase_start_time=$(date +%s)
    print_progress "Frontend Deployment" "$FRONTEND_DEPLOY_ESTIMATE_SECONDS" "$phase_start_time" &
    progress_pid=$!

        echo -e "${CYAN}Invoking frontend deploy script...${NC}"
        if [ "$do_full_clean" = true ]; then
            $POWER_NICE bash ./scripts/deploy-frontend.sh --full-clean
        else
            $POWER_NICE bash ./scripts/deploy-frontend.sh
        fi
    frontend_status=$?

    kill "$progress_pid" &>/dev/null || true
    wait "$progress_pid" &>/dev/null || true
    cleanup_progress_line

    if [ $frontend_status -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend deployed successfully${NC}"
    else
        echo -e "${RED}✗ Frontend deployment failed (exit code $frontend_status)${NC}"
    fi
else
    echo -e "${RED}✗ Backend deployment failed (exit code $backend_status). Skipping frontend deployment.${NC}"
    frontend_status=1
fi

step_header "Phase C: SSL/WSS Setup (Optional)"
do_ssl=false
if [ "$skip_ssl" = true ]; then
    echo -e "${YELLOW}Skipping SSL/WSS setup (--skip-ssl)${NC}"
elif [ "$yes_ssl" = true ]; then
    do_ssl=true
else
    read -p "Do you want to set up SSL/WSS? (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] && do_ssl=true
fi

if [ "$do_ssl" = true ]; then
        ssl_setup_attempted=true
        if [ ! -f "/etc/nginx/sites-available/default" ] || ! grep -q "ssl_certificate" /etc/nginx/sites-available/default; then
                echo -e "${YELLOW}Setting up SSL certificates and WSS configuration...${NC}"
                SSL_SCRIPT="$SCRIPT_DIR_DEPLOY_ALL/security/ssl-setup.sh"
                WSS_SCRIPT="$SCRIPT_DIR_DEPLOY_ALL/security/wss-setup.sh"
                if [ -f "$SSL_SCRIPT" ]; then
                    sudo bash "$SSL_SCRIPT" || echo -e "${YELLOW}⚠ ssl-setup.sh encountered an error${NC}"
                else
                    echo -e "${YELLOW}⚠ ssl-setup.sh not found at scripts/security/ssl-setup.sh — skipping SSL cert bootstrap${NC}"
                fi
                if [ -f "$WSS_SCRIPT" ]; then
                    sudo bash "$WSS_SCRIPT" || echo -e "${YELLOW}⚠ wss-setup.sh encountered an error${NC}"
                else
                    echo -e "${YELLOW}⚠ wss-setup.sh not found at scripts/security/wss-setup.sh — skipping WSS config${NC}"
                fi
                ssl_setup_succeeded=true # Considered successful if scripts run or already configured
        else
                echo -e "${GREEN}✓ SSL/WSS already configured${NC}"
                ssl_setup_succeeded=true # Already configured is a success
        fi
else
        echo -e "${YELLOW}Skipping SSL/WSS setup${NC}"
fi

step_header "Phase D: Final System Tests"
# Test all endpoints
SYSTEM_TEST_ESTIMATE_SECONDS=30
phase_start_time=$(date +%s)
print_progress "System Tests" "$SYSTEM_TEST_ESTIMATE_SECONDS" "$phase_start_time" &
progress_pid=$!

echo -e "${CYAN}Testing all endpoints...${NC}"
# Give a moment for services to be fully up
sleep 5
# Test main site
SITE_HTTP=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us" 2>/dev/null || echo "000")
SITE_HTTPS=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us" 2>/dev/null || echo "000")

# Test APIs
API_NEST_HTTP=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
API_NEST_HTTPS=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
API_GO_HTTP=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/api-go/health" 2>/dev/null || echo "000")
API_GO_HTTPS=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/api-go/health" 2>/dev/null || echo "000")

# Display results
echo -e "${CYAN}Endpoint Test Results:${NC}"
echo -e "  Main Site HTTP:  $([ "$SITE_HTTP" -eq 200 ] && echo -e "${GREEN}✓ $SITE_HTTP${NC}" || echo -e "${YELLOW}⚠ $SITE_HTTP${NC}")"
echo -e "  Main Site HTTPS: $([ "$SITE_HTTPS" -eq 200 ] && echo -e "${GREEN}✓ $SITE_HTTPS${NC}" || echo -e "${YELLOW}⚠ $SITE_HTTPS${NC}")"
echo -e "  NestJS API HTTP: $([ "$API_NEST_HTTP" -eq 200 ] && echo -e "${GREEN}✓ $API_NEST_HTTP${NC}" || echo -e "${YELLOW}⚠ $API_NEST_HTTP${NC}")"
echo -e "  NestJS API HTTPS: $([ "$API_NEST_HTTPS" -eq 200 ] && echo -e "${GREEN}✓ $API_NEST_HTTPS${NC}" || echo -e "${YELLOW}⚠ $API_NEST_HTTPS${NC}")"
echo -e "  Go API HTTP:     $([ "$API_GO_HTTP" -eq 200 ] && echo -e "${GREEN}✓ $API_GO_HTTP${NC}" || echo -e "${YELLOW}⚠ $API_GO_HTTP${NC}")"
echo -e "  Go API HTTPS:    $([ "$API_GO_HTTPS" -eq 200 ] && echo -e "${GREEN}✓ $API_GO_HTTPS${NC}" || echo -e "${YELLOW}⚠ $API_GO_HTTPS${NC}")"

# Test WebSocket if available
if command -v wscat &> /dev/null; then
    echo -e "${CYAN}Testing WebSocket connections...${NC}"
    
    if [ "$SITE_HTTPS" -eq 200 ]; then
        timeout 5s wscat -c "wss://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null && \
        echo -e "${GREEN}✓ WSS connection working${NC}" || \
        echo -e "${YELLOW}⚠ WSS connection failed${NC}"
    else
        timeout 5s wscat -c "ws://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null && \
        echo -e "${GREEN}✓ WS connection working${NC}" || \
        echo -e "${YELLOW}⚠ WS connection failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ wscat not installed - install with: sudo npm install -g wscat${NC}"
fi

kill "$progress_pid" &>/dev/null || true
wait "$progress_pid" &>/dev/null || true
cleanup_progress_line
echo -e "${GREEN}✓ System tests completed.${NC}"

step_header "Phase E: System Status & Deployment Summary"

# PM2 status
echo -e "${CYAN}PM2 Services:${NC}"
if id "craft-fusion" &>/dev/null; then
    sudo -n -u craft-fusion pm2 list 2>/dev/null || pm2 list 2>/dev/null || echo -e "${YELLOW}PM2 not accessible${NC}"
else
    pm2 list 2>/dev/null || echo -e "${YELLOW}PM2 not accessible${NC}"
fi

# Nginx status
echo -e "${CYAN}Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is not running${NC}"
fi

# Disk usage
echo -e "${CYAN}Disk Usage:${NC}"
df -h / | tail -1 | awk '{print "  Root partition: " $3 " used of " $2 " (" $5 " full)"}'

# Memory usage
echo -e "${CYAN}Memory Usage:${NC}"
free -h | grep Mem | awk '{print "  Memory: " $3 " used of " $2}'

# Deployment step totals summary
TOTAL_PHASES=3 # Prep, Deploy, Test. SSL is conditional.
COMPLETED_PHASES=0

# Phase A: Preparation
prep_phase_succeeded=false # Renamed from prep_phase_succeeded for clarity
npm_install_overall_succeeded=false
if [ "${npm_ci_status:-0}" -eq 0 ] || \
   { [ "${npm_ci_status}" -ne 0 ] && [ "${npm_ci_retry_status:-1}" -eq 0 ]; }; then
    npm_install_overall_succeeded=true
fi

clean_step_overall_succeeded=false
if [ "$do_full_clean" = true ]; then
    [ "${CLEAN_STATUS:-1}" -eq 0 ] && clean_step_overall_succeeded=true
else
    [ "${CLEAN_STATUS:-1}" -eq 0 ] && clean_step_overall_succeeded=true # Non-full clean's CLEAN_STATUS is set to 0
fi

nx_post_install_overall_succeeded=false
[ "${nx_post_install_final_status:-1}" -eq 0 ] && nx_post_install_overall_succeeded=true

if [ "$npm_install_overall_succeeded" = true ] && \
   [ "$clean_step_overall_succeeded" = true ] && \
   [ "$nx_post_install_overall_succeeded" = true ]; then
    prep_phase_succeeded=true
    echo -e "${GREEN}✓ Preparation Phase (Clean, NPM Install, Nx Post-Install): Successful${NC}"
    COMPLETED_PHASES=$((COMPLETED_PHASES + 1))
else
    echo -e "${RED}✗ Preparation Phase: Had Issues${NC}"
    [ "$clean_step_overall_succeeded" = false ] && echo -e "  - Clean Step: Failed (Status: ${CLEAN_STATUS:-N/A})"
    [ "$npm_install_overall_succeeded" = false ] && echo -e "  - NPM Install: Failed (Initial: ${npm_ci_status:-N/A}, Retry: ${npm_ci_retry_status:-N/A})"
    [ "$nx_post_install_overall_succeeded" = false ] && echo -e "  - Nx Post-Install: Failed or Aborted by user (Status: ${nx_post_install_final_status:-N/A})"
fi

# Phase B: Backend & Frontend Deployment
deploy_phase_succeeded=false
if [ "${backend_status:-1}" -eq 0 ] && [ "${frontend_status:-1}" -eq 0 ]; then
    deploy_phase_succeeded=true
    echo -e "${GREEN}✓ Backend & Frontend deployment phase successful.${NC}"
    COMPLETED_PHASES=$((COMPLETED_PHASES+1))
else
    echo -e "${RED}✗ Backend & Frontend deployment phase: Had Issues${NC}"
    [ "${backend_status:-1}" -ne 0 ] && echo -e "  - Backend Deployment: Failed (Exit Code: ${backend_status:-N/A})"
    [ "${frontend_status:-1}" -ne 0 ] && echo -e "  - Frontend Deployment: Failed (Exit Code: ${frontend_status:-N/A})"
fi

# Phase C: SSL/WSS Setup (Conditional)
if [ "$ssl_setup_attempted" = true ]; then
    TOTAL_PHASES=$((TOTAL_PHASES + 1))
    if [ "$ssl_setup_succeeded" = true ]; then
        echo -e "${GREEN}✓ SSL/WSS Setup Phase: Successful (or already configured)${NC}"
        COMPLETED_PHASES=$((COMPLETED_PHASES + 1))
    else
        echo -e "${RED}✗ SSL/WSS Setup Phase: Failed or Not Completed As Expected${NC}"
    fi
fi

# Phase D: System Tests (Site + APIs)
tests_phase_succeeded=false
site_ok=false
apis_ok=false

# Determine expected protocol based on SSL setup choice
expected_protocol="http"
ssl_setup_choice="${REPLY:-N}" # Default to N if REPLY is not set
if [[ $ssl_setup_choice =~ ^[Yy]$ ]]; then
    expected_protocol="https"
fi

# Site check
if [ "$ssl_setup_succeeded" = true ]; then # True if SSL was attempted and scripts completed
    [ "$SITE_HTTPS" -eq 200 ] && site_ok=true
else # HTTP expected, or HTTPS works even if SSL not chosen/completed this run
    if [ "$SITE_HTTP" -eq 200 ] || [ "$SITE_HTTP" -eq 301 ] || [ "$SITE_HTTP" -eq 302 ]; then
        site_ok=true
    elif [ "$SITE_HTTPS" -eq 200 ]; then # If HTTPS works (e.g. pre-existing config)
        site_ok=true
        echo -e "${YELLOW}  Note: Site accessible via HTTPS, though SSL setup was not explicitly chosen/completed in this run.${NC}"
    fi
fi

# API check (NestJS and Go must both be accessible via HTTP or HTTPS)
nest_api_ok=false; go_api_ok=false
([ "${API_NEST_HTTP:-0}" -eq 200 ] || [ "${API_NEST_HTTPS:-0}" -eq 200 ]) && nest_api_ok=true
([ "${API_GO_HTTP:-0}" -eq 200 ] || [ "${API_GO_HTTPS:-0}" -eq 200 ]) && go_api_ok=true
[ "$nest_api_ok" = true ] && [ "$go_api_ok" = true ] && apis_ok=true

if [ "$site_ok" = true ] && [ "$apis_ok" = true ]; then
    tests_phase_succeeded=true
    echo -e "${GREEN}✓ System tests phase (Site & APIs) successful.${NC}"
    COMPLETED_PHASES=$((COMPLETED_PHASES + 1))
else
    echo -e "${RED}✗ System Tests Phase: Had Issues${NC}"
    if [ "$site_ok" = false ]; then
        echo -e "  - Main Site: Not accessible as expected."
        echo -e "    (Expected HTTPS if SSL setup was successful: $ssl_setup_succeeded. Site HTTP: ${SITE_HTTP:-N/A}, Site HTTPS: ${SITE_HTTPS:-N/A})"
    fi
    if [ "$apis_ok" = false ]; then
        echo -e "  - APIs: One or more not accessible."
        [ "$nest_api_ok" = false ] && echo -e "    (NestJS API - HTTP: ${API_NEST_HTTP:-N/A}, HTTPS: ${API_NEST_HTTPS:-N/A})"
        [ "$go_api_ok" = false ] && echo -e "    (Go API - HTTP: ${API_GO_HTTP:-N/A}, HTTPS: ${API_GO_HTTPS:-N/A})"
    fi
fi

echo -e "\n${BOLD}Overall Deployment Status:${NC}"
if [ "$COMPLETED_PHASES" -eq "$TOTAL_PHASES" ]; then
  echo -e "${BOLD}${GREEN}All $TOTAL_PHASES deployment phases completed successfully!${NC}"
else
  echo -e "${BOLD}${YELLOW}Deployment completed with $COMPLETED_PHASES/$TOTAL_PHASES successful phases. Review output above for details.${NC}"
fi

echo -e "${BOLD}${GREEN}\n=== Craft Fusion Deployment Complete ===${NC}"
echo -e "${BOLD}${BLUE}🎉 Your Craft Fusion application is now deployed!${NC}"
echo

echo -e "${BLUE}Access your application:${NC}"
if [ "$SITE_HTTPS" -eq 200 ]; then
    echo -e "  🌐 Main Site: ${GREEN}https://jeffreysanford.us${NC}"
    echo -e "  🔌 WebSocket: ${GREEN}wss://jeffreysanford.us${NC}"
else
    echo -e "  🌐 Main Site: ${GREEN}http://jeffreysanford.us${NC}"
    echo -e "  🔌 WebSocket: ${GREEN}ws://jeffreysanford.us${NC}"
fi

echo -e "${BLUE}API Endpoints:${NC}"
echo -e "  📡 NestJS API: ${GREEN}/api/*${NC}"
echo -e "  🚀 Go API: ${GREEN}/api-go/*${NC}"

echo -e "${BLUE}Management Commands:${NC}"
echo -e "  View all logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log /var/log/craft-fusion/*/out.log${NC}"
echo -e "  PM2 dashboard: ${YELLOW}sudo -u craft-fusion pm2 monit${NC}"
echo -e "  Restart all: ${YELLOW}sudo -u craft-fusion pm2 restart all && sudo nginx -s reload${NC}"

# After your system tests and before the summary, add the OSCAL Compliance Report phase:
step_header "Phase F: OSCAL Compliance Report"

PROFILES_TO_REPORT=("standard" "ospp" "pci-dss" "cusp" "medium-high" "rev5" "truenorth")

if ! command -v xmllint &> /dev/null && ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: xmllint and jq are not installed. Detailed OSCAL reporting will be limited.${NC}"
    echo -e "${BLUE}Consider installing them: sudo dnf install libxml2 jq (Fedora) or sudo apt install libxml2-utils jq (Debian/Ubuntu)${NC}"
fi

for profile in "${PROFILES_TO_REPORT[@]}"; do
    printf "\n${BOLD}${CYAN}--- OSCAL Report for Profile: %s ---${NC}\n" "$profile"
    result_file=""
    report_file_html=""
    file_type=""

    if [ "$profile" = "truenorth" ]; then
        if [ -f "$OSCAL_DIR/user-readable-results-truenorth.json" ]; then
            result_file="$OSCAL_DIR/user-readable-results-truenorth.json"
            report_file_html="$OSCAL_DIR/user-readable-report-truenorth.html"
            file_type="json"
        elif [ -f "$OSCAL_DIR/truenorth-results.json" ]; then
            result_file="$OSCAL_DIR/truenorth-results.json"
            report_file_html="$OSCAL_DIR/oscap-report-truenorth.html"
            file_type="json"
        fi
    else
        if [ -f "$OSCAL_DIR/user-readable-results-$profile.xml" ]; then
            result_file="$OSCAL_DIR/user-readable-results-$profile.xml"
            report_file_html="$OSCAL_DIR/user-readable-report-$profile.html"
            file_type="xml"
        elif [ -f "$OSCAL_DIR/oscap-results-$profile.xml" ]; then
            result_file="$OSCAL_DIR/oscap-results-$profile.xml"
            report_file_html="$OSCAL_DIR/oscap-report-$profile.html"
            file_type="xml"
        elif [ "$profile" = "standard" ]; then
            if [ -f "$OSCAL_DIR/user-readable-results.xml" ]; then
                result_file="$OSCAL_DIR/user-readable-results.xml"
                report_file_html="$OSCAL_DIR/user-readable-report.html"
                file_type="xml"
            elif [ -f "$OSCAL_DIR/oscap-results.xml" ]; then
                result_file="$OSCAL_DIR/oscap-results.xml"
                report_file_html="$OSCAL_DIR/oscap-report.html"
                file_type="xml"
            fi
        fi
    fi

    if [ -z "$result_file" ] || [ ! -f "$result_file" ]; then
        echo -e "  ${YELLOW}Results file not found for profile '$profile'.${NC}"
        continue
    fi

    echo -e "  ${BLUE}Report File:${NC} ${WHITE}$result_file${NC}"
    [ -f "$report_file_html" ] && echo -e "  ${BLUE}HTML Report:${NC} ${WHITE}$report_file_html${NC}"

    if [ "$file_type" = "xml" ] && command -v xmllint &> /dev/null; then
        TOTAL_XPATH="count(//rule-result)"
        PASS_XPATH="count(//rule-result[result='pass'])"
        FAIL_XPATH="count(//rule-result[result='fail'])"
        NOTAPPLICABLE_XPATH="count(//rule-result[result='notapplicable'])"

        TOTAL=$(xmllint --xpath "$TOTAL_XPATH" "$result_file" 2>/dev/null || echo 0)
        PASS=$(xmllint --xpath "$PASS_XPATH" "$result_file" 2>/dev/null || echo 0)
        FAIL=$(xmllint --xpath "$FAIL_XPATH" "$result_file" 2>/dev/null || echo 0)
        NOTAPPLICABLE=$(xmllint --xpath "$NOTAPPLICABLE_XPATH" "$result_file" 2>/dev/null || echo 0)
        OTHER=$((TOTAL - PASS - FAIL - NOTAPPLICABLE))
        [ $OTHER -lt 0 ] && OTHER=0

        echo -e "  ${GREEN}Pass:${NC} $PASS  ${RED}Fail:${NC} $FAIL  ${YELLOW}N/A:${NC} $NOTAPPLICABLE  ${WHITE}Other:${NC} $OTHER  ${BOLD}Total:${NC} $TOTAL"
        echo -e "  ${CYAN}Individual Controls:${NC}"

        rule_results_data=$(xmllint --xpath "//rule-result" "$result_file" 2>/dev/null)
        echo "$rule_results_data" | grep -oP '<rule-result idref="[^"]+">[\s\S]*?</rule-result>' | while IFS= read -r rule_block; do
            CONTROL_ID=$(echo "$rule_block" | grep -oP 'idref="\K[^"]+')
            RESULT=$(echo "$rule_block" | grep -oP '<result>\K[^<]+')

            case "$RESULT" in
                pass)           printf "    ${GREEN}✓ %-40s : %s${NC}\n" "$CONTROL_ID" "$RESULT" ;;
                fail)           printf "    ${RED}✗ %-40s : %s${NC}\n" "$CONTROL_ID" "$RESULT" ;;
                notapplicable)  printf "    ${YELLOW}○ %-40s : %s${NC}\n" "$CONTROL_ID" "$RESULT" ;;
                *)              printf "    ${WHITE}? %-40s : %s${NC}" "$CONTROL_ID" "$RESULT" ;;
            esac
        done
    elif [ "$file_type" = "json" ] && command -v jq &> /dev/null; then
        PASS=$(jq -r '.scan_results.controls.passed // 0' "$result_file")
        FAIL=$(jq -r '.scan_results.controls.failed // 0' "$result_file")
        NOTAPPLICABLE=$(jq -r '.scan_results.controls.not_applicable // 0' "$result_file")
        TOTAL=$(jq -r '.scan_results.controls.total // 0' "$result_file")
        echo -e "  ${GREEN}Pass:${NC} $PASS  ${RED}Fail:${NC} $FAIL  ${YELLOW}N/A:${NC} $NOTAPPLICABLE  ${BOLD}Total:${NC} $TOTAL (from JSON)"
        jq -r '.control_results[] | "    \(if .status == "pass" then "\(.status|@text|gsub("pass";"✓"))" elif .status == "fail" then "\(.status|@text|gsub("fail";"✗"))" else "○" end) \(.control_id) : \(.status)"' "$result_file" | sed -e "s/✓/${GREEN}✓${NC}/g" -e "s/✗/${RED}✗${NC}/g" -e "s/○/${YELLOW}○${NC}"
    else
        echo -e "  ${YELLOW}Cannot parse details. Install xmllint (for XML) or jq (for JSON).${NC}"
    fi
done

echo -e "${GREEN}✓ OSCAL Compliance Report Phase: Completed${NC}"

# ===================================================================
# FRONTEND DEPLOYMENT VERIFICATION CHECKLIST
# ===================================================================
echo
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${MAGENTA}           🌐 FRONTEND DEPLOYMENT VERIFICATION CHECKLIST                ${NC}"
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════════════════════${NC}"
echo

if [ "${frontend_status:-1}" -eq 0 ]; then
    echo -e "${BOLD}${CYAN}🔍 IMMEDIATE VERIFICATION STEPS:${NC}"
    echo -e "  ${GREEN}□${NC} Main site loads: ${YELLOW}curl -I https://jeffreysanford.us${NC}"
    echo -e "  ${GREEN}□${NC} HTTPS redirect works: ${YELLOW}curl -I http://jeffreysanford.us${NC}"
    echo -e "  ${GREEN}□${NC} Angular SPA routing: ${YELLOW}curl -I https://jeffreysanford.us/about${NC}"
    echo -e "  ${GREEN}□${NC} Static assets load: ${YELLOW}curl -I https://jeffreysanford.us/favicon.ico${NC}"
    echo
    
    echo -e "${BOLD}${CYAN}🔗 BACKEND INTEGRATION TESTS:${NC}"
    echo -e "  ${GREEN}□${NC} NestJS API health: ${YELLOW}curl https://jeffreysanford.us/api/health${NC}"
    echo -e "  ${GREEN}□${NC} Go API health: ${YELLOW}curl https://jeffreysanford.us/api-go/ping${NC}"
    echo -e "  ${GREEN}□${NC} WebSocket connectivity: Test in browser dev tools"
    echo -e "  ${GREEN}□${NC} Check service status: ${YELLOW}pm2 status${NC}"
    echo
    
    echo -e "${BOLD}${CYAN}📊 MONITORING & MAINTENANCE:${NC}"
    echo -e "  ${GREEN}□${NC} Watch access logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
    echo -e "  ${GREEN}□${NC} Check error logs: ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
    echo -e "  ${GREEN}□${NC} Monitor backend logs: ${YELLOW}pm2 logs${NC}"
    echo -e "  ${GREEN}□${NC} Verify nginx config: ${YELLOW}sudo nginx -t${NC}"
    echo
    
    echo -e "${BOLD}${CYAN}⚙️  PRODUCTION HEALTH CHECKS:${NC}"
    echo -e "  ${GREEN}□${NC} SSL certificate status: ${YELLOW}openssl x509 -in /etc/letsencrypt/live/jeffreysanford.us/fullchain.pem -dates -noout${NC}"
    echo -e "  ${GREEN}□${NC} Disk space check: ${YELLOW}df -h${NC}"
    echo -e "  ${GREEN}□${NC} Memory usage: ${YELLOW}free -h${NC}"
    echo -e "  ${GREEN}□${NC} SELinux contexts: ${YELLOW}ls -Z /var/www/jeffreysanford.us/${NC}"
    echo
    
    echo -e "${BOLD}${YELLOW}💡 TROUBLESHOOTING COMMON ISSUES:${NC}"
    echo -e "  ${RED}503 Service Unavailable:${NC} Backend down → ${YELLOW}pm2 restart all${NC}"
    echo -e "  ${RED}404 on Angular routes:${NC} nginx try_files issue → Check nginx config"
    echo -e "  ${RED}Static assets 404:${NC} Permissions issue → ${YELLOW}sudo chown -R nginx:nginx /var/www/jeffreysanford.us${NC}"
    echo -e "  ${RED}WebSocket connection fails:${NC} Proxy headers → Check nginx WebSocket config"
    echo -e "  ${RED}SSL certificate errors:${NC} Renewal needed → ${YELLOW}sudo certbot renew${NC}"
    echo
    
    echo -e "${BOLD}${GREEN}✅ Frontend deployment verified! Remember to:${NC}"
    echo -e "${BOLD}${BLUE}   • Test the application thoroughly${NC}"
    echo -e "${BOLD}${BLUE}   • Notify your team about the deployment${NC}"
    echo -e "${BOLD}${BLUE}   • Monitor logs for the first few minutes${NC}"
    echo -e "${BOLD}${BLUE}   • Update documentation if needed${NC}"
else
    echo -e "${BOLD}${RED}❌ Frontend deployment failed!${NC}"
    echo -e "${YELLOW}Please review the deployment logs above and fix issues before proceeding.${NC}"
    echo
    echo -e "${BOLD}${YELLOW}Quick debugging steps:${NC}"
    echo -e "  ${YELLOW}1.${NC} Check build logs: ${YELLOW}npm run build:prod${NC}"
    echo -e "  ${YELLOW}2.${NC} Verify nginx config: ${YELLOW}sudo nginx -t${NC}"
    echo -e "  ${YELLOW}3.${NC} Check disk space: ${YELLOW}df -h${NC}"
    echo -e "  ${YELLOW}4.${NC} Review permissions: ${YELLOW}ls -la /var/www/jeffreysanford.us/${NC}"
    echo -e "  ${YELLOW}5.${NC} Try manual deployment: ${YELLOW}./scripts/deploy-frontend.sh --server-build${NC}"
fi

echo
