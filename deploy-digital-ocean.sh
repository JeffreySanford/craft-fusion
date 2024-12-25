#!/usr/bin/env bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Digital Ocean
# ============================================================
# This script automates the deployment of the Craft-Fusion project.
# It builds frontend (craft-web), backend (craft-nest, craft-go),
# manages services with PM2, and deploys assets to NGINX.
# ------------------------------------------------------------
# ⚠️ REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ------------------------------------------------------------

# === 🛠️ Configuration ===
TOTAL_STEPS=13
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_START_TIME=$(date +%s)

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

# Parse Arguments
for arg in "$@"; do
    case $arg in
        --full-clean)
            FULL_CLEAN=true
            ;;
        --help)
            echo "Usage: ./deploy-digital-ocean.sh [--full-clean]"
            echo "--full-clean : Remove node_modules, package-lock.json, and clear npm cache before deployment."
            exit 0
            ;;
    esac
done

# === 📊 Time Tracker Function ===
function track_time() {
    local START_TIME=$1
    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    echo -e "[INFO] ✅ Task completed in: \033[1;32m${DURATION} seconds\033[0m"
}

# === 🚥 Step Progress Function ===
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

# === 🚨 Display Full Clean Notice if Enabled ===
if [ "$FULL_CLEAN" = true ]; then
    echo -e "\033[1;31m⚠️  FULL CLEAN ENABLED: Performing a complete cleanup of dependencies, cache, and build artifacts.\033[0m"
fi

# === 1. 🚀 Environment Setup ===
step_progress
echo "[STEP 1] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === 2. 🔑 SSH Agent Setup ===
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

# === 3. 🧹 Cleanup Environment ===
step_progress
echo "[STEP 3] 🧹 Managing Dependencies..."
if [ "$FULL_CLEAN" = true ]; then
    echo -e "[INFO] 🔄 Performing \033[1;31mFULL CLEANUP\033[0m: Removing node_modules, package-lock.json, and clearing npm cache..."
    CLEANUP_START=$(date +%s)
    rm -rf node_modules package-lock.json || { echo "[ERROR] ❌ Failed to remove node_modules or package-lock.json."; exit 1; }
    npm cache clean --force || { echo "[ERROR] ❌ Failed to clear npm cache."; exit 1; }
    track_time $CLEANUP_START
fi

INSTALL_START=$(date +%s)
npm install || { echo "[ERROR] ❌ Failed to install dependencies."; exit 1; }
track_time $INSTALL_START

# === 4. 🌐 Build Frontend (craft-web) ===
step_progress
echo "[STEP 4] 🌐 Building Frontend (craft-web)..."
BUILD_WEB_START=$(date +%s)
npx nx run craft-web:build:production || { echo "[ERROR] ❌ Frontend build failed."; exit 1; }
track_time $BUILD_WEB_START

# === 5. 🛠️ Build Backend (craft-nest) ===
step_progress
echo "[STEP 5] 🛠️ Building Backend (craft-nest)..."
BUILD_NEST_START=$(date +%s)
npx nx run craft-nest:build:production || { echo "[ERROR] ❌ Backend (craft-nest) build failed."; exit 1; }
[ -f "$BACKEND_NEST_PATH" ] || { echo "[ERROR] ❌ NestJS main.js not found."; exit 1; }
track_time $BUILD_NEST_START

# === 6. 🛠️ Build Backend (craft-go) ===
step_progress
echo "[STEP 6] 🛠️ Building Backend (craft-go)..."
BUILD_GO_START=$(date +%s)
npx nx run craft-go:build || { echo "[ERROR] ❌ Backend (craft-go) build failed."; exit 1; }
[ -f "$BACKEND_GO_PATH" ] || { echo "[ERROR] ❌ Go main not found."; exit 1; }
track_time $BUILD_GO_START

# === 7. 🔄 Restart Services with PM2 ===
step_progress
echo "[STEP 7] 🔄 Restarting Services with PM2..."
pm2 restart "$PM2_APP_NAME_NEST" --update-env || pm2 start "$BACKEND_NEST_PATH" --name "$PM2_APP_NAME_NEST"
pm2 restart "$PM2_APP_NAME_GO" --update-env || pm2 start "$BACKEND_GO_PATH" --name "$PM2_APP_NAME_GO"

# === 8. 📂 Deploy to NGINX ===
step_progress
echo "[STEP 8] 📂 Deploying Frontend to NGINX..."
sudo rm -rf "$NGINX_PATH"/*
sudo mv "$FRONTEND_BUILD_PATH"/* "$NGINX_PATH"/
sudo chown -R nginx:nginx "$NGINX_PATH"
sudo chmod -R 755 "$NGINX_PATH"
sudo restorecon -Rv "$NGINX_PATH"
sudo systemctl restart nginx

# === 9. 🎯 Final Status ===
step_progress
echo "[STEP 9] 🎯 Finalizing Deployment..."
pm2 status
DEPLOY_END_TIME=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))
echo "[INFO] 🚀 Total Deployment Time: $DEPLOY_DURATION seconds"
echo "[INFO] 📊 CPU: $(uptime | awk -F'load average:' '{ print $2 }')"
echo "[INFO] 🧠 Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "[INFO] 💾 Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2}')"
echo "[SUCCESS] 🎉 Deployment completed successfully!"
