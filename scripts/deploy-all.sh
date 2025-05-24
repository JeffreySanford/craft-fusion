#!/bin/bash
# deploy-all.sh - Complete application deployment script for Fedora server

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

# Ensure scripts are executable
chmod +x scripts/*.sh

echo -e "${BLUE}=== Phase 1: Frontend Deployment ===${NC}"
./scripts/deploy-frontend.sh

echo -e "${BLUE}=== Phase 2: Backend Deployment ===${NC}"
./scripts/deploy-backend.sh

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
