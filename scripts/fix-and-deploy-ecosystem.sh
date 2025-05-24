#!/bin/bash
# fix-and-deploy-ecosystem.sh - Fix ecosystem config and deploy to server

set -e

echo "🔧 Fixing and deploying ecosystem configuration..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Deploy the fixed ecosystem config to the production server
echo -e "${BLUE}Copying fixed ecosystem.config.js to production server...${NC}"
scp ./ecosystem.config.js jeffrey@jeffreysanford.us:/var/www/craft-fusion/

echo -e "${BLUE}Setting proper ownership and restarting services...${NC}"
ssh jeffrey@jeffreysanford.us "
    # Set ownership
    sudo chown craft-fusion:craft-fusion /var/www/craft-fusion/ecosystem.config.js
    
    # Stop current PM2 processes
    sudo -u craft-fusion pm2 delete all || true
    
    # Start with the fixed configuration
    cd /var/www/craft-fusion
    sudo -u craft-fusion pm2 start ecosystem.config.js
    sudo -u craft-fusion pm2 save
    
    echo '=== PM2 Status ==='
    sudo -u craft-fusion pm2 list
    
    echo '=== Waiting 10 seconds for services to start ==='
    sleep 10
    
    echo '=== Testing APIs ==='
    # Test NestJS API
    if curl -s -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo '✅ NestJS API is responding on port 3000'
    else
        echo '⚠️ NestJS API not responding yet'
        echo 'Recent logs:'
        sudo -u craft-fusion pm2 logs craft-nest-api --lines 5 --nostream || true
    fi
    
    # Test Go API  
    if curl -s -f http://localhost:4000/health >/dev/null 2>&1; then
        echo '✅ Go API is responding on port 4000'
    else
        echo '⚠️ Go API not responding yet'
        echo 'Recent logs:'
        sudo -u craft-fusion pm2 logs craft-go-api --lines 5 --nostream || true
    fi
"

echo -e "${GREEN}🎉 Ecosystem configuration fixed and deployed!${NC}"
echo -e "${BLUE}Check status: ${YELLOW}ssh jeffrey@jeffreysanford.us 'sudo -u craft-fusion pm2 monit'${NC}"
