#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Fedora on DigitalOcean
# ============================================================
# This script automates the deployment of the Craft-Fusion project.
# It supports frontend (craft-web), backend (craft-nest, craft-go),
# manages services with PM2, deploys assets to NGINX, ensures dependencies,
# collects system metrics, fetches OSINT insights, and detects the user's IP.
# ------------------------------------------------------------
# ⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ============================================================

# Constants
TOTAL_STEPS=18
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

    echo -e "[INFO] ✅ $cmd_name took: \033[1;32m${duration} ms\033[0m (Cumulative: \033[1;33m${CUMULATIVE_DURATION} ms\033[0m)"
    echo "$current_time [INFO] $cmd_name completed in ${duration} ms (Cumulative: ${CUMULATIVE_DURATION} ms)" >> "$DEPLOY_LOG"
}

function init_log() {
    if [[ "$FULL_CLEAN" == true ]]; then
        rm -f "$DEPLOY_LOG"
        echo "[INFO] 📝 Deployment log reset due to --full-clean." > "$DEPLOY_LOG"
    elif [[ ! -f "$DEPLOY_LOG" ]]; then
        touch "$DEPLOY_LOG"
        echo "[INFO] 📝 Deployment log initialized." > "$DEPLOY_LOG"
    fi
}

function install_dependencies() {
    echo "[INFO] 📦 Installing Fedora Dependencies..." | tee -a "$DEPLOY_LOG"
    track_time sudo dnf update -y
    track_time sudo dnf install -y \
        nodejs \
        npm \
        golang \
        nginx \
        snort \
        jq \
        curl \
        git \
        python3-pip \
        openssh-clients
}

function system_metrics() {
    echo "[INFO] 📊 Collecting System Metrics..." | tee -a "$DEPLOY_LOG"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S %Z')
    local cpu_usage=$(grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage "%"}')
    local memory_usage=$(free -h | grep Mem | awk '{print $3 "/" $2}')
    local disk_usage=$(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')
    local npm_latency=$(ping -c 1 registry.npmjs.org | grep 'time=' | awk '{print $7}' | cut -d'=' -f2)

    echo "[INFO] 🖥️ CPU Usage: $cpu_usage" | tee -a "$DEPLOY_LOG"
    echo "[INFO] 💾 Memory Usage: $memory_usage" | tee -a "$DEPLOY_LOG"
    echo "[INFO] 📁 Disk Usage: $disk_usage" | tee -a "$DEPLOY_LOG"
    echo "[INFO] 🚀 NPM Latency: $npm_latency ms" | tee -a "$DEPLOY_LOG"
}

function osint_search() {
    echo "[INFO] 🔍 Performing OSINT Search..." | tee -a "$DEPLOY_LOG"
    USER_IP=$(who am i | awk '{print $NF}' | tr -d '()')

    if [[ -z "$USER_IP" ]]; then
        echo "[ERROR] ⚠️ Could not determine the user's IP address from the SSH session." | tee -a "$DEPLOY_LOG"
        return 1
    fi

    echo "[INFO] 🌐 Detected User's IP: $USER_IP" | tee -a "$DEPLOY_LOG"
    echo "[INFO] 🛡️ Geolocation Data for User's IP:" | tee -a "$DEPLOY_LOG"
    curl -s "https://ipapi.co/$USER_IP/json/" | jq '.' | tee -a "$DEPLOY_LOG"
}

# Deployment Steps
step_progress; track_time install_dependencies
step_progress; track_time system_metrics
step_progress; track_time osint_search

step_progress; export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
step_progress; eval "$(ssh-agent -s)"; track_time ssh-add ~/.ssh/id_rsa

step_progress; 
if [[ "$FULL_CLEAN" == true ]]; then
    track_time rm -rf node_modules package-lock.json
    track_time npm cache clean --force
fi
track_time npm install --legacy-peer-deps

step_progress; track_time npx nx run craft-web:build:production
step_progress; track_time npx nx run craft-nest:build:production
step_progress; track_time go build -o dist/apps/craft-go ./...

step_progress; track_time pm2 restart "$PM2_APP_NAME_NEST"
step_progress; track_time pm2 restart "$PM2_APP_NAME_GO"
step_progress; track_time cp -r "$FRONTEND_BUILD_PATH"/* "$NGINX_PATH"
step_progress; track_time systemctl restart nginx
step_progress; track_time pm2 status

echo -e "\n[SUCCESS] 🎉 Deployment completed successfully!"
