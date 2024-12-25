#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Digital Ocean
# ============================================================
# This script automates the deployment of the Craft-Fusion project.
# It builds frontend (craft-web), backend (craft-nest, craft-go),
# manages services with PM2, and deploys assets to NGINX.
# ------------------------------------------------------------
# ⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ------------------------------------------------------------

# === GLOBAL VARIABLES ===
TOTAL_STEPS=15
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
FULL_CLEAN=false

# Paths
FRONTEND_BUILD_PATH="dist/apps/craft-web/browser"
BACKEND_NEST_PATH="dist/apps/craft-nest/main.js"
BACKEND_GO_PATH="dist/apps/craft-go/main"
NGINX_PATH="/usr/share/nginx/html"

# PM2 App Names
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# Fetch Current User (even under sudo)
CURRENT_USER=${SUDO_USER:-$USER}

# === FUNCTIONS ===

# Step Progress Bar
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

# Logging Information
function log_info() {
    local message="$1"
    echo "[INFO] $message"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) [INFO] $message" >> "$DEPLOY_LOG"
}

# Time Tracking
function track_time() {
    local start_time=$SECONDS
    "$@"
    local duration=$((SECONDS - start_time))
    echo "[INFO] ✅ $1 took: \033[1;32m${duration} seconds\033[0m"
    echo "$(date +%Y-%m-%d\ %H:%M:%S) [INFO] $1 completed in ${duration} seconds" >> "$DEPLOY_LOG"
}

# OSINT Metrics Collection
function fetch_osint_metrics() {
    echo "[INFO] 🧑 User: $CURRENT_USER"
    echo "[INFO] 🖥️ System: $(uname -a)"
    echo "[INFO] 📅 Date: $(date)"
    echo "[INFO] 🕒 Uptime: $(uptime -p)"
    echo "[INFO] 🧠 Memory Usage:"
    free -h | grep Mem
    echo "[INFO] 📂 Disk Space:"
    df -h | grep '/$'
    echo "[INFO] 🌐 IP Address: $(curl -s ifconfig.me)"
    log_info "OSINT Metrics Collected"
}

# Check or Create Deployment Log
function initialize_log() {
    if [[ "$FULL_CLEAN" = true ]]; then
        echo "[INFO] 🔄 Performing Full Clean - Deleting Deployment Log..."
        rm -f "$DEPLOY_LOG"
        echo "Deployment Log Created: $(date)" > "$DEPLOY_LOG"
    else
        if [[ ! -f "$DEPLOY_LOG" ]]; then
            echo "Deployment Log Created: $(date)" > "$DEPLOY_LOG"
        fi
    fi
}

# === ARGUMENT PARSING ===
if [[ "$1" == "--full-clean" ]]; then
    FULL_CLEAN=true
    echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Performing a complete cleanup of dependencies, cache, and build artifacts.\033[0m"
fi

# === SCRIPT START ===
clear
echo "============================================================"
echo "🚀 Craft-Fusion Deployment Script for Digital Ocean"
echo "============================================================"
echo "This script automates the deployment of the Craft-Fusion project."
echo "It builds frontend (craft-web), backend (craft-nest, craft-go),"
echo "manages services with PM2, and deploys assets to NGINX."
echo "------------------------------------------------------------"
echo -e "\033[1;31m⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.\033[0m"
echo "------------------------------------------------------------"

initialize_log

# === STEP 1: Fetch System Metrics ===
step_progress
echo "[STEP 1] 📊 Fetching System and OSINT Metrics..."
fetch_osint_metrics

# === STEP 2: Environment Setup ===
step_progress
echo "[STEP 2] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === STEP 3: SSH Key Management ===
step_progress
echo "[STEP 3] 🔑 Starting SSH Agent..."
eval "$(ssh-agent -s)"
SSH_KEYS=($HOME/.ssh/id_*)
for KEY in "${SSH_KEYS[@]}"; do
    if [[ -f "$KEY" ]]; then
        ssh-add "$KEY"
        log_info "Added SSH key: $KEY"
    else
        echo "[WARNING] ⚠️ No valid SSH keys found in $HOME/.ssh"
    fi
done

# === STEP 4: Dependency Management ===
step_progress
echo "[STEP 4] 🧹 Managing Dependencies..."
if [[ "$FULL_CLEAN" = true ]]; then
    track_time rm -rf node_modules package-lock.json
    track_time npm cache clean --force
fi
track_time npm install

# === STEP 5: Build Frontend (craft-web) ===
step_progress
echo "[STEP 5] 🌐 Building Frontend (craft-web)..."
track_time npx nx run craft-web:build:production

# === STEP 6: Build Backend (craft-nest) ===
step_progress
echo "[STEP 6] 🛠️ Building Backend (craft-nest)..."
track_time npx nx run craft-nest:build:production

# === STEP 7: Build Backend (craft-go) ===
step_progress
echo "[STEP 7] 🛠️ Building Backend (craft-go)..."
track_time go build -o dist/apps/craft-go ./...

# === STEP 8: Restart Services with PM2 ===
step_progress
echo "[STEP 8] 🔄 Restarting Backend Services with PM2..."
pm2 restart $PM2_APP_NAME_NEST || pm2 start dist/apps/craft-nest/main.js --name $PM2_APP_NAME_NEST
pm2 restart $PM2_APP_NAME_GO || pm2 start dist/apps/craft-go/main --name $PM2_APP_NAME_GO

# === STEP 9: Deploy Frontend to NGINX ===
step_progress
echo "[STEP 9] 📂 Deploying Frontend to NGINX..."
sudo rm -rf "$NGINX_PATH"/*
sudo mv "$FRONTEND_BUILD_PATH"/* "$NGINX_PATH"/
sudo chown -R nginx:nginx "$NGINX_PATH"
sudo chmod -R 755 "$NGINX_PATH"

# === STEP 10: Final Deployment Status ===
step_progress
echo "[STEP 10] 🎯 Finalizing Deployment..."
pm2 status
log_info "Deployment Completed Successfully"

# === Deployment Complete ===
echo "============================================================"
echo -e "🎯 Deployment Complete in \033[1;32m$(($SECONDS)) seconds!\033[0m"
echo "📊 Deployment log saved to $DEPLOY_LOG"
echo "============================================================"
