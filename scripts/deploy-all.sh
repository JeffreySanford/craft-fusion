#!/bin/bash
# deploy-all.sh - Optimized application deployment script for Fedora server with memory optimization

set -e

# Vibrant deployment header
BOLD=$'\033[1m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'; WHITE=$'\033[1;37m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; RED=$'\033[0;31m'; MAGENTA=$'\033[0;35m'; BLUE=$'\033[0;34m'

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
POWER_MODE=false
do_full_clean=false
for arg in "$@"; do
  if [ "$arg" == "--full-clean" ]; then
    do_full_clean=true
  fi
  if [ "$arg" == "--power" ]; then
    POWER_MODE=true
  fi
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
source "$(dirname "$0")/system-prep.sh"

# After sourcing system-prep.sh, print a clear, modernized summary of available tools
printf "${CYAN}Available Tools:${NC}\n  Check resources: ${YELLOW}resource-monitor.sh${NC}\n  Emergency cleanup: ${YELLOW}memory-cleanup.sh${NC}\n  Manual memory cleanup: ${YELLOW}sudo sysctl vm.drop_caches=3${NC}\n"
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
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo -e "${CYAN}Installing dependencies (detected change)...${NC}"
  echo -e "${BLUE}NPM install in progress...${NC}"
  echo -e "${BLUE}The progress bar is an overall estimate for this NPM installation phase.${NC}"
  echo -e "${BLUE}Please be patient while NPM completes all its tasks.${NC}"
  NPM_CI_ESTIMATE_SECONDS=240 # 4 minutes (adjusted based on typical performance)
  phase_start_time=$(date +%s)
  print_progress "NPM Install (npm ci)" "$NPM_CI_ESTIMATE_SECONDS" "$phase_start_time" &
  progress_pid=$!

  # Initial attempt with default concurrency (remove --maxsockets=1)
  npm ci --loglevel error --omit=optional --no-audit --prefer-offline --no-progress
  npm_ci_status=$?

  kill "$progress_pid" &>/dev/null || true
  wait "$progress_pid" &>/dev/null || true
  cleanup_progress_line

  if [ $npm_ci_status -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully via npm ci${NC}"
    [ -d node_modules/nx ] && { handle_nx_post_install; nx_post_install_final_status=$?; } || nx_post_install_final_status=0
  else
    echo -e "${YELLOW}⚠ First npm ci failed (exit code $npm_ci_status), trying with reduced concurrency (--maxsockets 1)...${NC}"
    NPM_CI_RETRY_ESTIMATE_SECONDS=300
    phase_start_time=$(date +%s)
    print_progress "NPM Install (retry)" "$NPM_CI_RETRY_ESTIMATE_SECONDS" "$phase_start_time" &
    progress_pid=$!
    npm ci --loglevel error --maxsockets 1 --omit=optional --no-audit --prefer-offline --no-progress
    npm_ci_retry_status=$?
    kill "$progress_pid" &>/dev/null || true
    wait "$progress_pid" &>/dev/null || true
    cleanup_progress_line
    echo -e "${BLUE}NPM install command (retry) finished. Verifying status...${NC}"
    if [ $npm_ci_retry_status -eq 0 ]; then
      echo -e "${GREEN}✓ Dependencies installed (retry successful)${NC}"
      [ -d node_modules/nx ] && { handle_nx_post_install; nx_post_install_final_status=$?; } || nx_post_install_final_status=0
    else
      echo -e "${RED}✗ Dependencies installation failed on retry (exit code $npm_ci_retry_status)${NC}"
      exit 1
    fi
  fi
else
  echo -e "${GREEN}✓ node_modules up-to-date, skipping npm install${NC}"
  npm_ci_status=0 # Mark as success for summary if skipped
  [ -d node_modules/nx ] && { handle_nx_post_install; nx_post_install_final_status=$?; } || nx_post_install_final_status=0
fi

# --- Nx Pre-check (after npm install) ---
if [ ! -d node_modules/@nrwl ] && [ ! -d node_modules/nx ]; then
  echo -e "${RED}✗ Nx modules not found in node_modules. Nx-based scripts will fail.${NC}"
  echo -e "${YELLOW}Please run: ${BOLD}npm install${NC}${YELLOW} in your workspace root before deploying.${NC}"
  exit 1
fi

# =====================
# Phase 1: Backend & Frontend Deployment (Parallel)
# Renamed to Phase B
# =====================
step_header "Phase B: Backend & Frontend Deployment (Parallel)"

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

# --- Build backend and frontend in parallel ---
PARALLEL_DEPLOY_ESTIMATE_SECONDS=240 # 4 minutes (max of backend/frontend estimates)
phase_start_time=$(date +%s)
print_progress "Backend & Frontend" "$PARALLEL_DEPLOY_ESTIMATE_SECONDS" "$phase_start_time" &
progress_pid=$!

deploy_start_time=$(date +%s)
$POWER_NICE ./scripts/deploy-backend.sh &
backend_pid=$!
$POWER_NICE ./scripts/deploy-frontend.sh &
frontend_pid=$!

wait $backend_pid
backend_status=$?
wait $frontend_pid
frontend_status=$?
deploy_end_time=$(date +%s)

kill "$progress_pid" &>/dev/null || true
wait "$progress_pid" &>/dev/null || true
cleanup_progress_line

if [ $backend_status -eq 0 ] && [ $frontend_status -eq 0 ]; then
    echo -e "${GREEN}✓ Backend and frontend deployed in $((deploy_end_time-deploy_start_time)) seconds${NC}"
else
    echo -e "${RED}✗ Errors during backend/frontend parallel deployment.${NC}"
    [ $backend_status -ne 0 ] && echo -e "${RED}  Backend deployment failed (PID $backend_pid, exit code $backend_status)${NC}"
    [ $frontend_status -ne 0 ] && echo -e "${RED}  Frontend deployment failed (PID $frontend_pid, exit code $frontend_status)${NC}"
fi

step_header "Phase C: SSL/WSS Setup (Optional)"
read -p "Do you want to set up SSL/WSS? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssl_setup_attempted=true
    if [ ! -f "/etc/nginx/sites-available/default" ] || ! grep -q "ssl_certificate" /etc/nginx/sites-available/default; then
        echo -e "${YELLOW}Setting up SSL certificates and WSS configuration...${NC}"
        ./scripts/ssl-setup.sh
        ./scripts/wss-setup.sh
        ssl_setup_succeeded=true # If scripts complete without error (due to set -e)
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
API_GO_HTTP=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/go-api/health" 2>/dev/null || echo "000")
API_GO_HTTPS=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/go-api/health" 2>/dev/null || echo "000")

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
    echo -e "${YELLOW}⚠ wscat not installed - install with: npm install -g wscat${NC}"
fi

kill "$progress_pid" &>/dev/null || true
wait "$progress_pid" &>/dev/null || true
cleanup_progress_line
echo -e "${GREEN}✓ System tests completed.${NC}"

step_header "Phase E: System Status & Deployment Summary"

# PM2 status
echo -e "${CYAN}PM2 Services:${NC}"
sudo -u craft-fusion pm2 list 2>/dev/null || echo -e "${YELLOW}PM2 not accessible${NC}"

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
if [ "${npm_ci_status:-1}" -eq 0 ] || \
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
echo -e "  🚀 Go API: ${GREEN}/go-api/*${NC}"

echo -e "${BLUE}Management Commands:${NC}"
echo -e "  View all logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log /var/log/craft-fusion/*/out.log${NC}"
echo -e "  PM2 dashboard: ${YELLOW}sudo -u craft-fusion pm2 monit${NC}"
echo -e "  Restart all: ${YELLOW}sudo -u craft-fusion pm2 restart all && sudo nginx -s reload${NC}"
