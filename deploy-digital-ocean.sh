#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Digital Ocean
# ============================================================
# This script automates the deployment of the Craft-Fusion project.
# It builds frontend (craft-web), backend (craft-nest, craft-go),
# manages services with PM2, and deploys assets to NGINX.
# ------------------------------------------------------------
# ⚠️  Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ============================================================

# === 🛠️ Configuration ===
TOTAL_STEPS=13
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50

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

# === 📝 Check for --full-clean Flag ===
if [[ "$1" == "--full-clean" ]]; then
    FULL_CLEAN=true
    echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Performing a complete cleanup of dependencies, cache, and build artifacts.\033[0m"
else
    echo -e "\033[1;33m⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.\033[0m"
fi

# === 📊 Function: Display Progress ===
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

# === 🕒 Function: Report Time Taken ===
function time_report() {
    local action="$1"
    local start_time="$2"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "[INFO] ✅ $action took: \033[1;32m$duration seconds\033[0m"
}

# === 📊 Function: Display NPM Metrics ===
function npm_metrics() {
    echo "[INFO] 📦 Measuring NPM Connection Metrics..."
    START_TIME=$(date +%s)
    npm install --dry-run > /dev/null 2>&1
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    DOWNLOAD_SPEED=$((1024 * 1024 / DURATION))
    echo "[INFO] 📊 NPM Connection Metrics:"
    echo "   📦 Estimated Download Speed: \033[1;32m${DOWNLOAD_SPEED} MB/s\033[0m"
    echo "   🕒 Estimated Time: \033[1;32m${DURATION} seconds\033[0m"
}

# === 🚀 Step 1: Environment Setup ===
step_progress
echo "[STEP 1] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === 🔑 Step 2: SSH Agent Setup ===
step_progress
echo "[STEP 2] 🔑 Starting SSH Agent..."
eval "$(ssh-agent -s)"
SSH_KEY="/home/jeffrey/.ssh/id_ed25519"
if [ -f "$SSH_KEY" ]; then
    ssh-add "$SSH_KEY" || { echo "[ERROR] ❌ Failed to add SSH key: $SSH_KEY."; exit 1; }
    echo "[INFO] ✅ SSH key added: $SSH_KEY"
else
    echo "[ERROR] ❌ SSH key not found at $SSH_KEY."
    exit 1
fi

# === 🧹 Step 3: Cleanup Environment ===
step_progress
echo "[STEP 3] 🧹 Managing Dependencies..."
CLEAN_START=$(date +%s)
if [ "$FULL_CLEAN" = true ]; then
    echo -e "[INFO] 🧹 Performing \033[1;31mFULL CLEANUP\033[0m: Removing node_modules, package-lock.json, and clearing npm cache..."
    NODE_MODULES_CLEAN_START=$(date +%s)
    rm -rf node_modules package-lock.json || { echo "[ERROR] ❌ Failed to remove node_modules or package-lock.json."; exit 1; }
    NODE_MODULES_CLEAN_END=$(date +%s)
    NODE_MODULES_DURATION=$((NODE_MODULES_CLEAN_END - NODE_MODULES_CLEAN_START))
    echo -e "[INFO] ✅ node_modules cleanup took: \033[1;32m${NODE_MODULES_DURATION} seconds\033[0m"
    npm cache clean --force || { echo "[ERROR] ❌ Failed to clear npm cache."; exit 1; }
else
    echo "[INFO] 🧹 Skipping FULL CLEANUP: node_modules and cache will not be removed."
fi
npm install || { echo "[ERROR] ❌ Failed to install dependencies."; exit 1; }
time_report "Dependency Management" $CLEAN_START

# === 🌐 Step 4: Build Frontend (craft-web) ===
step_progress
echo "[STEP 4] 🌐 Building Frontend (craft-web)..."
BUILD_START=$(date +%s)
npx nx run craft-web:build:production || { echo "[ERROR] ❌ Frontend build failed."; exit 1; }
time_report "Frontend Build" $BUILD_START

# === 🛠️ Step 5: Build Backend (craft-nest) ===
step_progress
echo "[STEP 5] 🛠️ Building Backend (craft-nest)..."
BUILD_START=$(date +%s)
npx nx run craft-nest:build:production || { echo "[ERROR] ❌ Backend (craft-nest) build failed."; exit 1; }
time_report "Backend NestJS Build" $BUILD_START

# Validate Build Output
if [ ! -f "$BACKEND_NEST_PATH" ]; then
    echo "[ERROR] ❌ Backend NestJS main.js not found at $BACKEND_NEST_PATH."
    exit 1
fi

# === 🛠️ Step 6: Build Backend (craft-go) ===
step_progress
echo "[STEP 6] 🛠️ Building Backend (craft-go)..."
BUILD_START=$(date +%s)
npx nx run craft-go:build || { echo "[ERROR] ❌ Backend (craft-go) build failed."; exit 1; }
time_report "Backend Go Build" $BUILD_START

# === 📂 Step 7: Deploy Frontend to NGINX ===
step_progress
echo "[STEP 7] 📂 Deploying Frontend to NGINX..."
sudo rm -rf "$NGINX_PATH"/*
sudo mv "$FRONTEND_BUILD_PATH"/* "$NGINX_PATH"/
sudo chown -R nginx:nginx "$NGINX_PATH"
sudo chmod -R 755 "$NGINX_PATH"
sudo restorecon -Rv "$NGINX_PATH"
sudo systemctl restart nginx

# === 🎯 Step 8: Final Status ===
step_progress
echo "[STEP 8] 🎯 Finalizing Deployment..."
pm2 status
echo -e "[SUCCESS] 🎉 Deployment completed successfully!"
echo -e "\033[0;32mDeployment Completed: 100% ✔\033[0m"
