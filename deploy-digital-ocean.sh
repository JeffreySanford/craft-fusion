#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Digital Ocean
# ============================================================

# Console-style Purpose and Reminder
echo -e "\033[1;34m============================================================\033[0m"
echo -e "\033[1;32m🚀 Craft-Fusion Deployment Script for Digital Ocean\033[0m"
echo -e "\033[1;34m============================================================\033[0m"
echo -e "\033[1;37mThis script automates the deployment of the Craft-Fusion project.\033[0m"
echo -e "\033[1;37mIt builds frontend (craft-web), backend (craft-nest, craft-go),\033[0m"
echo -e "\033[1;37mmanages services with PM2, and deploys assets to NGINX.\033[0m"
echo -e "\033[1;34m------------------------------------------------------------\033[0m"
echo -e "\033[0;31m⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.\033[0m"
echo -e "\033[1;34m------------------------------------------------------------\033[0m"

# Constants
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

# Function to increment steps and display progress
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

# === 1. 📊 Estimate Deployment Time and NPM Metrics ===
step_progress
echo "[STEP 1] 📊 Estimating Deployment Time and NPM Metrics..."

# Measure NPM Connection Speed and Latency
echo "[INFO] 📦 Measuring NPM Connection Metrics..."

NPM_SPEED_TEST_PACKAGE="lodash"
SPEED_START=$(date +%s%N)
npm install "$NPM_SPEED_TEST_PACKAGE" --no-save --dry-run > /dev/null 2>&1
SPEED_END=$(date +%s%N)

SPEED_DURATION=$(( (SPEED_END - SPEED_START) / 1000000 )) # ms
DOWNLOAD_SIZE_KB=200
DOWNLOAD_SPEED_MBPS=$(echo "scale=2; $DOWNLOAD_SIZE_KB / ($SPEED_DURATION / 1000)" | bc)

LATENCY_START=$(date +%s%N)
ping -c 1 registry.npmjs.org > /dev/null 2>&1
LATENCY_END=$(date +%s%N)
LATENCY_MS=$(( (LATENCY_END - LATENCY_START) / 1000000 ))

echo -e "\033[1;34m[INFO] 📊 NPM Connection Metrics:\033[0m"
echo -e "   📦 Download Speed: \033[1;32m$DOWNLOAD_SPEED_MBPS MB/s\033[0m"
echo -e "   🚀 Latency: \033[1;32m$LATENCY_MS ms\033[0m"

# === 2. 🚀 Environment Setup ===
step_progress
echo "[STEP 2] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === 3. 🔑 SSH Agent Setup ===
step_progress
echo "[STEP 3] 🔑 Starting SSH Agent..."
eval "$(ssh-agent -s)"
SSH_KEY="/home/jeffrey/.ssh/id_ed25519"

if [ -f "$SSH_KEY" ]; then
    ssh-add "$SSH_KEY" || { echo "[ERROR] ❌ Failed to add SSH key: $SSH_KEY."; exit 1; }
    echo "[INFO] ✅ SSH key added: $SSH_KEY"
else
    echo "[ERROR] ❌ SSH key not found at $SSH_KEY."
    exit 1
fi

# === 4. 🧹 Dependency Management ===
step_progress
echo "[STEP 4] 🧹 Managing Dependencies..."

if [ ! -d "node_modules" ]; then
    echo "[INFO] 🧹 Detected fresh environment (no node_modules). Performing FULL CLEANUP."
    FULL_CLEAN=true
fi

if [[ "$1" == "--full-clean" || "$FULL_CLEAN" == true ]]; then
    echo "[INFO] 🔄 Performing FULL CLEANUP: Removing node_modules, package-lock.json, and clearing npm cache..."
    CLEAN_START=$(date +%s)
    rm -rf node_modules package-lock.json
    npm cache clean --force
    CLEAN_END=$(date +%s)
    CLEAN_DURATION=$((CLEAN_END - CLEAN_START))
    echo "[INFO] ✅ Cleanup took: \033[1;32m$CLEAN_DURATION seconds\033[0m"
fi

# Install Dependencies
INSTALL_START=$(date +%s)
npm install || { echo "[ERROR] ❌ Failed to install dependencies."; exit 1; }
INSTALL_END=$(date +%s)
INSTALL_DURATION=$((INSTALL_END - INSTALL_START))
echo "[INFO] ✅ NPM Install Duration: \033[1;32m$INSTALL_DURATION seconds\033[0m"

# Update Metrics
INSTALL_SPEED=$(echo "scale=2; $DOWNLOAD_SIZE_KB / ($INSTALL_DURATION + 1)" | bc)
echo "[INFO] 📊 Final NPM Speed During Install: \033[1;32m$INSTALL_SPEED MB/s\033[0m"

# === 5. 🛠️ Build Backend (craft-go) ===
step_progress
echo "[STEP 5] 🛠️ Building Backend (craft-go)..."

GO_BUILD_START=$(date +%s)
npx nx run craft-go:build || { echo "[ERROR] ❌ Backend (craft-go) build failed."; exit 1; }
GO_BUILD_END=$(date +%s)
GO_BUILD_DURATION=$((GO_BUILD_END - GO_BUILD_START))
echo "[INFO] ✅ Go Build Duration: \033[1;32m$GO_BUILD_DURATION seconds\033[0m"

# === 6. 🔄 Restart Backend Services with PM2 ===
step_progress
echo "[STEP 6] 🔄 Restarting Backend Services with PM2..."
pm2 restart $PM2_APP_NAME_NEST || pm2 start dist/apps/craft-nest/main.js --name $PM2_APP_NAME_NEST
pm2 restart $PM2_APP_NAME_GO || pm2 start dist/apps/craft-go/main --name $PM2_APP_NAME_GO

# === 7. 📂 Deploy Frontend to NGINX ===
step_progress
echo "[STEP 7] 📂 Deploying Frontend to NGINX..."
sudo rm -rf "$NGINX_PATH"/*
sudo mv "$FRONTEND_BUILD_PATH"/* "$NGINX_PATH"/
sudo chown -R nginx:nginx "$NGINX_PATH"
sudo chmod -R 755 "$NGINX_PATH"
sudo restorecon -Rv "$NGINX_PATH"
sudo systemctl restart nginx

# === 8. 🎯 Final Status ===
step_progress
echo "[STEP 8] 🎯 Finalizing Deployment..."
pm2 status
echo -e "\n[SUCCESS] 🎉 Deployment completed successfully!"
echo -e "\033[0;32mDeployment Completed: 100% ✔\033[0m"
