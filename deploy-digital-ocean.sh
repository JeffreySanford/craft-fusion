#!/bin/bash

# 🚀 Digital Ocean Deployment Script
# Author: Jeffrey Sanford
# Description: Complete deployment for craft-web, craft-nest, and craft-go with cache cleanup, error handling, and detailed logs.

set -e  # Exit immediately on error
set -o pipefail  # Fail pipeline if any command fails

# === 🛡️ Environment Variables ===
REPO_PATH="/home/jeffrey/repos/craft-fusion"
FRONTEND_BUILD_PATH="$REPO_PATH/dist/apps/craft-web/browser"
NGINX_PATH="/usr/share/nginx/html"
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"
NODE_ENV="production"

# Ensure required tools are installed
for cmd in git npm node pm2 go; do
  if ! command -v $cmd &> /dev/null; then
    echo "[ERROR] ❌ Required command '$cmd' is not installed. Exiting."
    exit 1
  fi
done

echo "[INFO] ✅ All required tools are installed."

# === 📥 Pull Latest Changes ===
echo "[INFO] 📥 Pulling latest changes from Git..."
cd "$REPO_PATH"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519 || {
  echo "[ERROR] ❌ Failed to add SSH key."
  exit 1
}
git fetch --all
git reset --hard origin/master || {
  echo "[ERROR] ❌ Failed to pull latest code. Check Git logs."
  exit 1
}

# === 🧹 Clean Cache and Install Dependencies ===
echo "[INFO] 🧹 Cleaning cache and installing dependencies..."
sudo rm -rf node_modules package-lock.json dist
npm cache clean --force || {
  echo "[ERROR] ❌ Failed to clean npm cache."
  exit 1
}
npm install || {
  echo "[ERROR] ❌ npm install failed."
  exit 1
}

# === 🛠️ Build Frontend ===
echo "[INFO] 🛠️ Building Frontend (craft-web)..."
npx nx run craft-web:build:production || {
  echo "[ERROR] ❌ Frontend (craft-web) build failed."
  exit 1
}

# === 🛠️ Build Backend (NestJS) ===
echo "[INFO] 🛠️ Building Backend (craft-nest)..."
npx nx run craft-nest:build:production || {
  echo "[ERROR] ❌ Backend (craft-nest) build failed."
  exit 1
}

# === 🛠️ Build Backend (Go) ===
echo "[INFO] 🛠️ Building Backend (craft-go)..."

# Ensure Go is in PATH
if [ "$EUID" -eq 0 ]; then
    echo "[INFO] 🛡️ Running as root, adjusting PATH for Go..."
    export PATH=$PATH:/usr/local/go/bin:/home/jeffrey/go/bin
else
    echo "[INFO] 🛡️ Running as non-root, using current PATH."
    export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin
fi

# Verify Go Command is Available
if ! command -v go &> /dev/null; then
    echo "[ERROR] ❌ Go command not found. Ensure Go is installed and in PATH."
    echo "[INFO] 🔄 Current PATH: $PATH"
    exit 1
else
    echo "[INFO] ✅ Go found: $(go version)"
fi

# Run Go Build
npx nx run craft-go:build || {
    echo "[ERROR] ❌ Backend (craft-go) build failed."
    exit 1
}


# Run Go Build
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

# Restart Go
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

# === 🧪 Health Check ===
echo "[INFO] 🧪 Performing Health Checks..."
if curl -s --head --request GET https://jeffreysanford.us | grep "200 OK" > /dev/null; then
  echo "[SUCCESS] ✅ Frontend is live!"
else
  echo "[ERROR] ❌ Frontend health check failed!"
  exit 1
fi

if curl -s --head --request GET http://localhost:3000/api/health | grep "200 OK" > /dev/null; then
  echo "[SUCCESS] ✅ NestJS Backend is live!"
else
  echo "[ERROR] ❌ NestJS Backend health check failed!"
  exit 1
fi

if curl -s --head --request GET http://localhost:4000/api/health | grep "200 OK" > /dev/null; then
  echo "[SUCCESS] ✅ Go Backend is live!"
else
  echo "[ERROR] ❌ Go Backend health check failed!"
  exit 1
fi

# === ✅ Final Status ===
echo "[SUCCESS] 🎉 Deployment completed successfully!"
pm2 status
