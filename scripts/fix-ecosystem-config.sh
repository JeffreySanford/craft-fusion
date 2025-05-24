#!/bin/bash
# fix-ecosystem-config.sh - Fix PM2 ecosystem configuration

set -e

echo "🔧 Fixing PM2 ecosystem configuration..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Stop current PM2 processes
echo -e "${BLUE}Stopping current PM2 processes...${NC}"
sudo -u craft-fusion pm2 delete all || true

# Create corrected ecosystem configuration
echo -e "${BLUE}Creating corrected PM2 configuration...${NC}"
cat > /tmp/ecosystem-corrected.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'craft-nest-api',
      script: 'dist/apps/craft-nest/src/main.js',
      cwd: '/var/www/craft-fusion',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '150M',
      node_args: '--max-old-space-size=200',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      out_log: '/var/log/craft-fusion/craft-nest/out.log',
      error_log: '/var/log/craft-fusion/craft-nest/error.log',
      log_file: '/var/log/craft-fusion/craft-nest/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'craft-go-api',
      script: 'dist/apps/craft-go/main',
      cwd: '/var/www/craft-fusion',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0'
      },
      out_log: '/var/log/craft-fusion/craft-go/out.log',
      error_log: '/var/log/craft-fusion/craft-go/error.log',
      log_file: '/var/log/craft-fusion/craft-go/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Deploy the corrected configuration
sudo cp /tmp/ecosystem-corrected.config.js /var/www/craft-fusion/ecosystem.config.js
sudo chown craft-fusion:craft-fusion /var/www/craft-fusion/ecosystem.config.js

# Verify the build files exist
echo -e "${BLUE}Verifying build files...${NC}"
if [ ! -f "/var/www/craft-fusion/dist/apps/craft-nest/src/main.js" ]; then
    echo -e "${RED}✗ NestJS build file missing: /var/www/craft-fusion/dist/apps/craft-nest/src/main.js${NC}"
    echo -e "${YELLOW}Available files in dist/apps/craft-nest/:${NC}"
    ls -la /var/www/craft-fusion/dist/apps/craft-nest/ || true
    echo -e "${YELLOW}Available files in dist/apps/craft-nest/src/:${NC}"
    ls -la /var/www/craft-fusion/dist/apps/craft-nest/src/ || true
    exit 1
else
    echo -e "${GREEN}✓ NestJS build file found${NC}"
fi

if [ ! -f "/var/www/craft-fusion/dist/apps/craft-go/main" ]; then
    echo -e "${RED}✗ Go build file missing: /var/www/craft-fusion/dist/apps/craft-go/main${NC}"
    echo -e "${YELLOW}Available files in dist/apps/craft-go/:${NC}"
    ls -la /var/www/craft-fusion/dist/apps/craft-go/ || true
    exit 1
else
    echo -e "${GREEN}✓ Go build file found${NC}"
fi

# Start services with corrected configuration
echo -e "${BLUE}Starting services with corrected configuration...${NC}"
cd /var/www/craft-fusion

sudo -u craft-fusion bash -c "
    export HOME=/home/craft-fusion
    cd /var/www/craft-fusion
    pm2 start ecosystem.config.js
    pm2 save
    pm2 list
"

echo -e "${GREEN}✓ PM2 services restarted with corrected configuration${NC}"

# Test the services
echo -e "${BLUE}Testing services...${NC}"
sleep 10

# Test NestJS API
if curl -s -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ NestJS API is responding on port 3000${NC}"
else
    echo -e "${YELLOW}⚠ NestJS API not responding yet on port 3000${NC}"
    echo -e "${BLUE}Checking logs...${NC}"
    sudo -u craft-fusion pm2 logs craft-nest-api --lines 5 --nostream || true
fi

# Test Go API (corrected port)
if curl -s -f http://localhost:4000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Go API is responding on port 4000${NC}"
else
    echo -e "${YELLOW}⚠ Go API not responding yet on port 4000${NC}"
    echo -e "${BLUE}Checking logs...${NC}"
    sudo -u craft-fusion pm2 logs craft-go-api --lines 5 --nostream || true
fi

echo -e "${GREEN}🎉 Ecosystem configuration fixed!${NC}"
echo -e "${BLUE}Monitor with: ${YELLOW}sudo -u craft-fusion pm2 monit${NC}"
echo -e "${BLUE}View logs with: ${YELLOW}sudo -u craft-fusion pm2 logs${NC}"
