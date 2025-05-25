#!/bin/bash
# nginx-test.sh - Quick nginx testing and management script

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Nginx Test & Management ===${NC}"
echo

echo -e "${BLUE}1. Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Configuration valid${NC}"
    CONFIG_OK=true
else
    echo -e "${RED}✗ Configuration error${NC}"
    CONFIG_OK=false
fi
echo

echo -e "${BLUE}2. Checking nginx status...${NC}"
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
    NGINX_RUNNING=true
else
    echo -e "${RED}✗ Nginx is not running${NC}"
    NGINX_RUNNING=false
fi
echo

echo -e "${BLUE}3. Testing website accessibility...${NC}"
# Test main site
MAIN_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://jeffreysanford.us" 2>/dev/null || echo "000")
if [ "$MAIN_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Main site accessible (HTTP $MAIN_RESPONSE)${NC}"
else
    echo -e "${RED}✗ Main site failed (HTTP $MAIN_RESPONSE)${NC}"
fi

# Test API proxy
API_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ API proxy working (HTTP $API_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ API proxy test (HTTP $API_RESPONSE) - backend may be down${NC}"
fi

# Test Go API proxy
GO_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "http://jeffreysanford.us/go-api/health" 2>/dev/null || echo "000")
if [ "$GO_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Go API proxy working (HTTP $GO_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ Go API proxy test (HTTP $GO_RESPONSE) - backend may be down${NC}"
fi
echo

echo -e "${BLUE}4. Performance test...${NC}"
PERF_RESULT=$(curl -w "%{time_total}" -o /dev/null -s "http://jeffreysanford.us" 2>/dev/null || echo "0.000")
if (( $(echo "$PERF_RESULT < 1.0" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${GREEN}✓ Fast response time: ${PERF_RESULT}s${NC}"
elif (( $(echo "$PERF_RESULT < 3.0" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${YELLOW}⚠ Moderate response time: ${PERF_RESULT}s${NC}"
else
    echo -e "${RED}✗ Slow response time: ${PERF_RESULT}s${NC}"
fi
echo

echo -e "${BLUE}5. Recent access log entries:${NC}"
if [ -f "/var/log/nginx/access.log" ]; then
    sudo tail -3 /var/log/nginx/access.log | while read line; do
        echo -e "${GREEN}  $line${NC}"
    done
else
    echo -e "${YELLOW}  No access log found${NC}"
fi
echo

echo -e "${BLUE}6. Recent error log entries:${NC}"
if [ -f "/var/log/nginx/error.log" ]; then
    ERRORS=$(sudo tail -3 /var/log/nginx/error.log 2>/dev/null)
    if [ -n "$ERRORS" ]; then
        echo "$ERRORS" | while read line; do
            echo -e "${RED}  $line${NC}"
        done
    else
        echo -e "${GREEN}  No recent errors${NC}"
    fi
else
    echo -e "${YELLOW}  No error log found${NC}"
fi
echo

# Summary and recommendations
echo -e "${BLUE}=== Summary ===${NC}"
if [ "$CONFIG_OK" = true ] && [ "$NGINX_RUNNING" = true ] && [ "$MAIN_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ All tests passed - nginx is working correctly${NC}"
elif [ "$CONFIG_OK" = false ]; then
    echo -e "${RED}✗ Configuration errors need to be fixed${NC}"
    echo -e "${YELLOW}  Run: sudo nginx -t${NC}"
    echo -e "${YELLOW}  Check: /etc/nginx/sites-available/jeffreysanford.us${NC}"
elif [ "$NGINX_RUNNING" = false ]; then
    echo -e "${RED}✗ Nginx is not running${NC}"
    echo -e "${YELLOW}  Run: sudo systemctl start nginx${NC}"
    echo -e "${YELLOW}  Or:  sudo systemctl restart nginx${NC}"
else
    echo -e "${YELLOW}⚠ Some issues detected - check logs above${NC}"
fi
echo

echo -e "${BLUE}Quick commands:${NC}"
echo -e "  Test config:    ${YELLOW}sudo nginx -t${NC}"
echo -e "  Reload nginx:   ${YELLOW}sudo nginx -s reload${NC}"
echo -e "  Restart nginx:  ${YELLOW}sudo systemctl restart nginx${NC}"
echo -e "  View access:    ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo -e "  View errors:    ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "  Test site:      ${YELLOW}curl -I http://jeffreysanford.us${NC}"
