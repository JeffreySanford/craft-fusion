#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Fedora on DigitalOcean
# ============================================================
# Supports NX monorepo deployment: Frontend (craft-web), Backend (craft-nest, craft-go)
# Automates dependency management, SSH identity setup, OSINT analysis, system diagnostics,
# and ensures reliable deployment via NGINX and PM2.
# ------------------------------------------------------------
# ⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ============================================================

# Constants
TOTAL_STEPS=19
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

function install_dependencies() {
    log_info "📦 Installing Fedora Dependencies..."
    track_time sudo dnf update -y
    track_time sudo dnf install -y \
        nodejs \
        npm \
        golang \
        nginx \
        jq \
        curl \
        git \
        python3-pip \
        openssh-clients

    if ! command -v snort &> /dev/null; then
        log_info "🔍 Snort not detected. Installing Snort..."
        track_time sudo dnf install -y snort
    else
        log_info "✅ Snort detected and ready."
    fi
}

function system_metrics() {
    log_info "📊 Collecting System Metrics..."
    local cpu_usage=$(grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage "%"}')
    local memory_usage=$(free -h | grep Mem | awk '{print $3 "/" $2}')
    local disk_usage=$(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')

    log_info "🖥️ CPU Usage: $cpu_usage"
    log_info "💾 Memory Usage: $memory_usage"
    log_info "📁 Disk Usage: $disk_usage"
}

function osint_search() {
    log_info "🔍 Performing OSINT Search..."
    USER_IP=$(who am i | awk '{print $NF}' | tr -d '()')

    if [[ -z "$USER_IP" ]]; then
        log_info "⚠️ Could not determine the user's IP address."
        return 1
    fi

    local osint_data=$(curl -s "https://ipapi.co/$USER_IP/json/")
    local city=$(echo "$osint_data" | jq -r '.city')
    local region=$(echo "$osint_data" | jq -r '.region')
    local country=$(echo "$osint_data" | jq -r '.country_name')
    local org=$(echo "$osint_data" | jq -r '.org')

    echo -e "\033[1;34m[INFO] 🌐 Detected User's IP: $USER_IP\033[0m"
    echo -e "\033[1;34m[INFO] 📍 Location: $city, $region, $country\033[0m"
    echo -e "\033[1;34m[INFO] 🏢 Organization: $org\033[0m"

    echo "$osint_data" >> "$DEPLOY_LOG"
}

function setup_ssh_identity() {
    local SSH_KEY_PATH="$(sudo -u $SUDO_USER -H sh -c 'echo $HOME')/.ssh/id_jeffrey"

    if [[ -z "$SSH_AUTH_SOCK" ]]; then
        eval "$(ssh-agent -s)"
    fi

    if [[ -f "$SSH_KEY_PATH" ]]; then
        track_time ssh-add "$SSH_KEY_PATH"
        log_info "✅ SSH identity 'jeffrey' added successfully."
    else
        log_info "❌ SSH key not found at $SSH_KEY_PATH"
    fi
}

# Deployment Steps
step_progress; track_time install_dependencies
step_progress; track_time system_metrics
step_progress; track_time osint_search
step_progress; track_time setup_ssh_identity
step_progress; track_time npm install --legacy-peer-deps
step_progress; track_time npx nx run craft-web:build:production
step_progress; track_time pm2 status

log_info "🎉 Deployment completed successfully in $((SECONDS - START_TIME)) seconds."
