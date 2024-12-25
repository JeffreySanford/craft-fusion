#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Digital Ocean
# ============================================================
# This script automates the deployment of the Craft-Fusion project.
# It builds frontend (craft-web), backend (craft-nest, craft-go),
# manages services with PM2, and deploys assets to NGINX.
# ------------------------------------------------------------
# ⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ============================================================

# === Globals ===
TOTAL_STEPS=15
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
LOG_FILE="deploy-digital-ocean.log"
FULL_CLEAN=false

# === Environment ===
FRONTEND_BUILD_PATH="dist/apps/craft-web/browser"
BACKEND_NEST_PATH="dist/apps/craft-nest/main.js"
BACKEND_GO_PATH="dist/apps/craft-go/main"
NGINX_PATH="/usr/share/nginx/html"
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# === Argument Parsing ===
if [[ "$1" == "--full-clean" ]]; then
    FULL_CLEAN=true
    echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Performing a complete cleanup of dependencies, cache, and build artifacts.\033[0m"
fi

# === Logging Helpers ===
function log_info() {
    echo "[INFO] $1" | tee -a "$LOG_FILE"
}
function log_error() {
    echo "[ERROR] ❌ $1" | tee -a "$LOG_FILE"
}
function log_warning() {
    echo "[WARNING] ⚠️ $1" | tee -a "$LOG_FILE"
}
function report_time() {
    local START_TIME=$1
    local LABEL=$2
    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    echo "[INFO] ✅ $LABEL took: \033[1;32m$DURATION seconds\033[0m"
    log_info "$LABEL took: $DURATION seconds"
}

# === Progress Bar ===
function step_progress() {
    ((CURRENT_STEP++))
    local percentage=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    local progress=$((CURRENT_STEP * PROGRESS_BAR_LENGTH / TOTAL_STEPS))
    local remaining=$((PROGRESS_BAR_LENGTH - progress))
    echo -ne "\033[0;32m[STEP $CURRENT_STEP/$TOTAL_STEPS] [$percentage%] \033[0;37m"
    printf "%-${PROGRESS_BAR_LENGTH}s" "$(printf '#%.0s' $(seq 1 $progress))"
    printf "%-${remaining}s" ""
    echo -e " \033[0;32m✔\033[0m"
}

# === Fetch System and OSINT Metrics ===
function fetch_system_metrics() {
    START_TIME_METRICS=$(date +%s)
    echo "[INFO] 📊 Gathering System and OSINT Metrics..."

    # Fetch System Metrics
    OS_NAME=$(uname -o)
    OS_VERSION=$(grep -w PRETTY_NAME /etc/os-release | cut -d= -f2 | tr -d '"')
    CPU_CORES=$(nproc)
    TOTAL_RAM=$(free -h | grep Mem | awk '{print $2}')
    UPTIME=$(uptime -p)
    CURRENT_USER=$(whoami)
    HOSTNAME=$(hostname)
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
    DISK_USAGE=$(df -h --output=avail / | tail -n 1 | xargs)
    
    log_info "System Information:"
    log_info "  OS: $OS_NAME"
    log_info "  OS Version: $OS_VERSION"
    log_info "  CPU Cores: $CPU_CORES"
    log_info "  Total RAM: $TOTAL_RAM"
    log_info "  Uptime: $UPTIME"
    log_info "  Current User: $CURRENT_USER"
    log_info "  Hostname: $HOSTNAME"
    log_info "  IP Address: $IP_ADDRESS"
    log_info "  Disk Usage (Available): $DISK_USAGE"

    # Fetch NPM Metrics
    NPM_DOWNLOADS=$(curl -s https://api.npmjs.org/downloads/point/last-month/craft-fusion | jq '.downloads // "N/A"')
    if [[ "$NPM_DOWNLOADS" == "N/A" ]]; then
        log_warning "Failed to fetch NPM metrics."
    else
        log_info "NPM Monthly Downloads: $NPM_DOWNLOADS"
    fi

    # Fetch GitHub Metrics
    GITHUB_STARS=$(curl -s https://api.github.com/repos/JeffreySanford/craft-fusion | jq '.stargazers_count // "N/A"')
    if [[ "$GITHUB_STARS" == "N/A" ]]; then
        log_warning "Failed to fetch GitHub metrics."
    else
        log_info "GitHub Stars: $GITHUB_STARS"
    fi

    # Total Metrics Duration
    report_time $START_TIME_METRICS "System and OSINT Metrics Collection"
}

# === Step 1: Fetch System and OSINT Metrics ===
step_progress
fetch_system_metrics

# === Step 2: Environment Setup ===
step_progress
echo "[STEP $CURRENT_STEP] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === Step 3: SSH Agent ===
step_progress
echo "[STEP $CURRENT_STEP] 🔑 Starting SSH Agent..."
eval "$(ssh-agent -s)"
for key in ~/.ssh/id_*; do
    [[ -f "$key" ]] && ssh-add "$key"
done

# === Step 4: Cleanup (Full or Partial) ===
step_progress
if [ "$FULL_CLEAN" = true ]; then
    START_TIME_CLEAN=$(date +%s)
    echo "[INFO] 🔄 Performing FULL CLEANUP..."
    rm -rf node_modules package-lock.json
    npm cache clean --force
    report_time $START_TIME_CLEAN "Full Cleanup"
else
    echo "[INFO] 🧹 Skipping FULL CLEANUP"
fi

npm install || log_error "Dependency installation failed."

# === Step 5: Build Frontend ===
step_progress
npx nx run craft-web:build:production || log_error "Frontend build failed."

# === Step 6: Build Backend (craft-nest) ===
step_progress
npx nx run craft-nest:build:production || log_error "Backend (craft-nest) build failed."

# === Step 7: Restart Backend with PM2 ===
step_progress
pm2 restart craft-nest || pm2 start dist/apps/craft-nest/main.js --name craft-nest

# === Step 8: Restart NGINX ===
step_progress
sudo systemctl restart nginx || log_error "Failed to restart NGINX."

# === Step 9: Finalization ===
step_progress
echo "[INFO] 🎯 Deployment Complete!"
echo "Deployment log saved to $LOG_FILE"
echo -e "\033[0;32m[SUCCESS] 🎉 Deployment completed successfully!\033[0m"
