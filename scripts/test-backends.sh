#!/bin/bash
# test-backends.sh - Comprehensive backend API testing script

set -e

# Color definitions
BOLD='\033[1m'
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Test configuration
NEST_API_URL="http://localhost:3000/api"
GO_API_URL="http://localhost:4000/api-go"
TIMEOUT=10

echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     🧪 Backend API Testing Suite                        ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to test HTTP endpoint
test_endpoint() {
    local url="$1"
    local expected_status="$2"
    local name="$3"
    local method="${4:-GET}"
    
    echo -n "  ${name}... "
    
    if command -v curl &> /dev/null; then
        local response
        local status_code
        
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" -m $TIMEOUT "$url" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" -m $TIMEOUT "$url" 2>/dev/null || echo "000")
        fi
        
        status_code=$(echo "$response" | tail -n1)
        
        if [ "$status_code" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
            if [ "$status_code" = "000" ]; then
                echo "    ${YELLOW}(Connection timeout or server not responding)${NC}"
            fi
            return 1
        fi
    else
        echo -e "${YELLOW}⚠ SKIP${NC} (curl not available)"
        return 2
    fi
}

# Function to test JSON response
test_json_endpoint() {
    local url="$1"
    local name="$2"
    local method="${3:-GET}"
    
    echo -n "  ${name}... "
    
    if command -v curl &> /dev/null; then
        local response
        local status_code
        
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -X "$method" -m $TIMEOUT "$url" 2>/dev/null || echo -e "\n000")
        status_code=$(echo "$response" | tail -n1)
        content=$(echo "$response" | head -n -1)
        
        if [ "$status_code" = "200" ]; then
            # Check if response is valid JSON
            if echo "$content" | jq . >/dev/null 2>&1; then
                echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code, Valid JSON)"
                return 0
            else
                echo -e "${YELLOW}⚠ PARTIAL${NC} (HTTP $status_code, Invalid JSON)"
                return 1
            fi
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $status_code)"
            if [ "$status_code" = "000" ]; then
                echo "    ${YELLOW}(Connection timeout or server not responding)${NC}"
            fi
            return 1
        fi
    else
        echo -e "${YELLOW}⚠ SKIP${NC} (curl not available)"
        return 2
    fi
}

# Check if servers are running
check_server_status() {
    echo -e "${BOLD}${BLUE}📡 Checking Server Status${NC}"
    
    # Check if ports are open
    local nest_running=false
    local go_running=false
    
    if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        echo -e "  ${GREEN}✓${NC} NestJS API server (port 3000) is running"
        nest_running=true
    else
        echo -e "  ${RED}✗${NC} NestJS API server (port 3000) is not running"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":4000 "; then
        echo -e "  ${GREEN}✓${NC} Go API server (port 4000) is running"
        go_running=true
    else
        echo -e "  ${RED}✗${NC} Go API server (port 4000) is not running"
    fi
    
    if [ "$nest_running" = false ] && [ "$go_running" = false ]; then
        echo -e "\n${RED}❌ No servers are running. Please start them with:${NC}"
        echo -e "  ${CYAN}pm2 start ecosystem.config.js${NC}"
        echo -e "  ${CYAN}# OR${NC}"
        echo -e "  ${CYAN}npm run pm2:start${NC}"
        return 1
    fi
    
    echo ""
    return 0
}

# Test NestJS API endpoints
test_nestjs_api() {
    echo -e "${BOLD}${BLUE}🚀 Testing NestJS API (port 3000)${NC}"
    
    local failures=0
    
    # Health check
    test_endpoint "$NEST_API_URL/health" "200" "Health Check" || ((failures++))
    
    # API root
    test_endpoint "$NEST_API_URL" "200" "API Root" || ((failures++))
    
    # Users endpoints
    test_json_endpoint "$NEST_API_URL/users" "Users List" || ((failures++))
    test_json_endpoint "$NEST_API_URL/users/profile" "User Profile" || ((failures++))
    
    # Records endpoints  
    test_json_endpoint "$NEST_API_URL/records" "Records List" || ((failures++))
    test_json_endpoint "$NEST_API_URL/records/time" "Records Creation Time" || ((failures++))
    
    # Recipes endpoints
    test_json_endpoint "$NEST_API_URL/recipes" "Recipes List" || ((failures++))
    
    # OpenSky endpoints (external API, may be slower)
    echo -n "  OpenSky Aircraft Data... "
    local response=$(curl -s -w "\n%{http_code}" -m 15 "$NEST_API_URL/opensky/aircraft" 2>/dev/null || echo -e "\n000")
    local status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "200" ] || [ "$status_code" = "500" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code - External API may be unavailable)"
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC} (HTTP $status_code - External API timeout)"
    fi
    
    echo ""
    if [ $failures -eq 0 ]; then
        echo -e "${GREEN}✅ NestJS API: All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ NestJS API: $failures test(s) failed${NC}"
        return 1
    fi
}

