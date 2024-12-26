#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Fedora on DigitalOcean
# ============================================================
# Supports NX monorepo deployment: Frontend (craft-web), Backend (craft-nest, craft-go)
# Automates dependency management, SSH identity setup, OSINT analysis, system diagnostics,
# Swagger endpoint validation, and ensures reliable deployment via NGINX and PM2.
# ------------------------------------------------------------
# ⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ============================================================

# Constants
TOTAL_STEPS=24
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS
CUMULATIVE_DURATION=0

# Paths
NGINX_PATH="/usr/share/nginx/html"
FRONTEND_BUILD_PATH="dist/apps/craft-web/browser"
BACKEND_NEST_PATH="dist/apps/craft-nest/main.js"
BACKEND_GO_PATH="dist/apps/craft-go/main"
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# Flags
FULL_CLEAN=false
if [[ "$1" == "--full-clean" ]]; then
    FULL_CLEAN=true
    echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Performing a complete cleanup of dependencies, cache, and build artifacts.\033[0m"
fi

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
    if [[ "$FULL_CLEAN" == true ]]; then
        rm -f "$DEPLOY_LOG"
        log_info "📝 Deployment log reset due to --full-clean."
    elif [[ ! -f "$DEPLOY_LOG" ]]; then
        touch "$DEPLOY_LOG"
        log_info "📝 Deployment log initialized."
    fi
}

# 🕒 System & User Details
function show_start_info() {
    log_info "🕒 Deployment Started: $(date)"
    log_info "👤 Logged-in User: $(whoami)"
    log_info "🖥️ Hostname: $(hostname)"
    log_info "🔗 Server IP: $(curl -s ifconfig.me)"
    log_info "📦 Operating System: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
}

# 🖥️ Server Update Check
function check_server_status() {
    log_info "📡 Checking if the server is up to date..."
    track_time sudo dnf check-update || log_info "✅ Server packages are up to date."
}

# 🔑 SSH Key Management
function setup_ssh_identity() {
    log_info "🔑 Adding Available SSH Identities..."
    local SSH_DIR="$(sudo -u $SUDO_USER -H sh -c 'echo $HOME')/.ssh"
    eval "$(ssh-agent -s)"

    for key in "$SSH_DIR"/id_*; do
        if [[ -f "$key" ]]; then
            if grep -qi 'Jeffrey\|jeffreysanford@gmail.com' "$key"; then
                track_time ssh-add "$key"
                log_info "😄 ✅ Special Key containing 'Jeffrey' or 'jeffreysanford@gmail.com' added successfully from $key"
            else
                track_time ssh-add "$key"
                log_info "✅ SSH Key added successfully from $key"
            fi
        fi
    done
}

# 🌐 Service Checks
function check_services() {
    log_info "🌐 Checking NestJS API Status..."
    curl -s http://localhost:3000/api | jq '.'

    log_info "🌐 Checking Go API Status..."
    curl -s http://localhost:4000/api | jq '.'

    log_info "📜 Swagger Endpoints:"
    log_info "🔗 NestJS: http://localhost:3000/api/swagger"
    log_info "🔗 Go: http://localhost:4000/api/swagger"
}

# 🛠️ Detailed NX Builds
function build_nestjs() {
    log_info "🛠️ Building Backend (NestJS)..."
    track_time npx nx run craft-nest:build:production
    track_time pm2 restart "$PM2_APP_NAME_NEST"
}

function build_go() {
    log_info "🛠️ Building Backend (Go)..."
    track_time go build -o dist/apps/craft-go ./...
    track_time pm2 restart "$PM2_APP_NAME_GO"
}

# 🏁 Main Steps
step_progress; track_time init_log
step_progress; track_time show_start_info
step_progress; track_time check_server_status
step_progress; track_time setup_ssh_identity
step_progress; track_time check_services
step_progress; track_time build_nestjs
step_progress; track_time build_go

log_info "🎉 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
