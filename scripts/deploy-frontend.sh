#!/bin/bash
# deploy-frontend.sh - Complete frontend deployment script

set -e

echo "=== Frontend Deployment Started ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
WEB_ROOT="/var/www/jeffreysanford.us"
BACKUP_DIR="/var/backups/jeffreysanford.us"

echo -e "${BLUE}1. Creating backup of current deployment...${NC}"
if [ -d "$WEB_ROOT" ] && [ "$(ls -A $WEB_ROOT 2>/dev/null)" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$WEB_ROOT" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${GREEN}✓ Backup created${NC}"
else
    echo -e "${YELLOW}No existing deployment to backup${NC}"
fi

echo -e "${BLUE}2. Cleaning previous builds...${NC}"
rm -rf dist/
echo -e "${GREEN}✓ Build directory cleaned${NC}"

echo -e "${BLUE}3. Building Angular application...${NC}"
npx nx run craft-web:build --configuration=production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Angular build successful${NC}"
else
    echo -e "${RED}✗ Angular build failed${NC}"
    exit 1
fi

echo -e "${BLUE}4. Checking build output...${NC}"
if [ ! -d "dist/apps/craft-web" ]; then
    echo -e "${RED}✗ Build output directory not found${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh dist/apps/craft-web | cut -f1)
echo -e "${GREEN}✓ Build size: $BUILD_SIZE${NC}"

echo -e "${BLUE}5. Deploying to web server...${NC}"
# Create web root if it doesn't exist
sudo mkdir -p "$WEB_ROOT"

# Remove old deployment
sudo rm -rf "$WEB_ROOT"/*

# Copy new build
sudo cp -r dist/apps/craft-web/* "$WEB_ROOT"/
echo -e "${GREEN}✓ Files copied to $WEB_ROOT${NC}"

echo -e "${BLUE}6. Setting permissions...${NC}"
sudo chown -R www-data:www-data "$WEB_ROOT"/
sudo chmod -R 755 "$WEB_ROOT"/
echo -e "${GREEN}✓ Permissions set${NC}"

echo -e "${BLUE}7. Verifying deployment...${NC}"
DEPLOYED_FILES=$(sudo find "$WEB_ROOT" -type f | wc -l)
echo -e "${GREEN}✓ Deployed $DEPLOYED_FILES files${NC}"

# Check for index.html
if [ -f "$WEB_ROOT/index.html" ]; then
    echo -e "${GREEN}✓ index.html found${NC}"
else
    echo -e "${RED}✗ index.html missing${NC}"
    exit 1
fi

echo -e "${BLUE}8. Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration valid${NC}"
    
    echo -e "${BLUE}9. Reloading nginx...${NC}"
    sudo nginx -s reload
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${RED}✗ Nginx configuration error${NC}"
    echo -e "${YELLOW}Check nginx logs: sudo tail -f /var/log/nginx/error.log${NC}"
    exit 1
fi

echo -e "${BLUE}10. Testing deployment...${NC}"
sleep 2  # Give nginx a moment to reload

# Test if the site is accessible
if curl -s -f -w "%{http_code}" "http://jeffreysanford.us" | grep -q "200"; then
    echo -e "${GREEN}✓ Site is accessible (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠ Site test failed - check logs${NC}"
    echo -e "${BLUE}Nginx error log:${NC}"
    sudo tail -5 /var/log/nginx/error.log
fi

# Test API proxy
echo -e "${BLUE}11. Testing API proxy...${NC}"
if curl -s -f "http://jeffreysanford.us/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API proxy working${NC}"
else
    echo -e "${YELLOW}⚠ API proxy test failed${NC}"
fi

echo -e "${GREEN}=== Frontend Deployment Complete ===${NC}"
echo
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Site URL: ${GREEN}http://jeffreysanford.us${NC}"
echo -e "  Build size: ${GREEN}$BUILD_SIZE${NC}"
echo -e "  Files deployed: ${GREEN}$DEPLOYED_FILES${NC}"
echo -e "  Web root: ${GREEN}$WEB_ROOT${NC}"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  View access logs: ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo -e "  View error logs:  ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "  Test nginx:       ${YELLOW}sudo nginx -t${NC}"
echo -e "  Reload nginx:     ${YELLOW}sudo nginx -s reload${NC}"
echo -e "  Test site:        ${YELLOW}curl -I http://jeffreysanford.us${NC}"
