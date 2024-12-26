#!/bin/bash

# ============================================================
# 🚀 🌟 Craft-Fusion Deployment Script – Debug & Detail Edition 🛡️🐹
# ============================================================
# 📚 **Description:**  
# - 🛡️ Builds NestJS Backend (craft-nest)
# - 🐹 Builds Go Backend (craft-go)
# - 🔄 Manages PM2 services
# - 🌐 Validates health endpoints
# - 🛡️ Fixes SQLite permissions
# - 📊 Logs server environment and resource usage
# - 📝 Provides extensive logs for debugging

# ============================================================
# 🌟 CONSTANTS & VARIABLES
# ============================================================

TOTAL_STEPS=50
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS
CUMULATIVE_DURATION=0

# Paths
GO_BINARY_PATH="/home/jeffrey/repos/craft-fusion/dist/apps/craft-go/main"
NESTJS_DB_PATH="/home/jeffrey/repos/craft-fusion/apps/craft-nest/database.sqlite"

# Service Endpoints
NESTJS_URL="http://localhost:3000/api"
GO_URL="http://localhost:4000/api"

# ============================================================
# 🎯 UTILITY FUNCTIONS 🌟
# ============================================================

# 🛠️ STEP PROGRESS
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

# 📝 LOG INFO
function log_info() {
    echo -e "\033[1;36m[INFO] [$CURRENT_STEP/$TOTAL_STEPS] $1\033[0m"
    sudo bash -c "echo \"$(date '+%Y-%m-%d %H:%M:%S') [INFO] [$CURRENT_STEP/$TOTAL_STEPS] $1\" >> \"$DEPLOY_LOG\""
}

# ❌ LOG ERROR
function log_error() {
    echo -e "\033[1;31m[ERROR] [$CURRENT_STEP/$TOTAL_STEPS] $1\033[0m"
    sudo bash -c "echo \"$(date '+%Y-%m-%d %H:%M:%S') [ERROR] [$CURRENT_STEP/$TOTAL_STEPS] $1\" >> \"$DEPLOY_LOG\""
}

# ⏱️ TRACK EXECUTION TIME
function track_time() {
    local start_time=$(date +%s%3N)
    "$@"
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    CUMULATIVE_DURATION=$((CUMULATIVE_DURATION + duration))
    echo -e "\033[1;36m[INFO] ✅ $1 took: ${duration} ms (Cumulative: ${CUMULATIVE_DURATION} ms)\033[0m"
}

# 🧠 SYSTEM ENVIRONMENT
function log_environment() {
    log_info "🧠 **System Environment Variables:**"
    log_info "   - User: $USER"
    log_info "   - Shell: $SHELL"
    log_info "   - Path: $PATH"
    log_info "   - Current Directory: $(pwd)"
    log_info "   - Go Version: $(go version || echo 'Go not found')"
    log_info "   - Node Version: $(node -v || echo 'Node not found')"
    log_info "   - NPM Version: $(npm -v || echo 'NPM not found')"
}

# ============================================================
# 🐹 VERIFY & INSTALL GO
# ============================================================
function install_go() {
    log_info "🐹 Verifying Go Installation"
    if ! command -v go &> /dev/null; then
        log_info "Installing Go..."
        sudo rm -rf /usr/local/go
        sudo curl -LO https://go.dev/dl/go1.23.4.linux-amd64.tar.gz
        sudo tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz
        sudo ln -s /usr/local/go/bin/go /usr/bin/go
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        echo 'export GOPATH=$HOME/go' >> ~/.bashrc
        echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
        source ~/.bashrc
    fi
    log_info "✅ Go Version: $(go version)"
}

# ============================================================
# 🛡️ FIX SQLITE PERMISSIONS
# ============================================================
function fix_sqlite_permissions() {
    log_info "🛡️ Fixing SQLite Database Permissions..."
    sudo chmod 666 "$NESTJS_DB_PATH" 2>/dev/null || log_error "SQLite file not found"
    sudo chown -R $(whoami):$(whoami) "$(dirname "$NESTJS_DB_PATH")"
}

# ============================================================
# 🛠️ BUILD SERVICES
# ============================================================
function build_go() {
    log_info "🐹 Building Go Backend"
    sudo mkdir -p "$(dirname "$GO_BINARY_PATH")"
    sudo chown -R $(whoami):$(whoami) "$(dirname "$GO_BINARY_PATH")"
    cd apps/craft-go || log_error "Go project directory not found"
    track_time go mod tidy
    track_time go build -o "$GO_BINARY_PATH"
    cd ../..
}

# ============================================================
# 🔄 PM2 MANAGEMENT
# ============================================================
function restart_pm2_process() {
    local process_name=$1
    local process_path=$2
    log_info "🔄 Restarting PM2 Process: $process_name"
    track_time pm2 restart "$process_name" --update-env || track_time pm2 start "$process_path" --name "$process_name"
    track_time pm2 save
}

# ============================================================
# 🌐 SERVICE HEALTH CHECK
# ============================================================
function check_server_health() {
    log_info "🌐 Validating Services"
    curl -s "$NESTJS_URL" && log_info "✅ NestJS Healthy" || log_error "❌ NestJS Failed"
    curl -s "$GO_URL" && log_info "✅ Go Healthy" || log_error "❌ Go Failed"
}

# 🚀 RUN DEPLOYMENT WORKFLOW
step_progress; track_time log_environment
step_progress; track_time install_go
step_progress; track_time fix_sqlite_permissions
step_progress; track_time build_go
step_progress; restart_pm2_process "craft-go" "$GO_BINARY_PATH"
step_progress; check_server_health

log_info "🎯 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
