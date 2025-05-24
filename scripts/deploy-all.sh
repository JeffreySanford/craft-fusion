#!/bin/bash
# deploy-all.sh - Complete application deployment script for Fedora server with memory optimization

set -e

echo "=== Craft Fusion Complete Deployment Started ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"
cd "$PROJECT_ROOT"

# Memory optimization settings
export NODE_OPTIONS="--max-old-space-size=512"
export NX_CACHE_DIRECTORY="/tmp/nx-cache"

# Ensure scripts are executable
chmod +x scripts/*.sh

echo -e "${BLUE}=== Memory Status Check ===${NC}"
echo -e "${BLUE}Current Memory Status:${NC}"
free -h | grep -E "(Mem|Swap)" || echo "Memory info not available"

# Check available memory and warn if low
AVAILABLE_MEM=$(free -m 2>/dev/null | awk 'NR==2{print $7}' || echo "2000")
if [ "$AVAILABLE_MEM" -lt 1000 ]; then
    echo -e "${YELLOW}⚠ Low memory detected ($AVAILABLE_MEM MB available)${NC}"
    echo -e "${BLUE}Ensuring swap is active and clearing system caches...${NC}"
    
    # Clear system caches to free memory
    sudo sync 2>/dev/null || true
    sudo sysctl vm.drop_caches=1 2>/dev/null || true
    
    echo -e "${GREEN}✓ System caches cleared${NC}"
fi

# Clear system caches and optimize memory before builds
echo -e "${BLUE}Cleaning previous builds with memory optimization...${NC}"
rm -rf node_modules/.cache/nx
rm -rf .nx/cache/
rm -rf /tmp/nx-cache/ 2>/dev/null || true

./scripts/clean-build.sh
CLEAN_STATUS=$?
if [ $CLEAN_STATUS -ne 0 ]; then
    echo -e "${YELLOW}⚠ clean-build.sh failed, retrying once...${NC}"
    ./scripts/clean-build.sh
    CLEAN_STATUS=$?
    if [ $CLEAN_STATUS -ne 0 ]; then
        echo -e "${RED}✗ clean-build.sh failed twice, aborting deployment.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Previous builds cleaned successfully${NC}"

# Clear memory before dependency installation
echo -e "${BLUE}Clearing memory and installing dependencies...${NC}"
sudo sync 2>/dev/null || true
sudo sysctl vm.drop_caches=1 2>/dev/null || true

rm -rf node_modules && npm cache clear --force
echo -e "${BLUE}Cleaning node_modules and npm cache...${NC}"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ node_modules and npm cache cleaned successfully${NC}"
else
    echo -e "${RED}✗ Failed to clean node_modules or npm cache${NC}"
    exit 1
fi


echo -e "${BLUE}=== Phase 0: Dependencies Setup (Memory Optimized) ===${NC}"
echo -e "${BLUE}Installing dependencies with memory constraints...${NC}"
npm install --omit=optional --no-audit --prefer-offline --progress=false --maxsockets=1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${YELLOW}⚠ First npm install failed, trying with reduced concurrency...${NC}"
    npm install --maxsockets 1 --omit=optional --no-audit --prefer-offline --progress=false
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed (retry)${NC}"
    else
        echo -e "${RED}✗ Dependencies installation failed${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}=== Phase 1: Backend Deployment ===${NC}"
./scripts/deploy-backend.sh

echo -e "${BLUE}=== Phase 2: Frontend Deployment ===${NC}"
./scripts/deploy-frontend.sh

echo -e "${BLUE}=== Phase 3: SSL/WSS Setup (if needed) ===${NC}"
read -p "Do you want to set up SSL/WSS? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -f "/etc/nginx/sites-available/default" ] || ! grep -q "ssl_certificate" /etc/nginx/sites-available/default; then
        echo -e "${YELLOW}Setting up SSL certificates and WSS configuration...${NC}"
        ./scripts/ssl-setup.sh
        ./scripts/wss-setup.sh
    else
        echo -e "${GREEN}✓ SSL/WSS already configured${NC}"
    fi
else
    echo -e "${YELLOW}Skipping SSL/WSS setup${NC}"
fi

echo -e "${BLUE}=== Phase 4: Final System Tests ===${NC}"

# Test all endpoints
echo -e "${BLUE}Testing all endpoints...${NC}"

# Test main site
SITE_HTTP=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us" 2>/dev/null || echo "000")
SITE_HTTPS=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us" 2>/dev/null || echo "000")

# Test APIs
API_NEST_HTTP=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
API_NEST_HTTPS=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
API_GO_HTTP=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/go-api/health" 2>/dev/null || echo "000")
API_GO_HTTPS=$(curl -s -f -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/go-api/health" 2>/dev/null || echo "000")

# Display results
echo -e "${BLUE}Endpoint Test Results:${NC}"
echo -e "  Main Site HTTP:  $([ "$SITE_HTTP" -eq 200 ] && echo -e "${GREEN}✓ $SITE_HTTP${NC}" || echo -e "${YELLOW}⚠ $SITE_HTTP${NC}")"
echo -e "  Main Site HTTPS: $([ "$SITE_HTTPS" -eq 200 ] && echo -e "${GREEN}✓ $SITE_HTTPS${NC}" || echo -e "${YELLOW}⚠ $SITE_HTTPS${NC}")"
echo -e "  NestJS API HTTP: $([ "$API_NEST_HTTP" -eq 200 ] && echo -e "${GREEN}✓ $API_NEST_HTTP${NC}" || echo -e "${YELLOW}⚠ $API_NEST_HTTP${NC}")"
echo -e "  NestJS API HTTPS:$([ "$API_NEST_HTTPS" -eq 200 ] && echo -e "${GREEN}✓ $API_NEST_HTTPS${NC}" || echo -e "${YELLOW}⚠ $API_NEST_HTTPS${NC}")"
echo -e "  Go API HTTP:     $([ "$API_GO_HTTP" -eq 200 ] && echo -e "${GREEN}✓ $API_GO_HTTP${NC}" || echo -e "${YELLOW}⚠ $API_GO_HTTP${NC}")"
echo -e "  Go API HTTPS:    $([ "$API_GO_HTTPS" -eq 200 ] && echo -e "${GREEN}✓ $API_GO_HTTPS${NC}" || echo -e "${YELLOW}⚠ $API_GO_HTTPS${NC}")"

# Test WebSocket if available
if command -v wscat &> /dev/null; then
    echo -e "${BLUE}Testing WebSocket connections...${NC}"
    
    if [ "$SITE_HTTPS" -eq 200 ]; then
        timeout 5s wscat -c "wss://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null && \
        echo -e "${GREEN}✓ WSS connection working${NC}" || \
        echo -e "${YELLOW}⚠ WSS connection failed${NC}"
    else
        timeout 5s wscat -c "ws://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null && \
        echo -e "${GREEN}✓ WS connection working${NC}" || \
        echo -e "${YELLOW}⚠ WS connection failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ wscat not installed - install with: npm install -g wscat${NC}"
fi

echo -e "${BLUE}=== Phase 5: System Status Summary ===${NC}"

# PM2 status
echo -e "${BLUE}PM2 Services:${NC}"
sudo -u craft-fusion pm2 list 2>/dev/null || echo -e "${YELLOW}PM2 not accessible${NC}"

# Nginx status
echo -e "${BLUE}Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is not running${NC}"
fi

# Disk usage
echo -e "${BLUE}Disk Usage:${NC}"
df -h / | tail -1 | awk '{print "  Root partition: " $3 " used of " $2 " (" $5 " full)"}'

# Memory usage
echo -e "${BLUE}Memory Usage:${NC}"
free -h | grep Mem | awk '{print "  Memory: " $3 " used of " $2}'

echo -e "${GREEN}=== Craft Fusion Deployment Complete ===${NC}"
echo
echo -e "${BLUE}🎉 Your Craft Fusion application is now deployed!${NC}"
echo
echo -e "${BLUE}Access your application:${NC}"
if [ "$SITE_HTTPS" -eq 200 ]; then
    echo -e "  🌐 Main Site: ${GREEN}https://jeffreysanford.us${NC}"
    echo -e "  🔌 WebSocket: ${GREEN}wss://jeffreysanford.us${NC}"
else
    echo -e "  🌐 Main Site: ${GREEN}http://jeffreysanford.us${NC}"
    echo -e "  🔌 WebSocket: ${GREEN}ws://jeffreysanford.us${NC}"
fi

echo -e "${BLUE}API Endpoints:${NC}"
echo -e "  📡 NestJS API: ${GREEN}/api/*${NC}"
echo -e "  🚀 Go API: ${GREEN}/go-api/*${NC}"

echo -e "${BLUE}Management Commands:${NC}"
echo -e "  View all logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log /var/log/craft-fusion/*/out.log${NC}"
echo -e "  PM2 dashboard: ${YELLOW}sudo -u craft-fusion pm2 monit${NC}"
echo -e "  Restart all: ${YELLOW}sudo -u craft-fusion pm2 restart all && sudo nginx -s reload${NC}"
