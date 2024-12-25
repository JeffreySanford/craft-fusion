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

# === Global Configuration ===
TOTAL_STEPS=15
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
START_TIME=$(date +%s)
FULL_CLEAN=false
DEPLOY_LOG="deploy-digital-ocean.log"

# Paths
FRONTEND_BUILD_PATH="dist/apps/craft-web/browser"
BACKEND_NEST_PATH="dist/apps/craft-nest/main.js"
BACKEND_GO_PATH="dist/apps/craft-go/main"
NGINX_PATH="/usr/share/nginx/html"

# PM2 App Names
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# OSINT URLs
NPM_STATS_URL="https://api.npmjs.org/downloads/point/last-month/craft-fusion"
GITHUB_STATS_URL="https://api.github.com/repos/JeffreySanford/craft-fusion"

# === Utility Functions ===

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

function report_time() {
    local START=$1
    local END=$(date +%s)
    local DURATION=$((END - START))
    echo -e "[INFO] ✅ $2 took: \033[1;32m${DURATION} seconds\033[0m"
    echo "[LOG] ✅ $2 took: ${DURATION} seconds" >> "$DEPLOY_LOG"
}

function log_metric() {
    local METRIC=$1
    local VALUE=$2
    echo -e "[METRIC] 📊 $METRIC: \033[1;34m$VALUE\033[0m"
    echo "[LOG] 📊 $METRIC: $VALUE" >> "$DEPLOY_LOG"
}

function log_info() {
    local MESSAGE=$1
    echo "[LOG] $MESSAGE" >> "$DEPLOY_LOG"
}

function log_error() {
    local MESSAGE=$1
    echo -e "\033[1;31m[ERROR] ❌ $MESSAGE\033[0m"
    echo "[ERROR] ❌ $MESSAGE" >> "$DEPLOY_LOG"
}

# === LOG FILE MANAGEMENT ===

function manage_log_file() {
    if [[ "$FULL_CLEAN" == true ]]; then
        echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Deleting existing deployment log.\033[0m"
        [[ -f "$DEPLOY_LOG" ]] && rm "$DEPLOY_LOG"
        touch "$DEPLOY_LOG"
        echo "============================================================" > "$DEPLOY_LOG"
        echo "🚀 Deployment Log - $(date -u +'%Y-%m-%d %H:%M:%S GMT')" >> "$DEPLOY_LOG"
        echo "============================================================" >> "$DEPLOY_LOG"
        echo "[INFO] 🚀 Full clean deployment started." >> "$DEPLOY_LOG"
    else
        if [[ ! -f "$DEPLOY_LOG" ]]; then
            touch "$DEPLOY_LOG"
            echo "============================================================" > "$DEPLOY_LOG"
            echo "🚀 Deployment Log - $(date -u +'%Y-%m-%d %H:%M:%S GMT')" >> "$DEPLOY_LOG"
            echo "============================================================" >> "$DEPLOY_LOG"
            echo "[INFO] 🚀 First deployment log created." >> "$DEPLOY_LOG"
        fi

        # Count Incremental Deployments
        local DEPLOY_COUNT=$(grep -c "Incremental Deployment" "$DEPLOY_LOG")
        ((DEPLOY_COUNT++))
        echo "[INFO] 🚀 Incremental Deployment Run #$DEPLOY_COUNT." >> "$DEPLOY_LOG"
        echo -e "\033[1;33m⚠️  Incremental Deployment Run #$DEPLOY_COUNT.\033[0m"
    fi
}

# === OSINT FUNCTIONS ===

function fetch_system_metrics() {
    echo "[INFO] 📊 Fetching System Metrics..."
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | cut -d. -f1)
    MEMORY_TOTAL=$(free -m | grep Mem: | awk '{print $2}')
    MEMORY_USED=$(free -m | grep Mem: | awk '{print $3}')
    DISK_USAGE=$(df -h / | grep / | awk '{print $5}')
    OS=$(lsb_release -d | awk -F"\t" '{print $2}')
    KERNEL=$(uname -r)
    CURRENT_USER=$(whoami)

    log_metric "CPU Usage (%)" "${CPU_USAGE}%"
    log_metric "Memory Usage" "${MEMORY_USED}MB / ${MEMORY_TOTAL}MB"
    log_metric "Disk Usage" "$DISK_USAGE"
    log_metric "OS" "$OS"
    log_metric "Kernel Version" "$KERNEL"
    log_metric "Current User" "$CURRENT_USER"
}

# === Parse Arguments ===
if [[ "$1" == "--full-clean" ]]; then
    FULL_CLEAN=true
    echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Performing a complete cleanup of dependencies, cache, and build artifacts.\033[0m"
    log_info "FULL CLEAN ENABLED"
fi

# === STEP 1: Initialize Deployment ===
manage_log_file
step_progress
echo "[STEP 1] 📊 Fetching System and OSINT Metrics..."
fetch_system_metrics

# === STEP 2: Environment Variables ===
step_progress
echo "[STEP 2] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === STEP 3: SSH Key Management ===
step_progress
echo "[STEP 3] 🔑 Starting SSH Agent..."
eval "$(ssh-agent -s)"
for key in ~/.ssh/id_*; do
    ssh-add "$key" || echo "[WARNING] ⚠️ Failed to add key: $key"
    log_info "SSH Key added: $key"
done

# === Final Deployment Summary ===
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
echo "============================================================"
echo "🎯 Deployment Complete in $TOTAL_DURATION seconds!"
log_info "Deployment completed successfully in $TOTAL_DURATION seconds."
echo "📊 Deployment log saved to deploy-digital-ocean.log"
echo "============================================================"
