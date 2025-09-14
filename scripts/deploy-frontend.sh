#!/bin/bash
# deploy-frontend.sh - Complete frontend deployment script
# Builds and deploys Angular frontend without creating archive files

# Source common functions for progress bar (optional)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
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
MAGENTA=$'\033[0;35m'

# Parse arguments
do_full_clean=false
server_build=false
skip_build=false
for arg in "$@"; do
    case "$arg" in
        --full-clean) do_full_clean=true ;;
        --server-build) server_build=true ;;
        --skip-build) skip_build=true ;;
    esac
done

# Configuration
WEB_ROOT="/var/www/jeffreysanford.us"
BACKUP_DIR="/var/backups/jeffreysanford.us"
NODEJS_VERSION="20" # Recommended Node.js version for Angular builds

# Check if running on server or local machine
if [ "$server_build" = true ]; then
    echo -e "${BLUE}Building on server...${NC}"
    BUILD_LOCATION="server"
else
    echo -e "${BLUE}Using local build (default)...${NC}"
    BUILD_LOCATION="local"
fi

echo -e "${BLUE}1. Creating backup of current deployment...${NC}"
if [ -d "$WEB_ROOT" ] && [ "$(ls -A $WEB_ROOT 2>/dev/null)" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    sudo cp -r "$WEB_ROOT" "$BACKUP_DIR/$backup_name"
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR/$backup_name${NC}"
else
    echo -e "${YELLOW}No existing deployment to backup${NC}"
fi

if [ "$skip_build" = false ]; then
    echo -e "${BLUE}2. Cleaning previous builds...${NC}"
    cd "$PROJECT_ROOT"
    
    # Clean individual app dist directories for more targeted cleanup
    rm -rf dist/apps/craft-web/
    # Also clean root dist if it exists
    rm -rf dist/
    
    if [ "$do_full_clean" = true ]; then
        echo -e "${YELLOW}Full clean requested -- removing node_modules and Nx caches...${NC}"
        rm -rf node_modules .nx/cache node_modules/.cache/nx 2>/dev/null || true
        # If server build and no node_modules, ensure clean install
        if [ "$server_build" = true ] && [ ! -d "node_modules" ]; then
            echo -e "${BLUE}Ensuring clean npm install for server build...${NC}"
        fi
    fi
    echo -e "${GREEN}✓ Build directories cleaned${NC}"

    if [ "$server_build" = true ]; then
        echo -e "${BLUE}3. Server Build: Checking Node.js environment...${NC}"
        
        # Check Node.js version
        current_node_version=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
        if [ "$current_node_version" -lt 18 ]; then
            echo -e "${YELLOW}⚠ Node.js version is $current_node_version, but Angular requires 18+. Consider upgrading to Node.js $NODEJS_VERSION LTS.${NC}"
        elif [ "$current_node_version" -eq 22 ]; then
            echo -e "${YELLOW}⚠ Node.js v22 detected. For maximum stability with Angular/Nx, consider using Node.js $NODEJS_VERSION LTS.${NC}"
        else
            echo -e "${GREEN}✓ Node.js version $current_node_version is suitable${NC}"
        fi

        # Check for consistent package manager
        if [ -f "pnpm-lock.yaml" ] && ! command -v pnpm &> /dev/null; then
            echo -e "${RED}✗ pnpm lockfile found but pnpm not installed. Removing pnpm lockfile to use npm.${NC}"
            rm -f pnpm-lock.yaml
        fi

        # Set memory constraints for server build
        echo -e "${BLUE}Setting up memory management for server build...${NC}"
        export NODE_OPTIONS="${NODE_OPTIONS:-}${NODE_OPTIONS:+ }--max_old_space_size=3072"
        echo -e "${GREEN}✓ NODE_OPTIONS: $NODE_OPTIONS${NC}"

        # Check available memory
        available_mem=$(free -m 2>/dev/null | awk 'NR==2{print $7}' || echo "2000")
        if [ "$available_mem" -lt 1500 ]; then
            echo -e "${YELLOW}⚠ Low memory detected ($available_mem MB available). Consider running memory cleanup first.${NC}"
        fi

        # Ensure dependencies are installed
        if [ ! -d "node_modules" ] || [ "$do_full_clean" = true ]; then
            echo -e "${BLUE}Installing dependencies...${NC}"
            # Use limited concurrency to avoid OOM
            npm ci --progress=false --no-audit --maxsockets=3
            dependency_status=$?
            if [ $dependency_status -ne 0 ]; then
                echo -e "${RED}✗ npm ci failed (exit code $dependency_status)${NC}"
                echo -e "${YELLOW}This could be due to memory constraints or lockfile issues.${NC}"
                echo -e "${YELLOW}Recommended fixes:${NC}"
                echo -e "${YELLOW}  1. Ensure adequate memory/swap available${NC}"
                echo -e "${YELLOW}  2. Remove any conflicting lockfiles (pnpm-lock.yaml)${NC}"
                echo -e "${YELLOW}  3. Clear npm cache: npm cache clean --force${NC}"
                echo -e "${YELLOW}  4. Reset Nx: npx nx reset${NC}"
                exit 1
            fi
            echo -e "${GREEN}✓ Dependencies installed${NC}"
        else
            echo -e "${GREEN}✓ Dependencies already present${NC}"
        fi
    fi

    echo -e "${BLUE}4. Building Angular application...${NC}"
    
    if [ "$server_build" = true ]; then
        cd "$PROJECT_ROOT"
        
        # Estimate time for Angular build (adjust as needed based on your system)
        ANGULAR_BUILD_ESTIMATE_SECONDS=180 # 3 minutes for server build
        phase_start_time=$(date +%s)
        print_progress "Server Angular Build" "$ANGULAR_BUILD_ESTIMATE_SECONDS" "$phase_start_time" "$CYAN" &
        progress_pid=$!

        # Use verbose build with proper error handling
        npm run build:prod -- --verbose --skip-nx-cache
        angular_build_status=$?
    else
        # Local build
        ANGULAR_BUILD_ESTIMATE_SECONDS=120 # 2 minutes for local build
        phase_start_time=$(date +%s)
        print_progress "Local Angular Build" "$ANGULAR_BUILD_ESTIMATE_SECONDS" "$phase_start_time" "$CYAN" &
        progress_pid=$!

        cd "$PROJECT_ROOT"
        npx nx run craft-web:build --configuration=production
        angular_build_status=$?
    fi

    kill "$progress_pid" &>/dev/null || true
    wait "$progress_pid" &>/dev/null || true
    cleanup_progress_line

    if [ $angular_build_status -eq 0 ]; then
        echo -e "${GREEN}✓ Angular build successful${NC}"
    else
        echo -e "${RED}✗ Angular build failed (exit code $angular_build_status)${NC}"
        if [ "$server_build" = true ]; then
            echo -e "${YELLOW}Server build failed. Check the verbose output above for specific errors.${NC}"
            echo -e "${YELLOW}Common issues:${NC}"
            echo -e "${YELLOW}  - Template syntax errors (missing braces, etc.)${NC}"
            echo -e "${YELLOW}  - Memory constraints during compilation${NC}"
            echo -e "${YELLOW}  - Missing dependencies or version conflicts${NC}"
        fi
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping build (--skip-build flag)${NC}"
fi

echo -e "${BLUE}5. Checking build output...${NC}"
if [ ! -d "dist/apps/craft-web" ]; then
    echo -e "${RED}✗ Build output directory not found: dist/apps/craft-web${NC}"
    echo -e "${YELLOW}Ensure the build completed successfully and check for errors above.${NC}"
    exit 1
fi

# Verify critical files exist
if [ ! -f "dist/apps/craft-web/index.html" ]; then
    echo -e "${RED}✗ index.html not found in build output${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh dist/apps/craft-web | cut -f1)
FILE_COUNT=$(find dist/apps/craft-web -type f | wc -l)
echo -e "${GREEN}✓ Build size: $BUILD_SIZE ($FILE_COUNT files)${NC}"

echo -e "${BLUE}6. Deploying to web server...${NC}"
# Create web root if it doesn't exist
sudo mkdir -p "$WEB_ROOT"

# Remove old deployment (but keep backup)
echo -e "${BLUE}6. Synchronizing files to production...${NC}"

# Use rsync for better file synchronization and to avoid cache issues
sudo rsync -avz --delete --no-perms --no-owner --no-group dist/apps/craft-web/ "$WEB_ROOT"/
deploy_status=$?
if [ $deploy_status -ne 0 ]; then
    echo -e "${RED}✗ Failed to sync files to web root${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Files synchronized to $WEB_ROOT${NC}"

echo -e "${BLUE}7. Setting permissions and SELinux contexts...${NC}"
sudo chown -R nginx:nginx "$WEB_ROOT"/
sudo chmod -R 755 "$WEB_ROOT"/

# Restore SELinux contexts if SELinux is enforcing
if command -v getenforce &> /dev/null && [ "$(getenforce)" = "Enforcing" ]; then
    echo -e "${BLUE}SELinux is enforcing - restoring contexts...${NC}"
    sudo restorecon -R "$WEB_ROOT"/ 2>/dev/null || echo -e "${YELLOW}⚠ restorecon failed (may be normal)${NC}"
    echo -e "${GREEN}✓ SELinux contexts restored${NC}"
fi
echo -e "${GREEN}✓ Permissions and contexts set${NC}"

echo -e "${BLUE}8. Verifying deployment...${NC}"
DEPLOYED_FILES=$(sudo find "$WEB_ROOT" -type f | wc -l)
echo -e "${GREEN}✓ Deployed $DEPLOYED_FILES files${NC}"

# Verify critical files
if [ -f "$WEB_ROOT/index.html" ]; then
    index_size=$(stat -f%z "$WEB_ROOT/index.html" 2>/dev/null || stat -c%s "$WEB_ROOT/index.html" 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ index.html found ($index_size bytes)${NC}"
else
    echo -e "${RED}✗ index.html missing from web root${NC}"
    exit 1
fi

# Check for main JS bundle
main_js_count=$(find "$WEB_ROOT" -name "main.*.js" | wc -l)
if [ "$main_js_count" -gt 0 ]; then
    echo -e "${GREEN}✓ Main JavaScript bundle found${NC}"
else
    echo -e "${YELLOW}⚠ Main JavaScript bundle not found (this might be normal for some builds)${NC}"
fi

echo -e "${BLUE}5. Deploying to web server...${NC}"
# Create web root if it doesn't exist
sudo mkdir -p "$WEB_ROOT"

# Synchronize new build using rsync for better handling
echo -e "${BLUE}5. Synchronizing files...${NC}"
sudo rsync -avz --delete --no-perms --no-owner --no-group dist/apps/craft-web/ "$WEB_ROOT"/
echo -e "${GREEN}✓ Files synchronized to $WEB_ROOT${NC}"

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

echo -e "${BLUE}9. Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration valid${NC}"
    
    echo -e "${BLUE}10. Reloading nginx...${NC}"
    sudo nginx -s reload
    reload_status=$?
    if [ $reload_status -eq 0 ]; then
        echo -e "${GREEN}✓ Nginx reloaded${NC}"
    else
        echo -e "${RED}✗ Nginx reload failed${NC}"
        echo -e "${YELLOW}Check nginx logs: sudo journalctl -u nginx -f${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Nginx configuration error${NC}"
    echo -e "${YELLOW}Check nginx logs: sudo tail -f /var/log/nginx/error.log${NC}"
    exit 1
fi

echo -e "${BLUE}11. Testing deployment...${NC}"
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
echo -e "${BLUE}12. Testing API proxy...${NC}"
API_HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
API_HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://jeffreysanford.us/api/health" 2>/dev/null || echo "000")

if [[ "$API_HTTP_RESPONSE" = "200" || "$API_HTTP_RESPONSE" = "404" || "$API_HTTPS_RESPONSE" = "200" || "$API_HTTPS_RESPONSE" = "404" ]]; then
    echo -e "${GREEN}✓ API proxy working (HTTP: $API_HTTP_RESPONSE, HTTPS: $API_HTTPS_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ API proxy test failed (HTTP: $API_HTTP_RESPONSE, HTTPS: $API_HTTPS_RESPONSE)${NC}"
    echo -e "${YELLOW}This might indicate backend services are not running.${NC}"
fi

# Test WebSocket connection (if WSS is configured)
echo -e "${BLUE}13. Testing WebSocket connection...${NC}"
if ! command -v wscat &> /dev/null; then
    echo -e "${YELLOW}wscat not found. Skipping WebSocket test.${NC}"
    echo -e "${YELLOW}To install: sudo npm install -g wscat${NC}"
else
    # Test both WSS and WS
    timeout 5s wscat -c "wss://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null \
        && echo -e "${GREEN}✓ WSS connection test passed${NC}" \
        || echo -e "${YELLOW}⚠ WSS connection test failed - check backend or nginx proxy${NC}"
    timeout 5s wscat -c "ws://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null \
        && echo -e "${GREEN}✓ WS connection test passed${NC}" \
        || echo -e "${YELLOW}⚠ WS connection test failed - check backend or nginx proxy${NC}"
fi

echo -e "${GREEN}=== Frontend Deployment Complete ===${NC}"
echo
echo -e "${BOLD}${WHITE}Deployment Summary:${NC}"
echo -e "  ${BLUE}Build method:${NC} ${GREEN}$BUILD_LOCATION${NC}"
echo -e "  ${BLUE}Site URL:${NC} ${GREEN}http://$HOSTNAME_TO_TEST${NC}"
echo -e "  ${BLUE}Build size:${NC} ${GREEN}$BUILD_SIZE${NC}"
echo -e "  ${BLUE}Files deployed:${NC} ${GREEN}$DEPLOYED_FILES${NC}"
echo -e "  ${BLUE}Web root:${NC} ${GREEN}$WEB_ROOT${NC}"
if [ -n "$backup_name" ]; then
    echo -e "  ${BLUE}Backup:${NC} ${GREEN}$BACKUP_DIR/$backup_name${NC}"
fi
echo
echo -e "${BOLD}${BLUE}Useful commands:${NC}"
echo -e "  ${BLUE}View access logs:${NC} ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo -e "  ${BLUE}View error logs:${NC}  ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "  ${BLUE}Test nginx:${NC}       ${YELLOW}sudo nginx -t${NC}"
echo -e "  ${BLUE}Reload nginx:${NC}     ${YELLOW}sudo nginx -s reload${NC}"
echo -e "  ${BLUE}Test site:${NC}        ${YELLOW}curl -I http://jeffreysanford.us${NC}"
echo -e "  ${BLUE}Check backend:${NC}    ${YELLOW}pm2 status${NC}"
echo
echo -e "${BOLD}${BLUE}Options for this script:${NC}"
echo -e "  ${YELLOW}--server-build${NC}   Build on server instead of locally"
echo -e "  ${YELLOW}--full-clean${NC}     Clean node_modules and caches before build"
echo -e "  ${YELLOW}--skip-build${NC}     Deploy existing build artifacts only"
echo
if [ "$server_build" = true ]; then
    echo -e "${BOLD}${GREEN}Server build completed successfully!${NC}"
    echo -e "${YELLOW}Note: Server builds use more memory and time but ensure environment consistency.${NC}"
else
    echo -e "${BOLD}${GREEN}Local build deployment completed successfully!${NC}"
    echo -e "${YELLOW}For server-side builds, use: ./scripts/deploy-frontend.sh --server-build${NC}"
fi

echo
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${MAGENTA}                    📋 POST-DEPLOYMENT CHECKLIST                         ${NC}"
echo -e "${BOLD}${MAGENTA}═══════════════════════════════════════════════════════════════════════════${NC}"
echo
echo -e "${BOLD}${CYAN}🔍 IMMEDIATE VERIFICATION:${NC}"
echo -e "  ${GREEN}□${NC} Test main site: ${YELLOW}curl -I https://jeffreysanford.us${NC}"
echo -e "  ${GREEN}□${NC} Check HTTPS redirect: ${YELLOW}curl -I http://jeffreysanford.us${NC}"
echo -e "  ${GREEN}□${NC} Verify Angular routes: ${YELLOW}curl -I https://jeffreysanford.us/about${NC}"
echo -e "  ${GREEN}□${NC} Test API endpoint: ${YELLOW}curl https://jeffreysanford.us/api/health${NC}"
echo
echo -e "${BOLD}${CYAN}🔗 BACKEND CONNECTIVITY:${NC}"
echo -e "  ${GREEN}□${NC} Check NestJS status: ${YELLOW}pm2 status craft-nest${NC}"
echo -e "  ${GREEN}□${NC} Check Go server status: ${YELLOW}pm2 status craft-go${NC}"
echo -e "  ${GREEN}□${NC} Test API integration: ${YELLOW}curl https://jeffreysanford.us/api-go/ping${NC}"
echo -e "  ${GREEN}□${NC} Test WebSocket connection with your browser dev tools"
echo
echo -e "${BOLD}${CYAN}📊 MONITORING & LOGS:${NC}"
echo -e "  ${GREEN}□${NC} Monitor nginx logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo -e "  ${GREEN}□${NC} Check for errors: ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "  ${GREEN}□${NC} Monitor backend logs: ${YELLOW}pm2 logs${NC}"
echo
echo -e "${BOLD}${CYAN}⚙️  PRODUCTION MAINTENANCE:${NC}"
echo -e "  ${GREEN}□${NC} Verify SSL certificates: ${YELLOW}openssl x509 -in /etc/letsencrypt/live/jeffreysanford.us/fullchain.pem -text -noout${NC}"
echo -e "  ${GREEN}□${NC} Check disk space: ${YELLOW}df -h${NC}"
echo -e "  ${GREEN}□${NC} Monitor memory usage: ${YELLOW}free -h${NC}"
echo -e "  ${GREEN}□${NC} Validate SELinux contexts: ${YELLOW}ls -Z /var/www/jeffreysanford.us/${NC}"
echo
echo -e "${BOLD}${YELLOW}💡 COMMON ISSUES & FIXES:${NC}"
echo -e "  ${RED}503 errors:${NC} Check backend services with ${YELLOW}pm2 status${NC}"
echo -e "  ${RED}404 on routes:${NC} Verify nginx try_files directive in nginx config"
echo -e "  ${RED}Static assets fail:${NC} Check nginx cache headers and file permissions"
echo -e "  ${RED}WebSocket fails:${NC} Verify proxy_set_header Upgrade and Connection headers"
echo
echo -e "${BOLD}${GREEN}✅ Deployment completed at $(date)${NC}"
echo -e "${BOLD}${BLUE}Remember to update your team about this deployment!${NC}"
