#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Fedora on DigitalOcean
# ============================================================
# Supports NX monorepo deployment: Frontend (craft-web), Backend (craft-nest, craft-go)
# Automates dependency management, SSH identity setup, OSINT analysis, system diagnostics,
# health monitoring, log collection, and ensures reliable deployment via NGINX and PM2.
# ------------------------------------------------------------
# ⚠️  REMINDER: Use '--full' for a fresh deployment.
# ⚠️  Use '--monitor' for continuous monitoring.
# ============================================================

# Constants
TOTAL_STEPS=26
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS
CUMULATIVE_DURATION=0
NESTJS_URL="http://localhost:3000/api"
GO_URL="http://localhost:4000/api"
NESTJS_SWAGGER="http://localhost:3000/api/swagger"
GO_SWAGGER="http://localhost:4000/api/swagger"
MONITOR_INTERVAL=10  # Interval in seconds for monitoring loop

# Paths
NGINX_ACCESS_LOG="/var/log/nginx/access.log"
NGINX_ERROR_LOG="/var/log/nginx/error.log"
PM2_LOG_NEST="~/.pm2/logs/craft-nest-out.log"
PM2_LOG_GO="~/.pm2/logs/craft-go-out.log"

# Flags
FULL_DEPLOY=false
MONITOR_MODE=false

for arg in "$@"; do
    case $arg in
        --full)
            FULL_DEPLOY=true
            ;;
        --monitor)
            MONITOR_MODE=true
            ;;
    esac
done

# Utility Functions
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

function log_info() {
    echo -e "\033[1;34m[INFO] $1\033[0m"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$DEPLOY_LOG"
}

function init_log() {
    if [[ "$FULL_DEPLOY" == true ]]; then
        rm -f "$DEPLOY_LOG"
        log_info "📝 Deployment log reset due to --full deployment."
    elif [[ ! -f "$DEPLOY_LOG" ]]; then
        touch "$DEPLOY_LOG"
        log_info "📝 Deployment log initialized."
    fi
}

# 🛡️ Server Health Check
function check_server_health() {
    log_info "🌐 Checking Server Health..."

    local nest_status=$(curl -s -o /dev/null -w "%{http_code}" $NESTJS_URL)
    if [[ "$nest_status" -eq 200 ]]; then
        log_info "✅ NestJS Server is UP. Status Code: $nest_status"
        log_info "🔗 Swagger: $NESTJS_SWAGGER"
    else
        log_info "❌ NestJS Server DOWN. Restarting..."
        track_time pm2 restart "$PM2_APP_NAME_NEST"
    fi

    local go_status=$(curl -s -o /dev/null -w "%{http_code}" $GO_URL)
    if [[ "$go_status" -eq 200 ]]; then
        log_info "✅ Go Server is UP. Status Code: $go_status"
        log_info "🔗 Swagger: $GO_SWAGGER"
    else
        log_info "❌ Go Server DOWN. Restarting..."
        track_time pm2 restart "$PM2_APP_NAME_GO"
    fi
}

# 📊 Server Monitoring Loop
function monitor_servers() {
    log_info "📊 Starting Monitoring Loop (Ctrl+C to exit)..."
    while true; do
        check_server_health
        sleep "$MONITOR_INTERVAL"
    done
}

# 📄 Collect Logs
function collect_logs() {
    log_info "📄 Collecting Logs for All Systems..."

    log_info "📝 Tail NGINX Access Logs:"
    sudo tail -n 20 "$NGINX_ACCESS_LOG" | tee -a "$DEPLOY_LOG"

    log_info "📝 Tail NGINX Error Logs:"
    sudo tail -n 20 "$NGINX_ERROR_LOG" | tee -a "$DEPLOY_LOG"

    log_info "📝 Tail NestJS PM2 Logs:"
    tail -n 20 "$PM2_LOG_NEST" | tee -a "$DEPLOY_LOG"

    log_info "📝 Tail Go PM2 Logs:"
    tail -n 20 "$PM2_LOG_GO" | tee -a "$DEPLOY_LOG"
}

# 🚀 Main Steps
step_progress; track_time init_log
step_progress; log_info "🕒 Deployment Started: $(date)"
step_progress; track_time check_server_health
step_progress; track_time collect_logs

if [[ "$FULL_DEPLOY" == true ]]; then
    step_progress; track_time build_nestjs
    step_progress; track_time build_go
fi

if [[ "$MONITOR_MODE" == true ]]; then
    monitor_servers
fi

log_info "🎉 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
