#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Digital Ocean
# ============================================================
# This script automates the deployment of the Craft-Fusion project.
# It builds frontend (craft-web), backend (craft-nest, craft-go),
# manages services with PM2, and deploys assets to NGINX.
# ------------------------------------------------------------
# ⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ============================================================

# Constants
TOTAL_STEPS=15
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS

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
    echo -e "[INFO] ✅ $cmd_name took: \033[1;32m${duration} ms\033[0m"
    echo "$current_time [INFO] $cmd_name completed in ${duration} ms" >> "$DEPLOY_LOG"
}

function init_log() {
    if [[ "$FULL_CLEAN" == true ]]; then
        rm -f "$DEPLOY_LOG"
        echo "[INFO] 📝 Deployment log reset due to --full-clean." > "$DEPLOY_LOG"
    elif [[ ! -f "$DEPLOY_LOG" ]]; then
        touch "$DEPLOY_LOG"
        echo "[INFO] 📝 Deployment log initialized." > "$DEPLOY_LOG"
    else
        local count=$(grep -c "Deployment Started" "$DEPLOY_LOG")
        echo "[INFO] 📊 Previous deployments without --full-clean: $count"
    fi
}

function system_metrics() {
    echo "[INFO] 📊 Collecting System Metrics..."
    echo "[INFO] 🕒 Timestamp: $(date +'%Y-%m-%d %H:%M:%S %Z')" >> "$DEPLOY_LOG"
    echo "[INFO] 🖥️ CPU Usage: $(grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage "%"}')" >> "$DEPLOY_LOG"
    echo "[INFO] 💾 Memory Usage: $(free -h | grep Mem | awk '{print $3 "/" $2}')" >> "$DEPLOY_LOG"
    echo "[INFO] 📁 Disk Usage: $(df -h | grep '/$' | awk '{print $5 " used of " $2}')" >> "$DEPLOY_LOG"
    echo "[INFO] 🚀 NPM Latency: $(ping -c 1 registry.npmjs.org | grep 'time=' | awk '{print $7}' | cut -d'=' -f2) ms" >> "$DEPLOY_LOG"
}

# Step 1: Fetch System and OSINT Metrics
step_progress
echo "[STEP 1] 📊 Fetching System and OSINT Metrics..."
system_metrics

# Step 2: Environment Setup
step_progress
echo "[STEP 2] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# Step 3: SSH Agent Setup
step_progress
echo "[STEP 3] 🔑 Starting SSH Agent..."
eval "$(ssh-agent -s)"
for ssh_key in ~/.ssh/id_*; do
    if [[ -f "$ssh_key" ]]; then
        track_time ssh-add "$ssh_key"
    fi
done

# Step 4: Dependency Management
step_progress
echo "[STEP 4] 🧹 Managing Dependencies..."
if [[ "$FULL_CLEAN" == true ]]; then
    track_time rm -rf node_modules package-lock.json
    track_time npm cache clean --force
fi
track_time npm install

# Step 5: Build Frontend
step_progress
echo "[STEP 5] 🌐 Building Frontend (craft-web)..."
track_time npx nx run craft-web:build:production

# Step 6: Build Backend (craft-nest)
step_progress
echo "[STEP 6] 🛠️ Building Backend (craft-nest)..."
track_time npx nx run craft-nest:build:production

# Step 7: Build Backend (craft-go)
step_progress
echo "[STEP 7] 🛠️ Building Backend (craft-go)..."
track_time go build -o dist/apps/craft-go ./...

# Final Status
step_progress
echo "[STEP 15] 🎯 Finalizing Deployment..."
track_time pm2 status

TOTAL_DURATION=$((SECONDS - START_TIME))
echo -e "\n[SUCCESS] 🎉 Deployment completed in \033[1;32m${TOTAL_DURATION} seconds\033[0m!"
echo "============================================================"
echo "$(date +%Y-%m-%d %H:%M:%S) 🎯 Deployment Completed in ${TOTAL_DURATION} seconds" >> "$DEPLOY_LOG"
