#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Fedora on DigitalOcean
# ============================================================
# Supports NX monorepo deployment: Frontend (craft-web), Backend (craft-nest, craft-go)
# Automates:
# - Dependency management
# - SSH identity setup
# - OSINT analysis
# - System diagnostics
# - Health monitoring
# - Log collection
# - Server uptime tracking
# - VPS hardware and provider details
# ------------------------------------------------------------
# ⚠️ Flags:
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
# 🛠️ Utility Functions
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

    echo -e "\033[1;34m[INFO] ✅ $cmd_name took: ${duration} ms (Cumulative: ${CUMULATIVE_DURATION} ms)\033[0m"
    echo "$current_time [INFO] $cmd_name completed in ${duration} ms (Cumulative: ${CUMULATIVE_DURATION} ms)" >> "$DEPLOY_LOG"
}

# Log messages to console and file
function log_info() {
    echo -e "\033[1;34m[INFO] $1\033[0m"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$DEPLOY_LOG"
}

# ============================================================
# 🛡️ Server Information & Uptime
# ============================================================

# 🕒 Server Uptime
function server_uptime() {
    log_info "🕒 Fetching Server Uptime..."
    local uptime=$(uptime -p)
    local boot_time=$(who -b | awk '{print $3, $4}')
    log_info "🕒 Server Uptime: $uptime"
    log_info "🚀 Last Boot Time: $boot_time"
}

# 🛠️ VPS Hardware & Provider Information
function vps_information() {
    log_info "🌐 Gathering VPS Information..."

    # General System Information
    local os=$(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)
    local cpu_count=$(nproc)
    local total_ram=$(free -h | grep Mem | awk '{print $2}')
    local disk_usage=$(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')

    log_info "⚙️ OS: $os"
    log_info "🧠 CPU Cores: $cpu_count"
    log_info "💾 Total RAM: $total_ram"
    log_info "📁 Disk Usage: $disk_usage"

    # VPS Provider Info (If DigitalOcean Metadata Exists)
    if [[ -f /sys/class/dmi/id/product_name ]]; then
        local product_name=$(cat /sys/class/dmi/id/product_name)
        local product_vendor=$(cat /sys/class/dmi/id/sys_vendor)
        log_info "🏢 Provider: $product_vendor"
        log_info "💻 Product: $product_name"
    else
        log_info "🏢 Provider Information: Not Available"
    fi
}

# ============================================================
# 🚀 Deployment Workflow
# ============================================================

step_progress; track_time init_log
step_progress; track_time log_info "🕒 Deployment Started: $(date)"
step_progress; track_time server_uptime
step_progress; track_time vps_information
step_progress; track_time restart_pm2_process "craft-nest"
step_progress; track_time restart_pm2_process "craft-go"
step_progress; track_time check_server_health
step_progress; track_time collect_logs

# 📊 Monitor Servers
if [[ "$MONITOR_MODE" == true ]]; then
    log_info "📊 Starting Monitoring Loop..."
    while true; do
        check_server_health
        sleep "$MONITOR_INTERVAL"
    done
fi

log_info "🎉 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
