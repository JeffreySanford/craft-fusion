#!/bin/bash
# deploy-frontend.sh - Complete frontend deployment script

set -e

echo "=== Frontend Deployment Started ==="
# Colors
GREEN=$'\033[0;32m'
BLUE=$'\033[0;34m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
NC=$'\033[0m'
BOLD=$'\033[1m'
WHITE=$'\033[1;37m'
PURPLE=$'\033[0;35m'
CYAN=$'\033[0;36m'
MAGENTA=$'\033[0;35m' # Added MAGENTA for consistency with deploy-all

# Configuration
WEB_ROOT="/var/www/jeffreysanford.us"
BACKUP_DIR="/var/backups/jeffreysanford.us"

# --- Progress Function (copied from deploy-all.sh) ---
print_progress() {
    local title="$1"
    local estimated_total_seconds="$2"
    local start_time_epoch="$3"
    local progress_bar_width=30
    local color_arg="${4:-$MAGENTA}" # Use passed color or default to MAGENTA

    if [ ! -t 1 ]; then return; fi # Only run if TTY

    while true; do
        local current_time_epoch=$(date +%s)
        local elapsed_seconds=$((current_time_epoch - start_time_epoch))
        local remaining_seconds=$((estimated_total_seconds - elapsed_seconds))

        [ "$remaining_seconds" -lt 0 ] && remaining_seconds=0

        local percent_done=0
        [ "$estimated_total_seconds" -gt 0 ] && percent_done=$((elapsed_seconds * 100 / estimated_total_seconds))
        [ "$percent_done" -gt 100 ] && percent_done=100

        local filled_width=$((percent_done * progress_bar_width / 100))
        local empty_width=$((progress_bar_width - filled_width))

        local bar_str=""
        for ((i=0; i<filled_width; i++)); do bar_str+="█"; done
        for ((i=0; i<empty_width; i++)); do bar_str+="░"; done

        local rem_min=$((remaining_seconds / 60))
        local rem_sec=$((remaining_seconds % 60))
        local time_left_str=$(printf "%02d:%02d" "$rem_min" "$rem_sec")

        printf "\r${BOLD}${color_arg}%-25s ${WHITE}[%s] ${GREEN}%3d%%${NC} ${YELLOW}(%s remaining)${NC}\033[K" "$title:" "$bar_str" "$percent_done" "$time_left_str"

        if [ "$remaining_seconds" -eq 0 ] && [ "$elapsed_seconds" -ge "$estimated_total_seconds" ]; then break; fi
        command sleep 5 # Update interval (e.g., 5 seconds for this script)
    done
}

cleanup_progress_line() { [ -t 1 ] && printf "\r\033[K"; }
# --- End of Progress Function ---

