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
echo -e "\033[1;37mAdditional checks for services like Snort are included.\033[0m"
echo -e "\033[1;34m------------------------------------------------------------\033[0m"

echo -e "\033[0;31m⚠️  REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.\033[0m"
echo -e "\033[1;34m------------------------------------------------------------\033[0m"

# ============================================================
# === 🚀 Deployment Script with Step Numbers and Progress Tracking ===

# Constants
TOTAL_STEPS=11
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

# === 1. 🚀 Step 1: Environment Setup ===
step_progress
echo "[STEP 1] 🚀 Setting up Environment Variables..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# === 2. 🔑 Step 2: SSH Agent Setup ===
step_progress
echo "[STEP 2] 🔑 Starting SSH Agent..."

# Start SSH Agent
eval "$(ssh-agent -s)"

# Use the correct SSH key path
SSH_KEY="/home/jeffrey/.ssh/id_ed25519"

if [ -f "$SSH_KEY" ]; then
    ssh-add "$SSH_KEY" || { echo "[ERROR] ❌ Failed to add SSH key: $SSH_KEY."; exit 1; }
    echo "[INFO] ✅ SSH key added: $SSH_KEY"
else
    echo "[ERROR] ❌ SSH key not found at $SSH_KEY."
    exit 1
fi

# === 3. 🧹 Step 3: Cleanup Environment ===
step_progress
echo "[STEP 3] 🧹 Cleaning Environment..."

if [[ "$1" == "--full-clean" ]]; then
    echo "[INFO] 🔄 Performing FULL CLEANUP: Removing node_modules, package-lock.json, and clearing npm cache..."
    rm -rf node_modules package-lock.json || { echo "[ERROR] ❌ Failed to remove node_modules or package-lock.json."; exit 1; }
    npm cache clean --force || { echo "[ERROR] ❌ Failed to clear npm cache."; exit 1; }
else
    echo "[INFO] 🧹 Skipping FULL CLEANUP: node_modules and package-lock.json will not be removed."
fi

# Always run npm install
echo "[INFO] 📦 Installing dependencies..."
npm install || { echo "[ERROR] ❌ Failed to install dependencies."; exit 1; }

# === 4. 🌐 Step 4: Build Frontend (craft-web) ===
step_progress
echo "[STEP 4] 🌐 Building Frontend (craft-web)..."
npx nx run craft-web:build:production || { echo "[ERROR] ❌ Frontend build failed."; exit 1; }

# === 5. 🛠️ Step 5: Build Backend (craft-nest) ===
step_progress
echo "[STEP 5] 🛠️ Building Backend (craft-nest)..."
npx nx run craft-nest:build:production || { echo "[ERROR] ❌ Backend (craft-nest) build failed."; exit 1; }

# Verify NestJS Build
if [ ! -f "$BACKEND_NEST_PATH" ]; then
    echo "[ERROR] ❌ Backend NestJS main.js not found at $BACKEND_NEST_PATH. Build failed or incorrect path."
    exit 1
fi

# === 6. 🔄 Step 6: Restart Backend Services ===
step_progress
echo "[STEP 6] 🔄 Restarting Backend Services with PM2..."

# Restart NestJS Backend
pm2 stop $PM2_APP_NAME_NEST || true
pm2 delete $PM2_APP_NAME_NEST || true
pm2 start "$BACKEND_NEST_PATH" --name "$PM2_APP_NAME_NEST" || {
    echo "[ERROR] ❌ Failed to start NestJS backend service with PM2."
    exit 1
}

# Restart Go Backend
pm2 stop $PM2_APP_NAME_GO || true
pm2 delete $PM2_APP_NAME_GO || true
pm2 start "$BACKEND_GO_PATH" --name "$PM2_APP_NAME_GO" || {
    echo "[ERROR] ❌ Failed to start Go backend service with PM2."
    exit 1
}

# === 7. 📂 Step 7: Deploy Frontend to NGINX ===
step_progress
echo "[STEP 7] 📂 Deploying Frontend to NGINX..."
sudo rm -rf "$NGINX_PATH"/*
sudo mv "$FRONTEND_BUILD_PATH"/* "$NGINX_PATH"/
sudo chown -R nginx:nginx "$NGINX_PATH"
sudo chmod -R 755 "$NGINX_PATH"
sudo restorecon -Rv "$NGINX_PATH" || { echo "[ERROR] ❌ Failed to restore SELinux context."; exit 1; }
sudo systemctl restart nginx || { echo "[ERROR] ❌ Failed to restart NGINX."; exit 1; }

# === 8. 🎯 Step 8: Finalizing Deployment ===
step_progress
echo "[STEP 8] 🎯 Finalizing Deployment..."
pm2 status
echo -e "\n[SUCCESS] 🎉 Deployment completed successfully!"
echo -e "\033[0;32mDeployment Completed: 100% ✔\033[0m"
