#!/bin/bash

# ============================================================
# 🚀 🌟 Ultimate Craft-Fusion Deployment Script 🛡️🐹🌐
# ============================================================
# 📚 **Description:**  
# - 🛡️ Builds NestJS Backend (craft-nest)
# - 🐹 Builds Go Backend (craft-go)
# - 🅰️ Builds Angular Frontend (craft-web)
# - 🔄 Manages PM2 services (craft-nest, craft-go)
# - 🌐 Deploys Angular app to NGINX directory (/usr/www/nginx/html)
# - 🛡️ Fixes SQLite permissions
# - 🌐 Validates health endpoints
# - 📝 Detailed logs for junior developers and debugging.

# ============================================================
# 🌟 CONSTANTS & VARIABLES
# ============================================================

TOTAL_STEPS=60
CURRENT_STEP=0
PROGRESS_BAR_LENGTH=50
DEPLOY_LOG="deploy-digital-ocean.log"
START_TIME=$SECONDS
CUMULATIVE_DURATION=0

# Paths
GO_BINARY_PATH="/home/jeffrey/repos/craft-fusion/dist/apps/craft-go/main"
NESTJS_ENTRY_PATH="/home/jeffrey/repos/craft-fusion/dist/apps/craft-nest/main.js"
ANGULAR_DIST_PATH="/home/jeffrey/repos/craft-fusion/dist/apps/craft-web/browser"
NGINX_HTML_PATH="/usr/www/nginx/html"
NESTJS_DB_PATH="/home/jeffrey/repos/craft-fusion/apps/craft-nest/database.sqlite"

# Service Endpoints
NESTJS_URL="http://localhost:3000/api/health"
GO_URL="http://localhost:4000/api/health"

# ============================================================
# 🎯 UTILITY FUNCTIONS 🌟
# ============================================================

# 🛠️ STEP PROGRESS
function step_progress() {
    ((CURRENT_STEP++))
    local percentage=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    local progress=$((CURRENT_STEP * PROGRESS_BAR_LENGTH / TOTAL_STEPS))
    local remaining=$((PROGRESS_BAR_LENGTH - progress))
    echo -ne "\033[1;34m[STEP $CURRENT_STEP/$TOTAL_STEPS]\033[0m \033[1;33m($percentage%)\033[0m "
    printf "%-${PROGRESS_BAR_LENGTH}s" "$(printf '#%.0s' $(seq 1 $progress))"
    printf "%-${remaining}s" ""
    echo -e " \033[1;32m✔\033[0m"
}

# 📝 LOG INFO
function log_info() {
    echo -e "\033[1;34m[INFO]\033[0m \033[1;36m$1\033[0m"
    sudo bash -c "echo \"$(date '+%Y-%m-%d %H:%M:%S') [INFO] [$CURRENT_STEP/$TOTAL_STEPS] $1\" >> \"$DEPLOY_LOG\""
}

# ❌ LOG ERROR
function log_error() {
    echo -e "\033[1;31m[ERROR]\033[0m \033[1;37m$1\033[0m"
    sudo bash -c "echo \"$(date '+%Y-%m-%d %H:%M:%S') [ERROR] [$CURRENT_STEP/$TOTAL_STEPS] $1\" >> \"$DEPLOY_LOG\""
}

# 🛡️ STEP SUMMARY
function log_summary() {
    echo -e "\033[1;33m[SUMMARY]\033[0m \033[1;37m$1\033[0m"
}

# ⏱️ TRACK EXECUTION TIME
function track_time() {
    local start_time=$(date +%s%3N)
    "$@"
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    CUMULATIVE_DURATION=$((CUMULATIVE_DURATION + duration))
    echo -e "\033[1;35m[TIME]\033[0m \033[1;37m$1 took: ${duration} ms (Cumulative: ${CUMULATIVE_DURATION} ms)\033[0m"
}

# ============================================================
# 🛡️ ENVIRONMENT VALIDATION
# ============================================================
function log_environment() {
    log_summary "Logs the current system environment and dependencies."
    log_info "🧠 User: $USER"
    log_info "🧠 Go Version: $(go version)"
    log_info "🧠 Node Version: $(node -v)"
    log_info "🧠 NPM Version: $(npm -v)"
}

# ============================================================
# 🛡️ FIX SQLITE
# ============================================================
function fix_sqlite_permissions() {
    log_summary "Fixes permissions for SQLite database."
    sudo chmod 666 "$NESTJS_DB_PATH" || log_error "SQLite not found"
    sudo chown -R $(whoami) "$(dirname "$NESTJS_DB_PATH")"
}

# ============================================================
# 🅰️ BUILD ANGULAR
# ============================================================
function build_angular() {
    log_summary "Builds the Angular frontend (Craft-Web)."
    track_time npx nx run craft-web:build:production
    sudo mkdir -p "$NGINX_HTML_PATH"
    sudo cp -r "$ANGULAR_DIST_PATH"/* "$NGINX_HTML_PATH"
    log_info "✅ Angular build deployed to $NGINX_HTML_PATH"
}

# ============================================================
# 🔄 PM2 MANAGEMENT
# ============================================================
function restart_pm2() {
    track_time pm2 restart craft-nest --update-env || pm2 start "$NESTJS_ENTRY_PATH" --name craft-nest
    track_time pm2 restart craft-go --update-env || pm2 start "$GO_BINARY_PATH" --name craft-go
    track_time pm2 save
}

# ============================================================
# 🌐 VALIDATE HEALTH
# ============================================================
function validate_services() {
    curl -s "$NESTJS_URL" && log_info "✅ NestJS Healthy" || log_error "❌ NestJS Failed"
    curl -s "$GO_URL" && log_info "✅ Go Healthy" || log_error "❌ Go Failed"
}

# ============================================================
# 🚀 RUN DEPLOYMENT WORKFLOW
# ============================================================
step_progress; log_environment
step_progress; fix_sqlite_permissions
step_progress; build_angular
step_progress; restart_pm2
step_progress; validate_services

log_info "🎯 Deployment completed in $((SECONDS - START_TIME)) seconds."
