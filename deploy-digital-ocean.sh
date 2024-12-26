#!/bin/bash

# ============================================================
# 🌟 🚀 Craft-Fusion Deployment Script 
# ============================================================
# 📚 **Description:**  
# This script automates deployment tasks for the Craft-Fusion project:
# - 🅰️ Builds Angular Frontend (craft-web)
# - 🛡️ Builds NestJS Backend (craft-nest)
# - 🐹 Builds Go Backend (craft-go)
# - 🔄 Manages PM2 Services
# - 📦 Installs and configures Go (if missing)
# - 📝 Logs deployment details and system stats
# - 📊 Ensures clean health checks for all services
# ------------------------------------------------------------
# ⚠️ **Flags:**
# --full       : Full deployment with clean build
# --monitor    : Start health monitoring
# --update-env : Update environment variables for PM2 processes
# ============================================================

# ============================================================
# 🎨 CONSTANTS & VARIABLES 🖌️
# ============================================================

TOTAL_STEPS=45
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS
CUMULATIVE_DURATION=0
MONITOR_INTERVAL=10

# Service Endpoints
NESTJS_URL="http://localhost:3000/api"
GO_URL="http://localhost:4000/api"

# Build Paths
NESTJS_BUILD_PATH="dist/apps/craft-nest"
GO_BUILD_PATH="dist/apps/craft-go/main"

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
# 🎯 UTILITY FUNCTIONS 🌟
# ============================================================

# 🛠️ STEP PROGRESS BAR
function step_progress() {
    ((CURRENT_STEP++))
    local percentage=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    local progress=$((CURRENT_STEP * PROGRESS_BAR_LENGTH / TOTAL_STEPS))
    local remaining=$((PROGRESS_BAR_LENGTH - progress))
    echo -ne "\033[1;34m[STEP $CURRENT_STEP/$TOTAL_STEPS] [$percentage%] \033[0;37m"
    printf "%-${PROGRESS_BAR_LENGTH}s" "$(printf '#%.0s' $(seq 1 $progress))"
    printf "%-${remaining}s" ""
    echo -e " \033[1;32m✔\033[0m"
}

# ⏱️ TRACK EXECUTION TIME
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

# 📝 LOG INFO MESSAGES
function log_info() {
    echo -e "\033[1;36m[INFO] $1\033[0m"
    sudo bash -c "echo \"$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1\" >> \"$DEPLOY_LOG\""
}

# 📊 SYSTEM STATS
function system_stats() {
    log_info "🧠 CPU Cores: $(nproc)"
    log_info "💾 Total RAM: $(free -h | grep Mem | awk '{print $2}')"
    log_info "📁 Disk Usage: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
    log_info "🕒 Server Uptime: $(uptime -p)"
}

# ============================================================
# 🐹 GO INSTALLATION 🌟
# ============================================================

function install_go() {
    log_info "🐹 Installing Go..."
    sudo dnf remove golang -y
    sudo rm -rf /usr/local/go
    sudo curl -LO https://go.dev/dl/go1.23.4.linux-amd64.tar.gz
    sudo tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    echo 'export GOPATH=$HOME/go' >> ~/.bashrc
    echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
    source ~/.bashrc
    go version
}

# ============================================================
# 📦 BUILD SERVICES 🌐
# ============================================================

function build_nestjs() {
    log_info "🛡️ Building NestJS Backend (NodeJS REST API Server)"
    track_time npx nx build craft-nest --prod
}

function build_go() {
    log_info "🐹 Building Go Backend (High-performance API Server)"
    cd apps/craft-go
    track_time go mod tidy
    track_time go build -o ../../dist/apps/craft-go/main
    cd ../..
}

# ============================================================
# 🔄 PM2 SERVICE MANAGEMENT 📊
# ============================================================

function restart_pm2_process() {
    local process_name=$1
    local process_path=$2
    log_info "🔄 Restarting PM2 Process: $process_name"
    track_time pm2 restart "$process_name" --update-env || track_time pm2 start "$process_path" --name "$process_name"
    track_time pm2 save
}

# ============================================================
# 🌐 SERVICE HEALTH CHECKS ✅
# ============================================================

function check_server_health() {
    log_info "🌐 Validating Services"
    curl -s "$NESTJS_URL" && log_info "✅ NestJS Healthy" || log_info "❌ NestJS Failed"
    curl -s "$GO_URL" && log_info "✅ Go Healthy" || log_info "❌ Go Failed"
}

# ============================================================
# 🚀 DEPLOYMENT WORKFLOW
# ============================================================

step_progress; track_time init_log
step_progress; track_time install_go
step_progress; track_time system_stats
step_progress; track_time build_nestjs
step_progress; track_time build_go
step_progress; restart_pm2_process "craft-nest" "dist/apps/craft-nest/main.js"
step_progress; restart_pm2_process "craft-go" "dist/apps/craft-go/main"
step_progress; track_time check_server_health

log_info "🎯 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
