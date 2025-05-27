#!/bin/bash
# deploy-backend.sh - Complete backend deployment script

set -e

echo "=== Backend Deployment Started ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/craft-fusion"
LOG_DIR="/var/log/craft-fusion"

# Helper to use sudo only if not root
maybe_sudo() {
    if [ "$(id -u)" -eq 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

echo -e "${BLUE}1. Stopping existing services...${NC}"
# Stop PM2 processes if they exist
if command -v pm2 &> /dev/null; then
    maybe_sudo pm2 stop ecosystem.config.js || true
    maybe_sudo pm2 delete all || true
    echo -e "${GREEN}✓ PM2 processes stopped${NC}"
    # Kill any lingering Go process (if still running)
    if maybe_sudo pgrep -f "dist/apps/craft-go/main" > /dev/null; then
        echo -e "${YELLOW}Killing lingering Go process...${NC}"
        maybe_sudo pkill -f "dist/apps/craft-go/main"
        echo -e "${GREEN}✓ Go process killed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PM2 not found, installing...${NC}"
    npm install -g pm2
fi

echo -e "${BLUE}2. Creating application directory...${NC}"
maybe_sudo mkdir -p "$APP_DIR"
maybe_sudo mkdir -p "$LOG_DIR"
maybe_sudo mkdir -p "$LOG_DIR/craft-nest"
maybe_sudo mkdir -p "$LOG_DIR/craft-go"
echo -e "${GREEN}✓ Directories created${NC}"

echo -e "${BLUE}3. Cleaning backend builds only...${NC}"
# Clean only backend dist directories, preserve frontend and node_modules
rm -rf dist/apps/craft-nest/
rm -rf dist/apps/craft-go/
echo -e "${GREEN}✓ Backend build directories cleaned${NC}"

echo -e "${BLUE}4. Checking dependencies...${NC}"
# Check if node_modules exists and has the key packages we need
if [ -d "node_modules" ] && [ -f "node_modules/.bin/nx" ]; then
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
else
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --omit=optional --no-audit --prefer-offline --progress=false
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠ First npm install failed, trying with reduced concurrency...${NC}"
        npm install --maxsockets 1 --omit=optional --no-audit --prefer-offline --progress=false
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Dependencies installed (retry)${NC}"
        else
            echo -e "${RED}✗ Dependencies installation failed${NC}"
            exit 1
        fi
    fi
fi

echo -e "${BLUE}5. Building NestJS application (production)...${NC}"
npx nx run craft-nest:build --configuration=production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ NestJS build successful${NC}"
else
    echo -e "${RED}✗ NestJS build failed${NC}"
    exit 1
fi

echo -e "${BLUE}6. Building Go application (production)...${NC}"
# Use production configuration which sets GOOS=linux GOARCH=amd64
npx nx run craft-go:build --configuration=production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Go build successful${NC}"
else
    echo -e "${RED}✗ Go build failed${NC}"
    exit 1
fi

echo -e "${BLUE}7. Verifying build outputs...${NC}"
# Check NestJS build
if [ -f "dist/apps/craft-nest/src/main.js" ]; then
    echo -e "${GREEN}✓ NestJS build output found${NC}"
else
    echo -e "${RED}✗ NestJS build output not found at dist/apps/craft-nest/src/main.js${NC}"
    ls -la dist/apps/craft-nest/ 2>/dev/null || echo "Directory not found"
    exit 1
fi

# Check Go build
if [ ! -f "dist/apps/craft-go/main" ]; then
    echo -e "${YELLOW}Go build output not found after build, forcing rebuild...${NC}"
    npx nx run craft-go:build --configuration=production --skip-nx-cache
    if [ ! -f "dist/apps/craft-go/main" ]; then
        echo -e "${RED}✗ Go build output still not found after rebuild${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ Go build output found after rebuild${NC}"
    fi
fi

# Verify Go binary is for Linux
GO_BINARY_TYPE=$(file dist/apps/craft-go/main)
if [[ "$GO_BINARY_TYPE" == *"ELF 64-bit LSB executable"* && "$GO_BINARY_TYPE" == *"x86-64"* ]]; then
    echo -e "${GREEN}✓ Go binary is Linux executable${NC}"
else
    echo -e "${RED}✗ Go binary is not Linux executable: $GO_BINARY_TYPE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build outputs verified${NC}"

echo -e "${BLUE}8. Copying application files...${NC}"
# Ensure no Go process is running in the target directory before copying
if maybe_sudo pgrep -f "$APP_DIR/dist/apps/craft-go/main" > /dev/null; then
    echo -e "${YELLOW}Killing Go process in $APP_DIR before copying...${NC}"
    maybe_sudo pkill -f "$APP_DIR/dist/apps/craft-go/main"
    sleep 1
    echo -e "${GREEN}✓ Go process in $APP_DIR killed${NC}"
fi
# Copy built applications
maybe_sudo cp -r dist/ "$APP_DIR"/
maybe_sudo cp ecosystem.config.js "$APP_DIR"/
maybe_sudo cp package.json "$APP_DIR"/

# Copy node_modules for NestJS app
maybe_sudo cp -r node_modules/ "$APP_DIR"/

# Set executable permissions for Go binary
maybe_sudo chmod +x "$APP_DIR/dist/apps/craft-go/main"

echo -e "${GREEN}✓ Application files copied${NC}"

echo -e "${BLUE}9. Setting ownership and permissions...${NC}"
# Create craft-fusion user if it doesn't exist
if ! id "craft-fusion" &>/dev/null; then
    maybe_sudo useradd -r -s /bin/false craft-fusion
    echo -e "${GREEN}✓ Created craft-fusion user${NC}"
fi
maybe_sudo chown -R craft-fusion:craft-fusion "$APP_DIR"
maybe_sudo chown -R craft-fusion:craft-fusion "$LOG_DIR"
maybe_sudo chmod -R 755 "$APP_DIR"
maybe_sudo chmod -R 755 "$LOG_DIR"
echo -e "${GREEN}✓ Permissions set${NC}"

echo -e "${BLUE}10. Starting services with PM2...${NC}"
cd "$APP_DIR"

# Start applications
if [ "$(id -u)" -eq 0 ]; then
    sudo -u craft-fusion pm2 start ecosystem.config.js
    sudo -u craft-fusion pm2 save
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u craft-fusion --hp /home/craft-fusion
else
    pm2 start ecosystem.config.js
    pm2 save
    env PATH=$PATH:/usr/bin pm2 startup systemd
fi

echo -e "${GREEN}✓ PM2 services started${NC}"

echo -e "${BLUE}11. Verifying services...${NC}"
sleep 5  # Give services time to start

# Check PM2 status
PM2_STATUS=$(maybe_sudo -u craft-fusion pm2 list)
echo -e "${BLUE}PM2 Status:${NC}"
echo "$PM2_STATUS"

# Test NestJS service
echo -e "${BLUE}12. Testing NestJS API...${NC}"
NEST_RESPONSE=$(curl -s -f -w "%{http_code}" -o /dev/null "http://localhost:3000/api/health" 2>/dev/null || echo "000")
if [ "$NEST_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ NestJS API is responding (HTTP $NEST_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ NestJS API test failed (HTTP $NEST_RESPONSE)${NC}"
    echo -e "${BLUE}Checking NestJS logs:${NC}"
    maybe_sudo tail -n 10 "$LOG_DIR/craft-nest/out.log" || echo "No logs found"
fi

# Test Go service
echo -e "${BLUE}13. Testing Go API...${NC}"
GO_RESPONSE=$(curl -s -f -w "%{http_code}" -o /dev/null "http://localhost:4000/health" 2>/dev/null || echo "000")
if [ "$GO_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Go API is responding (HTTP $GO_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠ Go API test failed (HTTP $GO_RESPONSE)${NC}"
    echo -e "${BLUE}Checking Go logs:${NC}"
    maybe_sudo tail -n 10 "$LOG_DIR/craft-go/out.log" || echo "No logs found"
fi

echo -e "${GREEN}=== Backend Deployment Complete ===${NC}"
echo
# Show PM2 process list after deployment
maybe_sudo -u craft-fusion pm2 list
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  NestJS API: ${GREEN}http://localhost:3000${NC}"
echo -e "  Go API: ${GREEN}http://localhost:4000${NC}"
echo -e "  App directory: ${GREEN}$APP_DIR${NC}"
echo -e "  Log directory: ${GREEN}$LOG_DIR${NC}"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  Check PM2 status: ${YELLOW}maybe_sudo -u craft-fusion pm2 list${NC}"
echo -e "  View NestJS logs: ${YELLOW}maybe_sudo tail -f $LOG_DIR/craft-nest/out.log${NC}"
echo -e "  View Go logs:     ${YELLOW}maybe_sudo tail -f $LOG_DIR/craft-go/out.log${NC}"
echo -e "  Restart services: ${YELLOW}maybe_sudo -u craft-fusion pm2 restart all${NC}"
echo -e "  Stop services:    ${YELLOW}maybe_sudo -u craft-fusion pm2 stop all${NC}"
