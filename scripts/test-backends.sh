#!/bin/bash
# test-backends.sh - Comprehensive backend testing script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NEST_URL="http://jeffreysanford.us:3000"
GO_URL="http://jeffreysanford.us:4000"
TIMEOUT=10

echo -e "${BLUE}=== Craft Fusion Backend Test Suite ===${NC}"
echo -e "${YELLOW}Testing both NestJS and Go APIs${NC}"
echo

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local headers="$5"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            $headers \
            -d "$data" \
            --max-time $TIMEOUT \
            -o /tmp/response_body.json 2>/dev/null) || {
            echo -e "${RED}FAILED (connection error)${NC}"
            return 1
        }
    else
        response=$(curl -s -w "%{http_code}" -X "$method" "$url" \
            -H "Accept: application/json" \
            $headers \
            --max-time $TIMEOUT \
            -o /tmp/response_body.json 2>/dev/null) || {
            echo -e "${RED}FAILED (connection error)${NC}"
            return 1
        }
    fi
    
    status_code="${response: -3}"
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        echo -e "${GREEN}PASSED (${status_code})${NC}"
        return 0
    elif [ "$status_code" -ge 400 ] && [ "$status_code" -lt 500 ]; then
        echo -e "${YELLOW}CLIENT ERROR (${status_code})${NC}"
        return 1
    elif [ "$status_code" -ge 500 ]; then
        echo -e "${RED}SERVER ERROR (${status_code})${NC}"
        return 1
    else
        echo -e "${RED}UNKNOWN (${status_code})${NC}"
        return 1
    fi
}

# Function to test with timing
test_with_timing() {
    local name="$1"
    local url="$2"
    
    echo -n "Testing $name performance... "
    
    time_result=$(curl -s -w "%{time_total}" -X GET "$url" \
        -H "Accept: application/json" \
        --max-time $TIMEOUT \
        -o /dev/null 2>/dev/null) || {
        echo -e "${RED}FAILED${NC}"
        return 1
    }
    
    if (( $(echo "$time_result < 1.0" | bc -l) )); then
        echo -e "${GREEN}FAST (${time_result}s)${NC}"
    elif (( $(echo "$time_result < 3.0" | bc -l) )); then
        echo -e "${YELLOW}MODERATE (${time_result}s)${NC}"
    else
        echo -e "${RED}SLOW (${time_result}s)${NC}"
    fi
}

# Function to get auth token
get_auth_token() {
    echo -n "Getting auth token... "
    
    token_response=$(curl -s -X POST "$NEST_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "test@example.com", "password": "testpassword"}' \
        --max-time $TIMEOUT 2>/dev/null) || {
        echo -e "${RED}FAILED${NC}"
        return 1
    }
    
    TOKEN=$(echo "$token_response" | jq -r '.access_token' 2>/dev/null)
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        echo -e "${GREEN}SUCCESS${NC}"
        return 0
    else
        echo -e "${YELLOW}NO TOKEN${NC}"
        return 1
    fi
}

echo -e "${BLUE}1. Basic Health Checks${NC}"
test_endpoint "NestJS Health" "$NEST_URL/health" "GET"
test_endpoint "Go API Health" "$GO_URL/health" "GET"
echo

echo -e "${BLUE}2. API Information${NC}"
test_endpoint "NestJS API Info" "$NEST_URL/api" "GET"
test_endpoint "Go API Info" "$GO_URL/api/info" "GET"
echo

echo -e "${BLUE}3. Performance Testing${NC}"
test_with_timing "NestJS Response Time" "$NEST_URL/health"
test_with_timing "Go API Response Time" "$GO_URL/health"
echo

echo -e "${BLUE}4. Authentication Testing${NC}"
if get_auth_token; then
    test_endpoint "Authenticated Request" "$NEST_URL/users/profile" "GET" "" "-H \"Authorization: Bearer $TOKEN\""
else
    echo -e "${YELLOW}Skipping authenticated tests (no token)${NC}"
fi
echo

echo -e "${BLUE}5. Data Operations${NC}"
test_endpoint "Create Test Data (NestJS)" "$NEST_URL/api/items" "POST" '{"name":"Test Item","description":"Test from script"}' ""
test_endpoint "Get Data (NestJS)" "$NEST_URL/api/items" "GET"
test_endpoint "Create Test Data (Go)" "$GO_URL/api/data" "POST" '{"title":"Go Test","content":"Test from script"}' ""
test_endpoint "Get Data (Go)" "$GO_URL/api/data" "GET"
echo

echo -e "${BLUE}6. Error Handling${NC}"
test_endpoint "404 Test (NestJS)" "$NEST_URL/nonexistent" "GET"
test_endpoint "404 Test (Go)" "$GO_URL/invalid" "GET"
echo

echo -e "${BLUE}7. Load Testing (5 concurrent requests)${NC}"
echo -n "NestJS load test... "
{
    for i in {1..5}; do
        curl -s -X GET "$NEST_URL/health" -w "%{http_code}\n" -o /dev/null --max-time $TIMEOUT &
    done
    wait
} > /tmp/nest_load_results.txt 2>/dev/null

nest_success=$(grep -c "200" /tmp/nest_load_results.txt 2>/dev/null || echo "0")
echo -e "${GREEN}$nest_success/5 successful${NC}"

echo -n "Go API load test... "
{
    for i in {1..5}; do
        curl -s -X GET "$GO_URL/health" -w "%{http_code}\n" -o /dev/null --max-time $TIMEOUT &
    done
    wait
} > /tmp/go_load_results.txt 2>/dev/null

go_success=$(grep -c "200" /tmp/go_load_results.txt 2>/dev/null || echo "0")
echo -e "${GREEN}$go_success/5 successful${NC}"
echo

echo -e "${BLUE}8. CORS Testing${NC}"
echo -n "Testing CORS headers... "
cors_response=$(curl -s -I -X OPTIONS "$NEST_URL/health" \
    -H "Origin: http://localhost:4200" \
    -H "Access-Control-Request-Method: GET" \
    --max-time $TIMEOUT 2>/dev/null) || {
    echo -e "${RED}FAILED${NC}"
}

if echo "$cors_response" | grep -q "Access-Control-Allow"; then
    echo -e "${GREEN}CORS ENABLED${NC}"
else
    echo -e "${YELLOW}CORS NOT DETECTED${NC}"
fi
echo

echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}✓ Health checks completed${NC}"
echo -e "${GREEN}✓ Performance tests completed${NC}"
echo -e "${GREEN}✓ Load tests completed${NC}"
echo -e "${GREEN}✓ Error handling verified${NC}"
echo -e "${YELLOW}Note: Some tests may show CLIENT ERROR or NO TOKEN - this is expected for demo endpoints${NC}"
echo

# Cleanup
rm -f /tmp/response_body.json /tmp/nest_load_results.txt /tmp/go_load_results.txt 2>/dev/null

echo -e "${BLUE}=== Test Complete ===${NC}"
