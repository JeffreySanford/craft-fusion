#!/bin/bash

# Deployment Script for Digital Ocean with Cache Cleanup, Logging, and Error Handling

set -e

# Helper function for error logging
handle_error() {
  echo "[ERROR] ❌ $1"
  exit 1
}

# Step 1: Environment Setup
echo "[INFO] 🚀 Starting Deployment Process..."
export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin

# Verify Go Command
if ! command -v go &> /dev/null; then
  handle_error "Go command not found. Ensure Go is installed and in PATH."
else
  echo "[INFO] ✅ Go found: $(go version)"
fi

# Step 2: Pull Latest Changes
echo "[INFO] 📥 Pulling latest changes from Git..."
if ! git pull; then
  handle_error "Failed to pull latest changes from Git."
fi

# Step 3: Cleanup Node Modules and Cache
echo "[INFO] 🧹 Cleaning up node_modules and npm cache..."
rm -rf node_modules package-lock.json || handle_error "Failed to remove node_modules or package-lock.json"
npm cache clean --force || handle_error "Failed to clear npm cache"
npm install || handle_error "Failed to install npm dependencies"

# Step 4: Build Frontend (craft-web)
echo "[INFO] 🛠️ Building Frontend (craft-web)..."
if ! npx nx run craft-web:build:production; then
  handle_error "Frontend (craft-web) build failed."
else
  echo "[INFO] ✅ Frontend (craft-web) build completed successfully."
fi

# Step 5: Build Backend (craft-nest)
echo "[INFO] 🛠️ Building Backend (craft-nest)..."
if ! npx nx run craft-nest:build:production; then
  handle_error "Backend (craft-nest) build failed."
else
  echo "[INFO] ✅ Backend (craft-nest) build completed successfully."
fi

# Step 6: Build Backend (craft-go)
echo "[INFO] 🛠️ Building Backend (craft-go)..."
if ! npx nx run craft-go:build; then
  handle_error "Backend (craft-go) build failed."
else
  echo "[INFO] ✅ Backend (craft-go) build completed successfully."
fi

# Step 7: Restart PM2 Services
echo "[INFO] 🔄 Restarting PM2 services..."
if ! pm2 restart all; then
  handle_error "Failed to restart PM2 services."
else
  echo "[INFO] ✅ PM2 services restarted successfully."
fi

# Step 8: Final Deployment Step
echo "[INFO] 🚚 Moving Frontend Build to Nginx Root..."
rm -rf /usr/share/nginx/html/* || handle_error "Failed to clear existing Nginx HTML directory"
mv dist/apps/craft-web/browser/* /usr/share/nginx/html/ || handle_error "Failed to move frontend files"
chown -R nginx:nginx /usr/share/nginx/html || handle_error "Failed to set ownership for Nginx HTML directory"
chmod -R 755 /usr/share/nginx/html || handle_error "Failed to set permissions for Nginx HTML directory"
restorecon -Rv /usr/share/nginx/html || handle_error "Failed to restore SELinux context for Nginx HTML directory"

# Step 9: Verify Services
echo "[INFO] ✅ Deployment Completed Successfully!"
echo "[INFO] 🌐 Access the application at: https://jeffreysanford.us"
