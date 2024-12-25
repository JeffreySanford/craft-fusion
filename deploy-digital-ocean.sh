#!/bin/bash

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
eval "$(ssh-agent -s)"
if [ -f ~/.ssh/id_ed25519 ]; then
    ssh-add ~/.ssh/id_ed25519 || { echo "[ERROR] ❌ Failed to add SSH key."; exit 1; }
else
    echo "[ERROR] ❌ SSH key not found at ~/.ssh/id_ed25519."
    exit 1
fi

# === 3. 📥 Step 3: Pull Latest Changes ===
step_progress
echo "[STEP 3] 📥 Pulling Latest Changes from Git..."
git pull || { echo "[ERROR] ❌ Failed to pull latest changes."; exit 1; }

# === 4. 🛠️ Step 4: Install Dependencies ===
step_progress
echo "[STEP 4] 🛠️ Installing Dependencies..."
sudo rm -rf node_modules package-lock.json
npm cache clear --force
npm install || { echo "[ERROR] ❌ Failed to install dependencies."; exit 1; }

# === 5. 🌐 Step 5: Build Frontend (craft-web) ===
step_progress
echo "[STEP 5] 🌐 Building Frontend (craft-web)..."
npx nx run craft-web:build:production || { echo "[ERROR] ❌ Frontend build failed."; exit 1; }

# === 6. 🛠️ Step 6: Build Backend (craft-nest) ===
step_progress
echo "[STEP 6] 🛠️ Building Backend (craft-nest)..."
npx nx run craft-nest:build:production || { echo "[ERROR] ❌ Backend (craft-nest) build failed."; exit 1; }

# Verify NestJS Build
if [ ! -f "$BACKEND_NEST_PATH" ]; then
    echo "[ERROR] ❌ Backend NestJS main.js not found at $BACKEND_NEST_PATH. Build failed or incorrect path."
    exit 1
fi

# === 7. 🛠️ Step 7: Build Backend (craft-go) ===
step_progress
echo "[STEP 7] 🛠️ Building Backend (craft-go)..."
if ! command -v go &> /dev/null; then
    echo "[ERROR] ❌ Go is not installed. Exiting."
    exit 1
else
    echo "[INFO] ✅ Go found: $(go version)"
fi
npx nx run craft-go:build || { echo "[ERROR] ❌ Backend (craft-go) build failed."; exit 1; }

# Verify Go Build
if [ ! -f "$BACKEND_GO_PATH" ]; then
    echo "[ERROR] ❌ Backend Go binary not found at $BACKEND_GO_PATH. Build failed or incorrect path."
    exit 1
fi

# === 8. 🔄 Step 8: Restart Backend Services ===
step_progress
echo "[STEP 8] 🔄 Restarting Backend Services with PM2..."

# Restart NestJS Backend
if pm2 list | grep -q "$PM2_APP_NAME_NEST"; then
    pm2 stop "$PM2_APP_NAME_NEST"
    pm2 delete "$PM2_APP_NAME_NEST"
fi

pm2 start "$BACKEND_NEST_PATH" --name "$PM2_APP_NAME_NEST" || {
    echo "[ERROR] ❌ Failed to start NestJS backend service with PM2."
    exit 1
}

# Restart Go Backend
if pm2 list | grep -q "$PM2_APP_NAME_GO"; then
    pm2 stop "$PM2_APP_NAME_GO"
    pm2 delete "$PM2_APP_NAME_GO"
fi

pm2 start "$BACKEND_GO_PATH" --name "$PM2_APP_NAME_GO" || {
    echo "[ERROR] ❌ Failed to start Go backend service with PM2."
    exit 1
}

# === 9. 📂 Step 9: Deploy Frontend to NGINX ===
step_progress
echo "[STEP 9] 📂 Deploying Frontend to NGINX..."
sudo rm -rf "$NGINX_PATH"/*
sudo mv "$FRONTEND_BUILD_PATH"/* "$NGINX_PATH"/
sudo chown -R nginx:nginx "$NGINX_PATH"
sudo chmod -R 755 "$NGINX_PATH"
sudo restorecon -Rv "$NGINX_PATH" || { echo "[ERROR] ❌ Failed to restore SELinux context."; exit 1; }

sudo systemctl restart nginx || { echo "[ERROR] ❌ Failed to restart NGINX."; exit 1; }

# === 10. 🛡️ Step 10: Check Snort Service ===
step_progress
echo "[STEP 10] 🛡️ Checking Snort Service..."
if sudo systemctl is-active --quiet snort; then
    echo "[INFO] ✅ Snort service is running."
    echo "[INFO] 📄 Latest Snort Logs:"
    sudo ls -lt /var/log/snort | head -5
    sudo tail -n 20 /var/log/snort/alert || echo "[WARNING] ⚠️ Snort alert log not found."
else
    echo "[ERROR] ❌ Snort service is not running. Please investigate."
    exit 1
fi

# === 11. 🎯 Step 11: Final Status ===
step_progress
echo "[STEP 11] 🎯 Finalizing Deployment..."
pm2 status
echo -e "\n[SUCCESS] 🎉 Deployment completed successfully!"
echo -e "\033[0;32mDeployment Completed: 100% ✔\033[0m"
