#!/bin/bash

# =========================================
# 🚀 DigitalOcean Deployment Script
# Author: Jeffrey Sanford
# Description: Builds and deploys craft-web, craft-nest, and craft-go
# =========================================

set -e

# === 🛡️ Variables ===
REPO_PATH="/home/jeffrey/repos/craft-fusion"
FRONTEND_BUILD_PATH="$REPO_PATH/dist/apps/craft-web/browser"
NGINX_PATH="/usr/share/nginx/html"
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# === 🛡️ PATH Management ===
if [ "$EUID" -eq 0 ]; then
    echo "[INFO] 🛡️ Running as root, setting PATH explicitly..."
    export PATH="/usr/local/go/bin:/home/jeffrey/go/bin:/usr/local/bin:/usr/bin:/usr/sbin:/sbin"
else
    echo "[INFO] 🛡️ Running as non-root, using current PATH."
    export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"
fi

echo "[DEBUG] 🔍 Current PATH: $PATH"

# === 🔑 Start SSH Agent ===
echo "[INFO] 🔑 Starting SSH agent..."

# Ensure SSH key path points to the correct user home directory
SSH_KEY_PATH="/home/jeffrey/.ssh/id_ed25519"

if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "[ERROR] ❌ SSH key not found at $SSH_KEY_PATH. Ensure the key exists."
    exit 1
fi

# Start SSH Agent and add the key
eval "$(ssh-agent -s)" || {
    echo "[ERROR] ❌ Failed to start SSH agent."
    exit 1
}

ssh-add "$SSH_KEY_PATH" || {
    echo "[ERROR] ❌ Failed to add SSH key: $SSH_KEY_PATH"
    exit 1
}

echo "[INFO] ✅ SSH key successfully added."

# === 📥 Pull Latest Changes ===
echo "[INFO] 📥 Pulling latest changes from Git..."
cd "$REPO_PATH" || {
    echo "[ERROR] ❌ Failed to change directory to $REPO_PATH"
    exit 1
}
git fetch --all
git reset --hard origin/master
git pull || {
    echo "[ERROR] ❌ Failed to pull the latest changes from Git."
    exit 1
}

# === 🛠️ Clean Up and Install Dependencies ===
echo "[INFO] 🧹 Cleaning up node_modules and cache..."
rm -rf node_modules package-lock.json
npm cache clear --force

echo "[INFO] 📦 Installing dependencies..."
npm install || {
    echo "[ERROR] ❌ Failed to install dependencies."
    exit 1
}

# === 🛠️ Build Frontend (craft-web) ===
echo "[INFO] 🛠️ Building Frontend (craft-web)..."
npx nx run craft-web:build:production || {
    echo "[ERROR] ❌ Frontend (craft-web) build failed."
    exit 1
}

# === 🛠️ Build Backend (craft-nest) ===
echo "[INFO] 🛠️ Building Backend (craft-nest)..."
npx nx run craft-nest:build:production || {
    echo "[ERROR] ❌ Backend (craft-nest) build failed."
    exit 1
}

# === 🛠️ Build Backend (craft-go) ===
echo "[INFO] 🛠️ Building Backend (craft-go)..."

# Verify Go Installation
if ! command -v go &> /dev/null; then
    echo "[ERROR] ❌ Go command not found. Ensure Go is installed and in PATH."
    echo "[DEBUG] 🔍 Current PATH: $PATH"
    exit 1
else
    echo "[INFO] ✅ Go found: $(go version)"
fi

npx nx run craft-go:build || {
    echo "[ERROR] ❌ Backend (craft-go) build failed."
    exit 1
}

# === 🔄 Restart Backend Services ===
echo "[INFO] 🔄 Restarting Backend Services with PM2..."

# Restart NestJS
pm2 stop $PM2_APP_NAME_NEST || true
pm2 delete $PM2_APP_NAME_NEST || true
pm2 start dist/apps/craft-nest/main.js --name $PM2_APP_NAME_NEST || {
    echo "[ERROR] ❌ Failed to restart NestJS service with PM2."
    exit 1
}

# Restart Go Service
pm2 stop $PM2_APP_NAME_GO || true
pm2 delete $PM2_APP_NAME_GO || true
pm2 start dist/apps/craft-go/main --name $PM2_APP_NAME_GO || {
    echo "[ERROR] ❌ Failed to restart Go service with PM2."
    exit 1
}

# === 📂 Deploy Frontend to NGINX ===
echo "[INFO] 📂 Deploying Frontend to NGINX..."

sudo rm -rf $NGINX_PATH/*
sudo mv $FRONTEND_BUILD_PATH/* $NGINX_PATH/
sudo chown -R nginx:nginx $NGINX_PATH
sudo chmod -R 755 $NGINX_PATH
sudo restorecon -Rv $NGINX_PATH || {
    echo "[ERROR] ❌ Failed to restore SELinux context for NGINX directory."
    exit 1
}

# === 🔄 Restart NGINX ===
echo "[INFO] 🔄 Restarting NGINX..."
sudo systemctl restart nginx || {
    echo "[ERROR] ❌ Failed to restart NGINX."
    exit 1
}

# === ✅ Final Status ===
echo "[SUCCESS] 🎉 Deployment completed successfully!"
pm2 status

# Display Useful Information
echo "[INFO] 🌐 Frontend available at: https://jeffreysanford.us"
echo "[INFO] 🛠️ NestJS API running on: https://jeffreysanford.us/api"
echo "[INFO] 🛠️ Go Service running on: https://jeffreysanford.us/go-api"

exit 0
