#!/bin/bash
# test-go-api.sh - Specific tests for the Go API server

set -e

# Color definitions
BOLD='\033[1m'
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

# Configuration
GO_API_URL="http://localhost:4000"
TIMEOUT=10

echo -e "${BOLD}${CYAN}⚡ Go API Server Test Suite${NC}"
echo "Testing endpoints on: $GO_API_URL"
echo ""

# Function to test endpoint with detailed response
test_go_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    echo -e "${BOLD}Testing: ${description}${NC}"
    echo "  URL: ${GO_API_URL}${endpoint}"
    
    if ! command -v curl &> /dev/null; then
        echo -e "  ${YELLOW}⚠ SKIP: curl not available${NC}"
        return 2
    fi
    
    local response=$(curl -s -w "\nSTATUS:%{http_code}\nTIME:%{time_total}" "${GO_API_URL}${endpoint}" 2>/dev/null || echo -e "\nSTATUS:000\nTIME:timeout")
    
    local content=$(echo "$response" | grep -v "^STATUS:" | grep -v "^TIME:")
    local status_code=$(echo "$response" | grep "^STATUS:" | cut -d: -f2)
    local response_time=$(echo "$response" | grep "^TIME:" | cut -d: -f2)
    
    echo -n "  Status: "
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ $status_code${NC}"
    else
        echo -e "${RED}✗ $status_code (expected $expected_status)${NC}"
    fi
    
    echo "  Time: $response_time seconds"
    
    # Show response preview (first 200 chars)
    if [ ${#content} -gt 0 ]; then
        echo "  Response preview:"
        echo "$content" | head -c 200 | sed 's/^/    /'
        if [ ${#content} -gt 200 ]; then
            echo "    ..."
        fi
    fi
    
    echo ""
    
    # Return success if status matches expected
    [ "$status_code" = "$expected_status" ]
}

# Test if Go server is running
echo -e "${BLUE}🔍 Checking if Go server is running...${NC}"
if netstat -tuln 2>/dev/null | grep -q ":4000 "; then
    echo -e "${GREEN}✓ Go server is running on port 4000${NC}"
else
    echo -e "${RED}✗ Go server is not running on port 4000${NC}"
    echo "Please start it with: pm2 start ecosystem.config.js"
    exit 1
fi
echo ""

# Test all Go API endpoints
echo -e "${BOLD}${BLUE}🧪 Running Go API Tests${NC}"
echo ""

failures=0

# Health endpoint
test_go_endpoint "/api-go/health" "Health Check" "200" || ((failures++))

# Records endpoints
test_go_endpoint "/api-go/records" "Get All Records" "200" || ((failures++))
test_go_endpoint "/api-go/records/time" "Get Creation Time" "200" || ((failures++))
test_go_endpoint "/api-go/records/generate" "Generate Records (default)" "200" || ((failures++))
test_go_endpoint "/api-go/records/generate?count=5" "Generate 5 Records" "200" || ((failures++))
test_go_endpoint "/api-go/records/generate?count=100" "Generate 100 Records" "200" || ((failures++))

# Test getting specific record (generate one first to get a valid UID)
echo -e "${BOLD}Testing: Get Specific Record${NC}"
echo "  First generating a record to get a valid UID..."

if command -v curl &> /dev/null && command -v jq &> /dev/null; then
    # Generate a record and extract UID
    local gen_response=$(curl -s "${GO_API_URL}/api-go/records/generate?count=1" 2>/dev/null)
    local uid=$(echo "$gen_response" | jq -r '.[0].uid // empty' 2>/dev/null)
    
    if [ -n "$uid" ] && [ "$uid" != "null" ]; then
        echo "  Generated UID: $uid"
        test_go_endpoint "/api-go/records/$uid" "Get Record by UID" "200" || ((failures++))
    else
        echo -e "  ${YELLOW}⚠ Could not extract UID from generated record${NC}"
        echo ""
        ((failures++))
    fi
else
    echo -e "  ${YELLOW}⚠ SKIP: curl or jq not available${NC}"
    echo ""
fi

# Legacy API endpoints (for compatibility)
test_go_endpoint "/api/records" "Legacy Records Endpoint" "200" || ((failures++))
test_go_endpoint "/api/records/time" "Legacy Time Endpoint" "200" || ((failures++))
test_go_endpoint "/api/records/generate" "Legacy Generate Endpoint" "501" || ((failures++))  # Should return 501 Not Implemented

# Swagger documentation
test_go_endpoint "/swagger" "Swagger Redirect" "200" || ((failures++))
test_go_endpoint "/swagger/index.html" "Swagger UI" "200" || ((failures++))
test_go_endpoint "/api-go/swagger/index.html" "API Swagger UI" "200" || ((failures++))

# Test CORS headers
echo -e "${BOLD}Testing: CORS Headers${NC}"
if command -v curl &> /dev/null; then
    local cors_response=$(curl -s -H "Origin: http://localhost:4200" -H "Access-Control-Request-Method: GET" -X OPTIONS "${GO_API_URL}/api-go/health" -I 2>/dev/null)
    
    if echo "$cors_response" | grep -i "access-control-allow-origin" > /dev/null; then
        echo -e "  ${GREEN}✓ CORS headers present${NC}"
    else
        echo -e "  ${YELLOW}⚠ CORS headers not detected${NC}"
        ((failures++))
    fi
else
    echo -e "  ${YELLOW}⚠ SKIP: curl not available${NC}"
fi
echo ""

# Summary
echo -e "${BOLD}${CYAN}📊 Test Results Summary${NC}"
echo "═══════════════════════════════════════"

if [ $failures -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Go API is working correctly.${NC}"
    echo ""
    echo -e "${CYAN}💡 Your Go server is responding properly to all endpoints:${NC}"
    echo "   • Health checks working"
    echo "   • Record generation working" 
    echo "   • Record retrieval working"
    echo "   • Swagger documentation accessible"
    echo "   • Legacy API compatibility maintained"
    exit 0
else
    echo -e "${RED}❌ $failures test(s) failed.${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting tips:${NC}"
    echo "   • Check server logs: pm2 logs craft-go-api"
    echo "   • Verify server status: pm2 status"
    echo "   • Restart if needed: pm2 restart craft-go-api"
    echo "   • Check Go binary: ls -la dist/craft-go/craft-go"
    exit 1
fi