#!/bin/bash
# quick-test.sh - Quick manual curl commands for testing

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Quick Backend Tests ===${NC}"
echo

echo -e "${GREEN}1. Basic Health Checks:${NC}"
echo "curl -X GET \"http://jeffreysanford.us:3000/health\""
echo "curl -X GET \"http://jeffreysanford.us:4000/health\""
echo

echo -e "${GREEN}2. API Information:${NC}"
echo "curl -X GET \"http://jeffreysanford.us:3000/api\" | jq '.'"
echo "curl -X GET \"http://jeffreysanford.us:4000/api/info\" | jq '.'"
echo

echo -e "${GREEN}3. Performance Test:${NC}"
echo "curl -X GET \"http://jeffreysanford.us:3000/health\" -w \"NestJS: %{time_total}s\\n\" -s -o /dev/null"
echo "curl -X GET \"http://jeffreysanford.us:4000/health\" -w \"Go API: %{time_total}s\\n\" -s -o /dev/null"
echo

echo -e "${GREEN}4. Authentication (get token):${NC}"
echo 'TOKEN=$(curl -s -X POST "http://jeffreysanford.us:3000/auth/login" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '\''{"email": "test@example.com", "password": "testpassword"}'\'' | \'
echo '  jq -r '\''.access_token'\'')'
echo 'echo "Token: $TOKEN"'
echo

echo -e "${GREEN}5. Authenticated Request:${NC}"
echo 'curl -X GET "http://jeffreysanford.us:3000/users/profile" \'
echo '  -H "Authorization: Bearer $TOKEN" | jq '\''.'\'
echo

echo -e "${GREEN}6. Create Data:${NC}"
echo 'curl -X POST "http://jeffreysanford.us:3000/api/items" \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer $TOKEN" \'
echo '  -d '\''{"name": "Test Item", "description": "Created via curl"}'\'' | jq '\''.'\'
echo

echo -e "${GREEN}7. Load Test (10 concurrent):${NC}"
echo 'for i in {1..10}; do'
echo '  curl -s -X GET "http://jeffreysanford.us:3000/health" -w "Request $i: %{http_code} in %{time_total}s\n" -o /dev/null &'
echo 'done'
echo 'wait'
echo

echo -e "${GREEN}8. Error Testing:${NC}"
echo 'curl -X GET "http://jeffreysanford.us:3000/nonexistent" -w "Status: %{http_code}\n"'
echo 'curl -X GET "http://jeffreysanford.us:4000/invalid" -w "Status: %{http_code}\n"'
echo

echo -e "${GREEN}9. CORS Test:${NC}"
echo 'curl -X OPTIONS "http://jeffreysanford.us:3000/health" \'
echo '  -H "Origin: http://localhost:4200" \'
echo '  -H "Access-Control-Request-Method: GET" \'
echo '  -v 2>&1 | grep -E "(Access-Control|HTTP/)"'
echo

echo -e "${BLUE}Run automated tests with: npm run test:backends${NC}"