echo -e "${BLUE}1. Creating backup of current deployment...${NC}"
if [ -d "$WEB_ROOT" ] && [ "$(ls -A $WEB_ROOT 2>/dev/null)" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$WEB_ROOT" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${GREEN}✓ Backup created${NC}"
else
    echo -e "${YELLOW}No existing deployment to backup${NC}"
fi

echo -e "${BLUE}2. Cleaning previous builds...${NC}"
# Clean individual app dist directories for more targeted cleanup
rm -rf dist/apps/craft-web/
# Also clean root dist if it exists
rm -rf dist/
echo -e "${GREEN}✓ Build directories cleaned${NC}"

echo -e "${BLUE}3. Building Angular application...${NC}"

# Estimate time for Angular build (adjust as needed based on your system)
ANGULAR_BUILD_ESTIMATE_SECONDS=120 # 2 minutes
phase_start_time=$(date +%s)
print_progress "Angular Build" "$ANGULAR_BUILD_ESTIMATE_SECONDS" "$phase_start_time" "$CYAN" &
progress_pid=$!

npx nx run craft-web:build --configuration=production
angular_build_status=$?

kill "$progress_pid" &>/dev/null || true
wait "$progress_pid" &>/dev/null || true
cleanup_progress_line

if [ $angular_build_status -eq 0 ]; then
    echo -e "${GREEN}✓ Angular build successful${NC}"
else
    echo -e "${RED}✗ Angular build failed${NC}"
    exit 1
fi

echo -e "${BLUE}4. Checking build output...${NC}"
if [ ! -d "dist/apps/craft-web" ]; then
    echo -e "${RED}✗ Build output directory not found${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh dist/apps/craft-web | cut -f1)
echo -e "${GREEN}✓ Build size: $BUILD_SIZE${NC}"

echo -e "${BLUE}5. Deploying to web server...${NC}"
# Create web root if it doesn't exist
sudo mkdir -p "$WEB_ROOT"

# Remove old deployment
sudo rm -rf "$WEB_ROOT"/*

# Copy new build
sudo cp -r dist/apps/craft-web/* "$WEB_ROOT"/
echo -e "${GREEN}✓ Files copied to $WEB_ROOT${NC}"

echo -e "${BLUE}6. Setting permissions...${NC}"
sudo chown -R nginx:nginx "$WEB_ROOT"/
sudo chmod -R 755 "$WEB_ROOT"/
echo -e "${GREEN}✓ Permissions set${NC}"

echo -e "${BLUE}7. Verifying deployment...${NC}"
DEPLOYED_FILES=$(sudo find "$WEB_ROOT" -type f | wc -l)
echo -e "${GREEN}✓ Deployed $DEPLOYED_FILES files${NC}"

# Check for index.html
if [ -f "$WEB_ROOT/index.html" ]; then
    echo -e "${GREEN}✓ index.html found${NC}"
else
    echo -e "${RED}✗ index.html missing${NC}"
    exit 1
fi

echo -e "${BLUE}8. Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration valid${NC}"
    
    echo -e "${BLUE}9. Reloading nginx...${NC}"
    sudo nginx -s reload
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${RED}✗ Nginx configuration error${NC}"
    echo -e "${YELLOW}Check nginx logs: sudo tail -f /var/log/nginx/error.log${NC}"
    exit 1
fi

echo -e "${BLUE}10. Testing deployment...${NC}"
sleep 2  # Give nginx a moment to reload

# Test if the site is accessible
HTTP_RESPONSE=$(curl -s -f -w "%{http_code}" "http://jeffreysanford.us" 2>/dev/null || echo "000")
HTTPS_RESPONSE=$(curl -s -f -w "%{http_code}" "https://jeffreysanford.us" 2>/dev/null || echo "000")

if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    echo -e "${GREEN}✓ HTTP site accessible (HTTP $HTTP_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ HTTP site test failed (HTTP $HTTP_RESPONSE)${NC}"
fi

if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS site accessible (HTTPS $HTTPS_RESPONSE)${NC}"
    PROTOCOL="https"
else
    echo -e "${YELLOW}⚠ HTTPS site test failed (HTTPS $HTTPS_RESPONSE)${NC}"
    PROTOCOL="http"
fi

# Test API proxy
echo -e "${BLUE}11. Testing API proxy...${NC}"
API_HTTP_RESPONSE=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
API_HTTPS_RESPONSE=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/api/health" 2>/dev/null || echo "000")

if [ "$API_HTTP_RESPONSE" = "200" ] || [ "$API_HTTPS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ API proxy working${NC}"
else
    echo -e "${YELLOW}⚠ API proxy test failed (HTTP: $API_HTTP_RESPONSE, HTTPS: $API_HTTPS_RESPONSE)${NC}"
fi

# Test WebSocket connection (if WSS is configured)
echo -e "${BLUE}12. Testing WebSocket connection...${NC}"
if command -v wscat &> /dev/null; then
    # Test WSS if HTTPS is working, otherwise test WS
    if [ "$HTTPS_RESPONSE" = "200" ]; then
        timeout 5s wscat -c "wss://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null && \
        echo -e "${GREEN}✓ WSS connection test passed${NC}" || \
        echo -e "${YELLOW}⚠ WSS connection test failed - check backend${NC}"
    else
        timeout 5s wscat -c "ws://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null && \
        echo -e "${GREEN}✓ WS connection test passed${NC}" || \
        echo -e "${YELLOW}⚠ WS connection test failed - check backend${NC}"
    fi
else
    echo -e "${YELLOW}⚠ wscat not installed - skipping WebSocket test${NC}"
    echo -e "${BLUE}Install with: npm install -g wscat${NC}"
fi

echo -e "${GREEN}=== Frontend Deployment Complete ===${NC}"
echo
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Site URL: ${GREEN}http://jeffreysanford.us${NC}"
echo -e "  Build size: ${GREEN}$BUILD_SIZE${NC}"
echo -e "  Files deployed: ${GREEN}$DEPLOYED_FILES${NC}"
echo -e "  Web root: ${GREEN}$WEB_ROOT${NC}"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  View access logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo -e "  View error logs:  ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "  Test nginx:       ${YELLOW}sudo nginx -t${NC}"
echo -e "  Reload nginx:     ${YELLOW}sudo nginx -s reload${NC}"
echo -e "  Test site:        ${YELLOW}curl -I http://jeffreysanford.us${NC}"
