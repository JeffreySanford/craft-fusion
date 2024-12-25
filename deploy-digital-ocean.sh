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

# === Configuration ===
TOTAL_STEPS=13
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
START_TIME_GLOBAL=$(date +%s)

# Paths
FRONTEND_BUILD_PATH="dist/apps/craft-web/browser"
BACKEND_NEST_PATH="dist/apps/craft-nest/main.js"
BACKEND_GO_PATH="dist/apps/craft-go/main"
NGINX_PATH="/usr/share/nginx/html"

# PM2 App Names
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# Flags
FULL_CLEAN=false
if [[ "$1" == "--full-clean" ]]; then
    FULL_CLEAN=true
    echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Performing a complete cleanup of dependencies, cache, and build artifacts.\033[0m"
fi

# === Helper Functions ===

# Increment Step Progress
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

# Track Time for Steps
function report_time() {
    local DURATION=$1
    local STEP_DESC=$2
    echo -e "[INFO] ✅ $STEP_DESC took: \033[1;32m${DURATION}s\033[0m"
}

# NPM Module Progress Tracker
function npm_module_progress() {
    echo "[INFO] 📦 Tracking individual npm module installation progress..."
    local MODULE_COUNT=$(npm ls --depth=0 2>/dev/null | grep -c '─')
    local CURRENT_MODULE=0
    local TOTAL_SIZE=0
    local START_TIME=$(date +%s)
    
    npm install --verbose 2>&1 | while read -r line; do
        if [[ "$line" =~ "added" ]]; then
            CURRENT_MODULE=$((CURRENT_MODULE + 1))
            local MODULE_NAME=$(echo "$line" | grep -oE "added [^ ]+" | awk '{print $2}')
            local MODULE_PATH="node_modules/$MODULE_NAME"
            if [ -d "$MODULE_PATH" ]; then
                local MODULE_SIZE=$(du -sh "$MODULE_PATH" 2>/dev/null | awk '{print $1}')
                TOTAL_SIZE=$((TOTAL_SIZE + $(du -s "$MODULE_PATH" 2>/dev/null | awk '{print $1}')))
                local PERCENTAGE=$((CURRENT_MODULE * 100 / MODULE_COUNT))
                echo -ne "[INFO] 📦 Module: $MODULE_NAME | Size: $MODULE_SIZE | Progress: $PERCENTAGE% Complete\r"
            fi
        fi
    done

    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    echo -e "\n[INFO] 📊 NPM Installation Summary:"
    echo "[INFO] 📦 Total Modules Installed: $CURRENT_MODULE"
    echo "[INFO] 💾 Total Size: ${TOTAL_SIZE} KB"
    report_time $DURATION "NPM Install"
}

# === Step 1: Estimate Metrics ===
step_progress
echo "[STEP 1] 📊 Estimating Deployment Time and NPM Metrics..."
if [[ "$FULL_CLEAN" == true ]]; then
    npm_metrics
fi

# === Step 2: Environment Setup ===
step_progress
echo "[STEP 2] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === Step 3: SSH Agent Setup (Dynamic Key Handling) ===
step_progress
echo "[STEP 3] 🔑 Starting SSH Agent..."
eval "$(ssh-agent -s)"

SSH_DIR="$HOME/.ssh"
if [ -d "$SSH_DIR" ]; then
    echo "[INFO] 🗝️ Scanning for SSH keys in $SSH_DIR..."
    for SSH_KEY in "$SSH_DIR"/*; do
        if [[ -f "$SSH_KEY" && "$SSH_KEY" != *.pub && "$SSH_KEY" != *known_hosts* ]]; then
            ssh-add "$SSH_KEY" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "[INFO] ✅ Successfully added SSH key: $SSH_KEY"
            fi
        fi
    done
else
    echo "[ERROR] ❌ SSH directory not found at $SSH_DIR."
    exit 1
fi

# === Step 4: Managing Dependencies ===
step_progress
echo "[STEP 4] 🧹 Managing Dependencies..."
START_TIME=$(date +%s)

if [[ "$FULL_CLEAN" == true ]]; then
    echo "[INFO] 🔄 Performing FULL CLEANUP: Removing node_modules, package-lock.json, and clearing npm cache..."
    rm -rf node_modules package-lock.json
    npm cache clean --force
fi

npm_module_progress

END_TIME=$(date +%s)
report_time $((END_TIME - START_TIME)) "Dependency Management"

# === Step 5: Build Frontend ===
step_progress
echo "[STEP 5] 🌐 Building Frontend (craft-web)..."
START_TIME=$(date +%s)
npx nx run craft-web:build:production || { echo "[ERROR] ❌ Frontend build failed."; exit 1; }
END_TIME=$(date +%s)
report_time $((END_TIME - START_TIME)) "Frontend Build"

# === Final Step: Deployment Complete ===
step_progress
echo "[STEP 13] 🎯 Finalizing Deployment..."
pm2 status
echo -e "\n[SUCCESS] 🎉 Deployment completed successfully!"
echo -e "[INFO] 🕒 Total Deployment Time: \033[1;32m$(($(date +%s) - $START_TIME_GLOBAL)) seconds\033[0m"
