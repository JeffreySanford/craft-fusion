#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Fedora on DigitalOcean
# ============================================================
# 📚 **Description:**  
# Automates deployment tasks for the Craft-Fusion project:
# - Builds frontend (craft-web) and backend (craft-nest, craft-go)
# - Manages PM2 services for NestJS and Go
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
TOTAL_STEPS=36
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

# Build Paths
NESTJS_BUILD_PATH="dist/apps/craft-nest"
GO_BUILD_PATH="dist/apps/craft-go"

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
# 📦 Build Services
# ============================================================

function build_nestjs() {
    log_info "🛠️ Building NestJS Backend..."
    track_time npx nx build craft-nest --prod
    if [[ $? -eq 0 ]]; then
        log_info "✅ NestJS Build Successful!"
    else
        log_info "❌ NestJS Build Failed!"
        exit 1
    fi
}

function build_go() {
    log_info "🐹 Building Go Backend..."
    track_time go build -o "$GO_BUILD_PATH/main" ./apps/craft-go
    if [[ $? -eq 0 ]]; then
        log_info "✅ Go Build Successful!"
    else
        log_info "❌ Go Build Failed!"
        exit 1
    fi
}

# ============================================================
# 🔄 PM2 Process Management
# ============================================================

function restart_pm2_process() {
    local process_name=$1
    if ! pm2 show "$process_name" &>/dev/null; then
        log_info "❌ PM2 Process '$process_name' not found. Starting now..."
        track_time pm2 start "$process_name"
    else
        if [[ "$UPDATE_ENV" == true ]]; then
            log_info "🔄 Updating environment for '$process_name' before restart."
            track_time pm2 restart "$process_name" --update-env
        else
            track_time pm2 restart "$process_name"
        fi
    fi
}

# ============================================================
# 🌐 Health and Monitoring
# ============================================================

function check_server_health() {
    log_info "🌐 Validating Service Health..."
    curl -s "$NESTJS_URL" &>/dev/null && log_info "✅ NestJS is Healthy!" || log_info "❌ NestJS Health Check Failed!"
    curl -s "$GO_URL" &>/dev/null && log_info "✅ Go is Healthy!" || log_info "❌ Go Health Check Failed!"
}

# ============================================================
# 🚀 Workflow
# ============================================================

step_progress; track_time init_log
step_progress; track_time build_nestjs
step_progress; track_time build_go
step_progress; track_time restart_pm2_process "craft-nest"
step_progress; track_time restart_pm2_process "craft-go"
step_progress; track_time check_server_health

if [[ "$MONITOR_MODE" == true ]]; then
    log_info "📊 Starting Monitoring Loop..."
    while true; do
        check_server_health
        sleep "$MONITOR_INTERVAL"
    done
fi

log_info "🎯 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
