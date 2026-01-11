#!/bin/bash
# test-backends-remote.sh - Test remote backend servers on production

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Remote server configuration
REMOTE_HOST="jeffreysanford.us"
REMOTE_NEST_URL="https://${REMOTE_HOST}/api"
REMOTE_GO_URL="https://${REMOTE_HOST}/api-go"

echo -e "\n${BOLD}${PURPLE}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${PURPLE}║                 🌐 Remote Backend API Testing Suite                     ║${NC}"
echo -e "${BOLD}${PURPLE}╚══════════════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BOLD}${CYAN}🌍 Testing remote servers at: ${WHITE}${REMOTE_HOST}${NC}\n"

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is required but not installed. Please install curl first.${NC}"
    exit 1
fi

# Check if jq is available (optional)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: jq is not installed. JSON validation will be limited.${NC}"
    HAS_JQ=false
else
    HAS_JQ=true
fi

# Function to test endpoint with curl
test_endpoint() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    local timeout="${4:-10}"
    
    echo -e "${CYAN}Testing: ${WHITE}${description}${NC}"
    echo -e "${BLUE}URL: ${url}${NC}"
    
    # Make the request and capture both status and response
    response=$(curl -s -w "HTTPSTATUS:%{http_code}\nTIME:%{time_total}" \
                   --max-time "$timeout" \
                   --connect-timeout 5 \
                   "$url" 2>/dev/null || echo "HTTPSTATUS:000\nTIME:timeout")
    
    # Extract status code and response body
    http_status=$(echo "$response" | grep "HTTPSTATUS:" | cut -d: -f2)
    time_total=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTPSTATUS:/d' | sed '/TIME:/d')
    
    if [ "$http_status" = "$expected_status" ]; then
        echo -e "  ${GREEN}✓${NC} Status: ${GREEN}${http_status}${NC} (${time_total}s)"
        if [ "$HAS_JQ" = true ] && [[ "$body" =~ ^\{.*\}$ ]]; then
            echo -e "  ${GREEN}✓${NC} Valid JSON response"
            echo "$body" | jq . > /dev/null 2>&1 && echo -e "  ${GREEN}✓${NC} JSON syntax valid"
        fi
        echo -e "  ${BLUE}Response preview:${NC} ${body:0:100}..."
        return 0
    elif [ "$http_status" = "000" ]; then
        echo -e "  ${RED}✗${NC} Connection failed (timeout or network error)"
        return 1
    else
        echo -e "  ${RED}✗${NC} Status: ${RED}${http_status}${NC} (expected ${expected_status})"
        echo -e "  ${YELLOW}Response:${NC} ${body:0:200}..."
        return 1
    fi
}

# Test NestJS API endpoints
echo -e "${BOLD}${BLUE}🚀 Testing NestJS API (${REMOTE_NEST_URL})${NC}"
echo ""

nest_failures=0

# Health check
test_endpoint "${REMOTE_NEST_URL}/health" "200" "Health Check" || ((nest_failures++))
echo ""

# Records endpoint
test_endpoint "${REMOTE_NEST_URL}/records?limit=5" "200" "Get Records (limit 5)" || ((nest_failures++))
echo ""

# Generate records
test_endpoint "${REMOTE_NEST_URL}/records/generate?count=10" "200" "Generate 10 Records" || ((nest_failures++))
echo ""

# Test Go API endpoints
echo -e "${BOLD}${BLUE}🔥 Testing Go API (${REMOTE_GO_URL})${NC}"
echo ""

go_failures=0

# Health check
test_endpoint "${REMOTE_GO_URL}/health" "200" "Health Check" || ((go_failures++))
echo ""

# Records endpoint
test_endpoint "${REMOTE_GO_URL}/records" "200" "Get Records" || ((go_failures++))
echo ""

# Generate records
test_endpoint "${REMOTE_GO_URL}/records/generate?count=10" "200" "Generate 10 Records" || ((go_failures++))
echo ""

# Time endpoint
test_endpoint "${REMOTE_GO_URL}/records/time" "200" "Get Creation Time" || ((go_failures++))
echo ""

# Summary
echo -e "${BOLD}${PURPLE}📊 Test Summary${NC}"
echo -e "${CYAN}═══════════════${NC}"

if [ $nest_failures -eq 0 ]; then
    echo -e "${GREEN}✓ NestJS API: All tests passed${NC}"
else
    echo -e "${RED}✗ NestJS API: ${nest_failures} test(s) failed${NC}"
fi

if [ $go_failures -eq 0 ]; then
    echo -e "${GREEN}✓ Go API: All tests passed${NC}"
else
    echo -e "${RED}✗ Go API: ${go_failures} test(s) failed${NC}"
fi

total_failures=$((nest_failures + go_failures))

if [ $total_failures -eq 0 ]; then
    echo -e "\n${BOLD}${GREEN}🎉 All remote API tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${BOLD}${RED}❌ ${total_failures} test(s) failed${NC}"
    echo -e "${YELLOW}💡 Check your remote server status and network connectivity${NC}"
    exit 1
fi