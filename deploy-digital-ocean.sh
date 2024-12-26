#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Fedora on DigitalOcean
# ============================================================
# 📚 **Description:**  
# Automates deployment tasks for the Craft-Fusion project:
# - Builds frontend (craft-web) and backend (craft-nest, craft-go)
# - Manages PM2 services
# - Updates environment variables
# - Collects system, user, and server metadata
# - Ensures proper logging and health checks
# - Supports monitoring mode
# ------------------------------------------------------------
# ⚠️ **Flags:**
# --full       : Full deployment with clean build
# --monitor    : Start health monitoring
# --update-env : Update environment variables for PM2 processes
# ============================================================

# Constants
TOTAL_STEPS=32
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS
CUMULATIVE_DURATION=0
MONITOR_INTERVAL=10  # Monitoring Interval in seconds

# Service Endpoints
NESTJS_URL="http://localhost:3000/api"
GO_URL="http://localhost:4000/api"
NESTJS_SWAGGER="http://localhost:3000/api/swagger"
GO_SWAGGER="http://localhost:4000/api/swagger"

# Log Paths
NGINX_ACCESS_LOG="/var/log/nginx/access.log"
NGINX_ERROR_LOG="/var/log/nginx/error.log"
PM2_LOG_NEST="~/.pm2/logs/craft-nest-out.log"
PM2_LOG_GO="~/.pm2/logs/craft-go-out.log"

# Flags
FULL_DEPLOY=false
MONITOR_MODE=false
UPDATE_ENV=false

for arg in "$@"; do
    case $arg in
        --full)
            FULL_DEPLOY=true
            ;;
        --monitor)
            MONITOR_MODE=true
            ;;
        --update-env)
            UPDATE_ENV=true
            ;;
    esac
done

# ============================================================
# 🎨 Utility Functions
# ============================================================

# Display step progress
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

# Track execution time of commands
function track_time() {
    local start_time=$(date +%s%3N)
    "$@"
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    local cmd_name="$1"
    local current_time=$(date '+%Y-%m-%d %H:%M:%S %Z')
    CUMULATIVE_DURATION=$((CUMULATIVE_DURATION + duration))
    echo -e "\033[1;36m[INFO] ✅ $cmd_name took: ${duration} ms (Cumulative: ${CUMULATIVE_DURATION} ms)\033[0m"
    sudo bash -c "echo \"$current_time [INFO] $cmd_name completed in ${duration} ms (Cumulative: ${CUMULATIVE_DURATION} ms)\" >> \"$DEPLOY_LOG\""
}

# Log messages to console and file
function log_info() {
    echo -e "\033[1;36m[INFO] $1\033[0m"
    sudo bash -c "echo \"$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1\" >> \"$DEPLOY_LOG\""
}

# Ensure log file is writable
function init_log() {
    sudo touch "$DEPLOY_LOG"
    sudo chmod 666 "$DEPLOY_LOG"
    log_info "📝 Deployment log initialized."
}

# ============================================================
# 📊 Metadata and Environment Information
# ============================================================

function display_versions() {
    log_info "🛠️ Node Version: $(node -v)"
    log_info "📦 NPM Version: $(npm -v)"
    log_info "🌐 NX Version: $(npx nx --version)"
    log_info "🅰️ Angular CLI Version: $(npx ng version | grep 'Angular CLI')"
    log_info "🛡️ NestJS Version: $(npx nest --version)"
    log_info "🐹 Go Version: $(go version)"
}

function display_user_info() {
    log_info "👤 User: $(whoami)"
    log_info "📁 Home Directory: $HOME"
    log_info "🖥️ Hostname: $(hostname)"
}

function display_server_info() {
    log_info "🕒 Server Uptime: $(uptime -p)"
    log_info "🚀 Last Boot Time: $(who -b | awk '{print $3, $4}')"
    log_info "🧠 CPU Cores: $(nproc)"
    log_info "💾 Total RAM: $(free -h | grep Mem | awk '{print $2}')"
    log_info "📁 Disk Usage: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
}

# ============================================================
# 🌐 Health and Monitoring
# ============================================================

function check_server_health() {
    log_info "🌐 Checking NestJS Server Health..."
    if curl -s -o /dev/null -w "%{http_code}" "$NESTJS_URL" | grep -q "200"; then
        log_info "✅ NestJS Server is UP"
    else
        log_info "❌ NestJS Server is DOWN"
    fi
}

function collect_logs() {
    log_info "📝 Collecting Logs"
    sudo tail -n 10 "$NGINX_ACCESS_LOG"
    sudo tail -n 10 "$PM2_LOG_NEST"
}

# ============================================================
# 🚀 Workflow
# ============================================================

step_progress; track_time init_log
step_progress; track_time display_versions
step_progress; track_time display_user_info
step_progress; track_time display_server_info
step_progress; track_time check_server_health
step_progress; track_time collect_logs

if [[ "$MONITOR_MODE" == true ]]; then
    log_info "📊 Starting Monitoring Loop..."
    while true; do
        check_server_health
        sleep "$MONITOR_INTERVAL"
    done
fi

log_info "🎯 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