# Test Go API endpoints
test_go_api() {
    echo -e "${BOLD}${BLUE}⚡ Testing Go API (port 4000)${NC}"
    
    local failures=0
    
    # Health check
    test_endpoint "$GO_API_URL/health" "200" "Health Check" || ((failures++))
    
    # Records endpoints (Go specific paths)
    test_json_endpoint "$GO_API_URL/records" "Records List" || ((failures++))
    test_json_endpoint "$GO_API_URL/records/time" "Records Creation Time" || ((failures++))
    
    # Record generation
    test_json_endpoint "$GO_API_URL/records/generate" "Generate Records" || ((failures++))
    test_json_endpoint "$GO_API_URL/records/generate?count=5" "Generate 5 Records" || ((failures++))
    
    # Swagger documentation
    test_endpoint "$GO_API_URL/swagger/index.html" "200" "Swagger Documentation" || ((failures++))
    
    # Test legacy API paths for compatibility
    test_json_endpoint "http://localhost:4000/api/records" "Legacy Records Path" || ((failures++))
    test_json_endpoint "http://localhost:4000/api/records/time" "Legacy Records Time" || ((failures++))
    
    echo ""
    if [ $failures -eq 0 ]; then
        echo -e "${GREEN}✅ Go API: All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Go API: $failures test(s) failed${NC}"
        return 1
    fi
}

# Performance test
performance_test() {
    echo -e "${BOLD}${BLUE}⚡ Basic Performance Tests${NC}"
    
    echo -n "  NestJS Response Time... "
    if command -v curl &> /dev/null; then
        local time_total
        time_total=$(curl -s -w "%{time_total}" -o /dev/null "$NEST_API_URL/health" 2>/dev/null || echo "timeout")
        if [ "$time_total" != "timeout" ]; then
            echo -e "${GREEN}✓${NC} ${time_total}s"
        else
            echo -e "${RED}✗ Timeout${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ SKIP${NC}"
    fi
    
    echo -n "  Go API Response Time... "
    if command -v curl &> /dev/null; then
        local time_total
        time_total=$(curl -s -w "%{time_total}" -o /dev/null "$GO_API_URL/health" 2>/dev/null || echo "timeout")
        if [ "$time_total" != "timeout" ]; then
            echo -e "${GREEN}✓${NC} ${time_total}s"
        else
            echo -e "${RED}✗ Timeout${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ SKIP${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    local overall_status=0
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        echo -e "${YELLOW}⚠ Warning: curl is not installed. Some tests will be skipped.${NC}"
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠ Warning: jq is not installed. JSON validation will be limited.${NC}"
    fi
    
    # Run tests
    check_server_status || exit 1
    
    test_nestjs_api || overall_status=1
    test_go_api || overall_status=1
    
    performance_test
    
    # Summary
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║                           📊 Test Summary                               ║"  
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    if [ $overall_status -eq 0 ]; then
        echo -e "${GREEN}🎉 All backend tests passed successfully!${NC}"
        echo -e "   Both NestJS and Go APIs are working correctly."
    else
        echo -e "${RED}❌ Some backend tests failed.${NC}"
        echo -e "   Check the output above for details."
    fi
    
    echo -e "\n${CYAN}💡 Tip: Use 'pm2 logs' to check server logs if tests fail${NC}"
    echo -e "${CYAN}💡 Tip: Use 'pm2 status' to check server status${NC}"
    
    return $overall_status
}

# Run main function
main "$@"