#!/bin/bash
# verify-deployment.sh - Comprehensive deployment verification

set -e

echo "=== Craft Fusion Deployment Verification ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verification results
CHECKS_PASSED=0
CHECKS_TOTAL=0

check_service() {
    local service_name="$1"
    local expected_status="$2"
    local description="$3"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -n "  Checking $description... "
    
    if systemctl is-active --quiet "$service_name"; then
        if [ "$expected_status" = "active" ]; then
            echo -e "${GREEN}✓ Running${NC}"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${YELLOW}⚠ Running (expected stopped)${NC}"
        fi
    else
        if [ "$expected_status" = "inactive" ]; then
            echo -e "${GREEN}✓ Stopped${NC}"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}✗ Not running${NC}"
        fi
    fi
}

check_endpoint() {
    local url="$1"
    local expected_code="$2"
    local description="$3"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -n "  Checking $description... "
    
    local response_code=$(curl -s -f -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ $response_code${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ $response_code (expected $expected_code)${NC}"
    fi
}

check_file_exists() {
    local file_path="$1"
    local description="$2"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -n "  Checking $description... "
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✓ Exists${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
}

check_directory_exists() {
    local dir_path="$1"
    local description="$2"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -n "  Checking $description... "
    
    if [ -d "$dir_path" ]; then
        echo -e "${GREEN}✓ Exists${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
}

check_port() {
    local port="$1"
    local description="$2"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -n "  Checking $description (port $port)... "
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✓ Listening${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ Not listening${NC}"
    fi
}

check_pm2_process() {
    local process_name="$1"
    local description="$2"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -n "  Checking $description PM2 process... "
    
    if sudo -u craft-fusion pm2 list 2>/dev/null | grep -q "$process_name.*online"; then
        echo -e "${GREEN}✓ Online${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ Not online${NC}"
    fi
}

echo -e "${BLUE}=== System Services Verification ===${NC}"
check_service "nginx" "active" "Nginx web server"

echo -e "${BLUE}=== Port Verification ===${NC}"
check_port "80" "HTTP port"
check_port "443" "HTTPS port (if SSL configured)"
check_port "3000" "NestJS API (local)"
check_port "4000" "Go API (local)" # Assuming Go runs on 4000 as per deploy-backend.sh

echo -e "${BLUE}=== File Structure Verification ===${NC}"
check_directory_exists "/var/www/jeffreysanford.us" "Frontend deployment directory"
check_directory_exists "/var/www/craft-fusion" "Backend application directory"
check_directory_exists "/var/log/craft-fusion" "Application logs directory"

# Check for key frontend files
check_file_exists "/var/www/jeffreysanford.us/index.html" "Frontend index.html"
check_file_exists "/var/www/jeffreysanford.us/main.js" "Frontend main.js bundle"

# Check for backend files
check_file_exists "/var/www/craft-fusion/dist/apps/craft-nest/src/main.js" "NestJS main file"
check_file_exists "/var/www/craft-fusion/dist/apps/craft-go/main" "Go API executable" # Path from deploy-backend.sh

echo -e "${BLUE}=== PM2 Process Verification ===${NC}"
check_pm2_process "craft-nest" "NestJS"
check_pm2_process "craft-go-api" "Go API"

echo -e "${BLUE}=== HTTP Endpoint Verification ===${NC}"
check_endpoint "http://jeffreysanford.us" "200" "Main site HTTP"
check_endpoint "http://jeffreysanford.us/api/health" "200" "NestJS API health"
check_endpoint "http://jeffreysanford.us/go-api/health" "200" "Go API health"

echo -e "${BLUE}=== HTTPS Endpoint Verification (if SSL configured) ===${NC}"
if [ -f "/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem" ]; then
    check_endpoint "https://jeffreysanford.us" "200" "Main site HTTPS"
    check_endpoint "https://jeffreysanford.us/api/health" "200" "NestJS API HTTPS"
    check_endpoint "https://jeffreysanford.us/go-api/health" "200" "Go API HTTPS"
else
    echo -e "${YELLOW}  No SSL certificates found - skipping HTTPS checks${NC}"
fi

echo -e "${BLUE}=== WebSocket Verification ===${NC}"
if command -v wscat &> /dev/null; then
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "  Checking WebSocket connection... "
    
    if [ -f "/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem" ]; then
        if timeout 5s wscat -c "wss://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null; then
            echo -e "${GREEN}✓ WSS working${NC}"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}✗ WSS failed${NC}"
        fi
    else
        if timeout 5s wscat -c "ws://jeffreysanford.us/socket.io/?EIO=4&transport=websocket" --no-check &>/dev/null; then
            echo -e "${GREEN}✓ WS working${NC}"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}✗ WS failed${NC}"
        fi
    fi
else
    echo -e "${YELLOW}  wscat not installed - install with: npm install -g wscat${NC}"
fi

echo -e "${BLUE}=== Memory and Resource Verification ===${NC}"
echo -e "${BLUE}Memory Usage:${NC}"
free -h | grep -E "(Mem|Swap)"

echo -e "${BLUE}Disk Usage:${NC}"
df -h / | tail -1 | awk '{print "  Root: " $3 " used of " $2 " (" $5 " full)"}'
df -h /var/www 2>/dev/null | tail -1 | awk '{print "  /var/www: " $3 " used of " $2 " (" $5 " full)")' || echo "  /var/www: Same as root partition"

echo -e "${BLUE}Process CPU/Memory:${NC}"
if command -v ps &> /dev/null; then
    ps aux --sort=-%mem | head -6 | awk 'NR==1{print "  " $0} NR>1 && ($11 ~ /(nginx|node|craft-)/ || $2 ~ /craft-fusion/){print "  " $0}'
fi

echo -e "${BLUE}=== Log File Verification ===${NC}"
LOG_FILES=(
    "/var/log/nginx/access.log"
    "/var/log/nginx/error.log"
    "/var/log/craft-fusion/nest/out.log"
    "/var/log/craft-fusion/nest/error.log"
    "/var/log/craft-fusion/go-api/out.log"
    "/var/log/craft-fusion/go-api/error.log"
)

for log_file in "${LOG_FILES[@]}"; do
    if [ -f "$log_file" ]; then
        size=$(du -h "$log_file" 2>/dev/null | cut -f1)
        echo -e "  ${GREEN}✓${NC} $log_file ($size)"
    else
        echo -e "  ${YELLOW}⚠${NC} $log_file (missing)"
    fi
done

echo -e "${BLUE}=== Configuration Verification ===${NC}"
CONFIGS=(
    "/etc/nginx/sites-available/default:Nginx configuration"
    "/etc/nginx/nginx.conf:Nginx main config"
)

for config in "${CONFIGS[@]}"; do
    file_path="${config%:*}"
    description="${config#*:}"
    check_file_exists "$file_path" "$description"
done

# Check nginx configuration syntax
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
echo -n "  Checking Nginx configuration syntax... "
if nginx -t &>/dev/null; then
    echo -e "${GREEN}✓ Valid${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ Invalid${NC}"
fi

echo -e "${BLUE}=== Deployment Verification Summary ===${NC}"
echo
if [ "$CHECKS_PASSED" -eq "$CHECKS_TOTAL" ]; then
    echo -e "${GREEN}🎉 All checks passed! ($CHECKS_PASSED/$CHECKS_TOTAL)${NC}"
    echo -e "${GREEN}✓ Your Craft Fusion deployment is fully functional!${NC}"
    exit_code=0
elif [ "$CHECKS_PASSED" -gt $((CHECKS_TOTAL * 3 / 4)) ]; then
    echo -e "${YELLOW}⚠ Most checks passed ($CHECKS_PASSED/$CHECKS_TOTAL)${NC}"
    echo -e "${YELLOW}⚠ Your deployment is mostly functional with minor issues${NC}"
    exit_code=1
elif [ "$CHECKS_PASSED" -gt $((CHECKS_TOTAL / 2)) ]; then
    echo -e "${YELLOW}⚠ Some checks failed ($CHECKS_PASSED/$CHECKS_TOTAL)${NC}"
    echo -e "${YELLOW}⚠ Your deployment has significant issues that need attention${NC}"
    exit_code=2
else
    echo -e "${RED}✗ Many checks failed ($CHECKS_PASSED/$CHECKS_TOTAL)${NC}"
    echo -e "${RED}✗ Your deployment has serious issues and may not be functional${NC}"
    exit_code=3
fi

echo
echo -e "${BLUE}Quick Commands:${NC}"
echo -e "  Check all logs: ${YELLOW}sudo tail -f /var/log/nginx/*.log /var/log/craft-fusion/*/out.log${NC}"
echo -e "  PM2 status: ${YELLOW}sudo -u craft-fusion pm2 status${NC}"
echo -e "  Restart all: ${YELLOW}sudo -u craft-fusion pm2 restart all && sudo nginx -s reload${NC}"
echo -e "  Memory monitor: ${YELLOW}watch -n 2 'free -h && ps aux --sort=-%mem | head -10'${NC}"

exit $exit_code
