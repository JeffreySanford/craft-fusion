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
        command sleep 15 # Update interval to 15 seconds
    done
}

cleanup_progress_line() { [ -t 1 ] && printf "\r\033[K"; }

# Parse arguments
do_full_clean=false
for arg in "$@"; do
  if [ "$arg" == "--full-clean" ]; then
    do_full_clean=true
  fi
done

echo -e "${BOLD}${WHITE}=== Craft Fusion Complete Deployment Started ===${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"
cd "$PROJECT_ROOT"

# Memory optimization settings
export NODE_OPTIONS="--max-old-space-size=512"
export NX_CACHE_DIRECTORY="/tmp/nx-cache"

# Ensure scripts are executable
chmod +x scripts/*.sh

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

    # Clear system caches to free memory
    sudo sync 2>/dev/null || true
    sudo sysctl vm.drop_caches=1 2>/dev/null || true
    
    echo -e "${GREEN}✓ System caches cleared${NC}"
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
  ./scripts/clean-build.sh
  CLEAN_STATUS=$?
  if [ $CLEAN_STATUS -ne 0 ]; then
    echo -e "${YELLOW}⚠ clean-build.sh failed, retrying once...${NC}"
    ./scripts/clean-build.sh
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

  ./scripts/clean-build.sh || true

  kill "$progress_pid" &>/dev/null || true
  wait "$progress_pid" &>/dev/null || true
  cleanup_progress_line
  echo -e "${GREEN}✓ Build outputs cleaned${NC}"
fi

# Only install dependencies if node_modules is missing or package-lock.json changed
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo -e "${CYAN}Installing dependencies (detected change)...${NC}"
  NPM_CI_ESTIMATE_SECONDS=300 # 5 minutes
  phase_start_time=$(date +%s)
  print_progress "NPM Install (npm ci)" "$NPM_CI_ESTIMATE_SECONDS" "$phase_start_time" &
  progress_pid=$!

  npm ci --omit=optional --no-audit --prefer-offline --progress=false --maxsockets=1
  npm_ci_status=$?

  kill "$progress_pid" &>/dev/null || true
  wait "$progress_pid" &>/dev/null || true
  cleanup_progress_line
  echo -e "${BLUE}NPM install command finished. Verifying status...${NC}"

  if [ $npm_ci_status -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully via npm ci${NC}"
  else
    # Fallback or retry logic if needed
    echo -e "${YELLOW}⚠ First npm ci failed, trying with reduced concurrency...${NC}"
    NPM_CI_RETRY_ESTIMATE_SECONDS=300
    phase_start_time=$(date +%s)
    print_progress "NPM Install (retry)" "$NPM_CI_RETRY_ESTIMATE_SECONDS" "$phase_start_time" &
    progress_pid=$!

    npm ci --maxsockets 1 --omit=optional --no-audit --prefer-offline --progress=false
    npm_ci_retry_status=$?
    kill "$progress_pid" &>/dev/null || true
    wait "$progress_pid" &>/dev/null || true
    cleanup_progress_line
    echo -e "${BLUE}NPM install command (retry) finished. Verifying status...${NC}"

    if [ $npm_ci_retry_status -eq 0 ]; then
      echo -e "${GREEN}✓ Dependencies installed (retry successful)${NC}"
    else
      echo -e "${RED}✗ Dependencies installation failed${NC}"
      exit 1
    fi
  fi
else
  echo -e "${GREEN}✓ node_modules up-to-date, skipping npm install${NC}"
fi

step_header "Phase 0: FedRAMP OSCAL Compliance Scan (Optional)"
read -p "Run a FedRAMP OSCAL scan before deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    OSCAL_ESTIMATE_SECONDS=300 # 5 minutes
    phase_start_time=$(date +%s)
    print_progress "OSCAL Scan (standard)" "$OSCAL_ESTIMATE_SECONDS" "$phase_start_time" &
    progress_pid=$!

    ./scripts/fedramp-oscal.sh standard
    oscal_status=$?

    kill "$progress_pid" &>/dev/null || true
    wait "$progress_pid" &>/dev/null || true
    cleanup_progress_line

    if [ $oscal_status -eq 0 ]; then
        echo -e "${GREEN}✓ OSCAL scan complete. See ./oscal-analysis/oscap-report.html${NC}"
    else
        echo -e "${YELLOW}⚠ OSCAL scan failed or incomplete${NC}"
    fi
else
    echo -e "${YELLOW}Skipping OSCAL scan${NC}"
fi

step_header "Phase 1: Backend & Frontend Deployment (Parallel)"
# Build backend and frontend in parallel
PARALLEL_DEPLOY_ESTIMATE_SECONDS=240 # 4 minutes (max of backend/frontend estimates)
phase_start_time=$(date +%s)
print_progress "Backend & Frontend" "$PARALLEL_DEPLOY_ESTIMATE_SECONDS" "$phase_start_time" &
progress_pid=$!

deploy_start_time=$(date +%s)
./scripts/deploy-backend.sh &
backend_pid=$!
./scripts/deploy-frontend.sh &
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

step_header "Phase 3: SSL/WSS Setup (Optional)"
read -p "Do you want to set up SSL/WSS? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -f "/etc/nginx/sites-available/default" ] || ! grep -q "ssl_certificate" /etc/nginx/sites-available/default; then
        echo -e "${YELLOW}Setting up SSL certificates and WSS configuration...${NC}"
        ./scripts/ssl-setup.sh
        ./scripts/wss-setup.sh
    else
        echo -e "${GREEN}✓ SSL/WSS already configured${NC}"
    fi
else
    echo -e "${YELLOW}Skipping SSL/WSS setup${NC}"
fi

step_header "Phase 4: Final System Tests"
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

step_header "Phase 5: System Status Summary"

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
