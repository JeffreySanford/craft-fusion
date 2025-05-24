#!/bin/bash
# fix-pm2-permissions.sh - Quick fix for PM2 permissions issue

set -e

echo "🔧 Fixing PM2 permissions for craft-fusion user..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if craft-fusion user exists
if ! id "craft-fusion" &>/dev/null; then
    echo -e "${BLUE}Creating craft-fusion user...${NC}"
    sudo useradd -r -m -s /bin/bash craft-fusion
else
    echo -e "${GREEN}✓ craft-fusion user exists${NC}"
fi

# Create proper home directory if it doesn't exist
if [ ! -d "/home/craft-fusion" ]; then
    echo -e "${BLUE}Creating home directory for craft-fusion...${NC}"
    sudo mkdir -p /home/craft-fusion
    sudo chown craft-fusion:craft-fusion /home/craft-fusion
fi

# Initialize PM2 for craft-fusion user
echo -e "${BLUE}Initializing PM2 for craft-fusion user...${NC}"
sudo -u craft-fusion bash -c "
    export HOME=/home/craft-fusion
    pm2 --version || true
    pm2 ping || true
    pm2 list || true
"

# Set permissions on application directories
echo -e "${BLUE}Setting application permissions...${NC}"
sudo chown -R craft-fusion:craft-fusion /var/www/craft-fusion
sudo chown -R craft-fusion:craft-fusion /var/log/craft-fusion

# Create optimized ecosystem config
echo -e "${BLUE}Creating optimized PM2 configuration...${NC}"
cat > /tmp/ecosystem-fixed.config.js << 'EOF'
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
        PORT: 3000
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
        PORT: 4000
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

sudo cp /tmp/ecosystem-fixed.config.js /var/www/craft-fusion/ecosystem.config.js
sudo chown craft-fusion:craft-fusion /var/www/craft-fusion/ecosystem.config.js

# Start services with proper user
echo -e "${BLUE}Starting services with craft-fusion user...${NC}"
cd /var/www/craft-fusion

sudo -u craft-fusion bash -c "
    export HOME=/home/craft-fusion
    cd /var/www/craft-fusion
    pm2 start ecosystem.config.js
    pm2 save
    pm2 list
"

echo -e "${GREEN}✓ PM2 services started successfully${NC}"

# Test the services
echo -e "${BLUE}Testing services...${NC}"
sleep 5

# Test NestJS API
if curl -s -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ NestJS API is responding${NC}"
else
    echo -e "${YELLOW}⚠ NestJS API not responding yet (may need more time)${NC}"
fi

# Test Go API
if curl -s -f http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Go API is responding${NC}"
else
    echo -e "${YELLOW}⚠ Go API not responding yet (may need more time)${NC}"
fi

# Set up PM2 startup
echo -e "${BLUE}Setting up PM2 auto-startup...${NC}"
sudo -u craft-fusion bash -c "
    export HOME=/home/craft-fusion
    pm2 startup systemd -u craft-fusion --hp /home/craft-fusion
" | grep -E '^sudo' | sudo bash || true

echo -e "${GREEN}🎉 PM2 fix completed! Services should be running.${NC}"
echo -e "${BLUE}Check status with: ${YELLOW}sudo -u craft-fusion pm2 list${NC}"
echo -e "${BLUE}View logs with: ${YELLOW}sudo -u craft-fusion pm2 logs${NC}"
