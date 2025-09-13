#!/bin/bash
# deploy-frontend.sh - Complete frontend deployment script

# Source common functions for progress bar (optional)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$SCRIPT_DIR/common-functions.sh" ] && source "$SCRIPT_DIR/common-functions.sh"
# Fallback progress helpers if common-functions.sh not present
if ! typeset -f print_progress >/dev/null 2>&1; then
    print_progress() {
        local title="$1"; local total="$2"; local start="$3"; local width=30
        [ ! -t 1 ] && return
        while true; do
            local now elapsed pct filled empty
            now=$(date +%s)
            elapsed=$((now - start))
            pct=0; [ "$total" -gt 0 ] && pct=$((elapsed * 100 / total)); [ "$pct" -gt 100 ] && pct=100
            filled=$((pct * width / 100)); empty=$((width - filled))
            printf "\r%-22s [" "$title:"
            printf "%0.s#" $(seq 1 $filled); printf "%0.s." $(seq 1 $empty)
            printf "] %3d%%" "$pct"
            [ "$pct" -ge 100 ] && break
            sleep 5
        done
    }
    cleanup_progress_line() { [ -t 1 ] && printf "\r\033[K"; }
fi

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

# Args
do_full_clean=false
for arg in "$@"; do
    [ "$arg" = "--full-clean" ] && do_full_clean=true
done

# Configuration
WEB_ROOT="/var/www/jeffreysanford.us"
BACKUP_DIR="/var/backups/jeffreysanford.us"

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
if [ "$do_full_clean" = true ]; then
    echo -e "${YELLOW}Full clean requested -- removing node_modules and Nx caches...${NC}"
    rm -rf node_modules .nx/cache node_modules/.cache/nx 2>/dev/null || true
fi
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
HOSTNAME_TO_TEST="${DEPLOY_HOST:-jeffreysanford.us}"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://$HOSTNAME_TO_TEST" 2>/dev/null || echo "000")
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$HOSTNAME_TO_TEST" 2>/dev/null || echo "000")

if [[ "$HTTP_RESPONSE" =~ ^(2|3)[0-9]{2}$ ]]; then
    echo -e "${GREEN}✓ HTTP site accessible (HTTP $HTTP_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ HTTP site test failed (HTTP $HTTP_RESPONSE)${NC}"
fi

if [[ "$HTTPS_RESPONSE" =~ ^(2|3)[0-9]{2}$ ]]; then
    echo -e "${GREEN}✓ HTTPS site accessible (HTTPS $HTTPS_RESPONSE)${NC}"
    PROTOCOL="https"
else
    echo -e "${YELLOW}⚠ HTTPS site test failed (HTTPS $HTTPS_RESPONSE)${NC}"
    PROTOCOL="http"
fi

# Test API proxy
API_HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
API_HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://jeffreysanford.us/api/health" 2>/dev/null || echo "000")

if [[ "$API_HTTP_RESPONSE" = "200" || "$API_HTTP_RESPONSE" = "404" || "$API_HTTPS_RESPONSE" = "200" || "$API_HTTPS_RESPONSE" = "404" ]]; then
    echo -e "${GREEN}✓ API proxy working (HTTP: $API_HTTP_RESPONSE, HTTPS: $API_HTTPS_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ API proxy test failed (HTTP: $API_HTTP_RESPONSE, HTTPS: $API_HTTPS_RESPONSE)${NC}"
fi

# Test WebSocket connection (if WSS is configured)
echo -e "${BLUE}12. Testing WebSocket connection...${NC}"
if ! command -v wscat &> /dev/null; then
    echo -e "${YELLOW}wscat not found. Installing globally...${NC}"
    sudo npm install -g wscat
fi
if command -v wscat &> /dev/null; then
    # Always test both WSS and WS
    timeout 5s wscat -c "wss://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null \
        && echo -e "${GREEN}✓ WSS connection test passed${NC}" \
        || echo -e "${YELLOW}⚠ WSS connection test failed - check backend or nginx proxy${NC}"
    timeout 5s wscat -c "ws://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null \
        && echo -e "${GREEN}✓ WS connection test passed${NC}" \
        || echo -e "${YELLOW}⚠ WS connection test failed - check backend or nginx proxy${NC}"
else
    echo -e "${RED}✗ wscat installation failed - skipping WebSocket test${NC}"
fi

echo -e "${GREEN}=== Frontend Deployment Complete ===${NC}"
echo
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Site URL: ${GREEN}http://$HOSTNAME_TO_TEST${NC}"
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
