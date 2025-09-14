#!/bin/bash
# start-local-servers.sh - Start both servers locally without PM2

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting local development servers...${NC}\n"

# Check if builds exist
if [ ! -f "dist/apps/craft-nest/src/main.js" ]; then
    echo -e "${YELLOW}⚠ NestJS build not found. Building...${NC}"
    npx nx build craft-nest
fi

if [ ! -f "dist/apps/craft-go/main.exe" ] && [ ! -f "dist/apps/craft-go/main" ]; then
    echo -e "${YELLOW}⚠ Go build not found. Building...${NC}"
    npx nx build craft-go
fi

# Create log directories
mkdir -p logs/craft-nest
mkdir -p logs/craft-go

echo -e "${GREEN}Starting NestJS server on port 3000...${NC}"
# Start NestJS in background
(cd dist/apps/craft-nest && PORT=3000 NODE_ENV=development node src/main.js) > logs/craft-nest/out.log 2> logs/craft-nest/error.log &
NEST_PID=$!

sleep 2

echo -e "${GREEN}Starting Go server on port 4000...${NC}"
# Start Go server in background  
(cd dist/apps/craft-go && PORT=4000 ./main.exe 2>/dev/null || ./main) > logs/craft-go/out.log 2> logs/craft-go/error.log &
GO_PID=$!

sleep 3

# Check if servers are running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ NestJS server running on http://localhost:3000${NC}"
else
    echo -e "${RED}✗ NestJS server failed to start${NC}"
fi

if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Go server running on http://localhost:4000${NC}"
else
    echo -e "${RED}✗ Go server failed to start${NC}"
fi

echo -e "\n${BLUE}💡 Server PIDs:${NC}"
echo -e "  NestJS PID: ${NEST_PID}"
echo -e "  Go PID: ${GO_PID}"
echo -e "\n${BLUE}📋 To stop servers:${NC}"
echo -e "  kill ${NEST_PID} ${GO_PID}"
echo -e "\n${BLUE}📋 Or use:${NC}"
echo -e "  npm run stop:local"
echo -e "\n${BLUE}📋 View logs:${NC}"
echo -e "  tail -f logs/craft-nest/out.log"
echo -e "  tail -f logs/craft-go/out.log"