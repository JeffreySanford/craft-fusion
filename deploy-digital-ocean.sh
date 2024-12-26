#!/bin/bash

# ============================================================
# 🚀 Craft-Fusion Deployment Script for Digital Ocean
# ============================================================
# This script automates the deployment of the Craft-Fusion project.
# It builds frontend (craft-web), backend (craft-nest, craft-go),
# manages services with PM2, and deploys assets to NGINX.
# ------------------------------------------------------------
# ⚠️ REMINDER: Use '--full-clean' for a fresh deployment with cleaned dependencies.
# ⚠️ Use '--update-env' to refresh environment variables.
# ⚠️ Use '--monitor' to enter monitoring mode after deployment.
# ============================================================

# Constants
TOTAL_STEPS=60
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS
NGINX_PATH="/usr/share/nginx/html"
FRONTEND_BUILD_PATH="dist/apps/craft-web/browser"
BACKEND_NEST_PATH="dist/apps/craft-nest/main.js"
BACKEND_GO_PATH="dist/apps/craft-go/main"
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# Flags
FULL_CLEAN=false
UPDATE_ENV=false
MONITOR=false

# Parse Flags
for arg in "$@"; do
    case $arg in
        --full-clean)
            FULL_CLEAN=true
            ;;
        --update-env)
            UPDATE_ENV=true
            ;;
        --monitor)
            MONITOR=true
            ;;
    esac
    shift
done

# 🛡️ Ensure the script is run with sudo privileges
if [[ $EUID -ne 0 ]]; then
    echo -e "\033[1;31m[ERROR]\033[0m This script must be run as root or with sudo privileges."
    echo "Please run the script with 'sudo $0' or switch to the root user."
    exit 1
fi

# Utility Functions
function step_progress() {
    ((CURRENT_STEP++))
    local percentage=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    local progress=$((CURRENT_STEP * PROGRESS_BAR_LENGTH / TOTAL_STEPS))
    local remaining=$((PROGRESS_BAR_LENGTH - progress))
    echo -ne "\033[0;36m[STEP $CURRENT_STEP/$TOTAL_STEPS] [$percentage%] \033[0;37m"
    printf "%-${PROGRESS_BAR_LENGTH}s" "$(printf '#%.0s' $(seq 1 $progress))"
    printf "%-${remaining}s" ""
    echo -e " \033[0;36m✔\033[0m"
}

function log_info() {
    echo -e "\033[1;36m[INFO]\033[0m $1"
    echo "[INFO] $1" >> "$DEPLOY_LOG"
}

function log_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
    echo "[ERROR] $1" >> "$DEPLOY_LOG"
}

function track_time() {
    local start_time=$(date +%s%3N)
    "$@"
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    echo -e "[INFO] ✅ $1 took: \033[1;32m${duration} ms\033[0m"
    echo "[INFO] $1 completed in ${duration} ms" >> "$DEPLOY_LOG"
}

# Step 1: Log Environment Details
step_progress
log_info "🧠 **System Environment Variables:**"
log_info "- User: $USER"
log_info "- Shell: $SHELL"
log_info "- Path: $PATH"
log_info "- Current Directory: $PWD"
log_info "- Go Version: $(go version 2>/dev/null || echo 'Not Installed')"
log_info "- Node Version: $(node -v 2>/dev/null || echo 'Not Installed')"
log_info "- NPM Version: $(npm -v 2>/dev/null || echo 'Not Installed')"

# Step 2: Fix SQLite Permissions
step_progress
log_info "🛡️ Fixing SQLite Database Permissions..."
if [[ ! -f "/home/jeffrey/repos/craft-fusion/apps/craft-nest/database.sqlite" ]]; then
    log_info "SQLite file not found. Creating a new one..."
    touch "/home/jeffrey/repos/craft-fusion/apps/craft-nest/database.sqlite"
fi
chmod 664 "/home/jeffrey/repos/craft-fusion/apps/craft-nest/database.sqlite"
chown jeffrey:jeffrey "/home/jeffrey/repos/craft-fusion/apps/craft-nest/database.sqlite"
log_info "✅ SQLite database permissions fixed."

# Step 3: Build Angular Frontend
step_progress
log_info "🌐 Building Angular Frontend (Craft-Web)"
if ! npx nx run craft-web:build:production; then
    log_error "Angular build failed. Attempting dependency reinstall..."
    rm -rf node_modules
    npm install
    npx nx run craft-web:build:production || log_error "Angular build failed again."
fi
cp -r "$FRONTEND_BUILD_PATH/" "$NGINX_PATH/"
systemctl restart nginx
# Confirm Nginx restart
if systemctl is-active --quiet nginx; then
    log_info "✅ Nginx restarted successfully."
else
    log_error "Nginx restart failed."
fi
log_info "✅ Angular build deployed to $NGINX_PATH"

# Step 4: Build NestJS Backend
step_progress
log_info "🛡️ Building NestJS Backend (REST API Server)"
if ! npx nx run craft-nest:build:production; then
    log_error "NestJS build failed."
fi

# Step 5: Build Go Backend
step_progress
log_info "🐹 Building Go Backend (High-Performance API Server)"
if ! go mod tidy; then
    log_error "Go mod tidy failed."
    exit 1
fi
if ! go build -o "../../$BACKEND_GO_PATH"; then
    log_error "Go build failed."
    exit 1
fi
log_info "✅ Go Backend successfully built at $BACKEND_GO_PATH"

# Step 6: Start Services with PM2
step_progress
log_info "🔄 Restarting PM2 Services"
pm2 restart craft-nest --update-env || pm2 start "$BACKEND_NEST_PATH" --name "craft-nest"
pm2 restart craft-go --update-env || pm2 start "$BACKEND_GO_PATH" --name "craft-go"
pm2 save
log_info "✅ PM2 processes synchronized."

# Step 7: Update Environment Variables (if --update-env is passed)
if [ "$UPDATE_ENV" = true ]; then
    log_info "Updating environment variables..."
    source /path/to/.env || log_error "Failed to source .env file."
fi

# Step 8: Monitoring Mode (if --monitor is passed)
if [ "$MONITOR" = true ]; then
    log_info "Entering monitoring mode..."
    pm2 monit
fi

# Final Summary
TOTAL_DURATION=$((SECONDS - START_TIME))
log_info "🎯 Deployment completed successfully in ${TOTAL_DURATION} seconds."
echo -e "\033[1;32m🎉 Deployment completed successfully in ${TOTAL_DURATION} seconds!\033[0m"
