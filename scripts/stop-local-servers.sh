#!/bin/bash
# stop-local-servers.sh - Stop local development servers

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping local development servers...${NC}\n"

# Function to kill process if running
kill_if_running() {
    local pid=$1
    local name=$2
    
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}Stopping ${name} (PID: ${pid})...${NC}"
        kill "$pid" 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}Force killing ${name}...${NC}"
            kill -9 "$pid" 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ ${name} stopped${NC}"
    else
        echo -e "${YELLOW}${name} not running or PID not found${NC}"
    fi
}

# Read PIDs from files
if [ -f ".nest.pid" ]; then
    NEST_PID=$(cat .nest.pid)
    kill_if_running "$NEST_PID" "NestJS server"
    rm -f .nest.pid
fi

if [ -f ".go.pid" ]; then
    GO_PID=$(cat .go.pid)
    kill_if_running "$GO_PID" "Go server"
    rm -f .go.pid
fi

# Also try to kill any processes on ports 3000 and 4000
echo -e "\n${BLUE}🔍 Checking for any remaining processes on ports 3000 and 4000...${NC}"

# Kill processes on port 3000 (cross-platform approach)
if command -v lsof > /dev/null; then
    # Unix/Linux/macOS
    lsof -ti:3000 | xargs -r kill 2>/dev/null || true
    lsof -ti:4000 | xargs -r kill 2>/dev/null || true
elif command -v netstat > /dev/null; then
    # Windows with netstat (if available)
    for port in 3000 4000; do
        netstat -ano | grep ":${port} " | awk '{print $5}' | xargs -r taskkill //PID 2>/dev/null || true
    done
fi

echo -e "\n${GREEN}✓ All local servers stopped${NC}"