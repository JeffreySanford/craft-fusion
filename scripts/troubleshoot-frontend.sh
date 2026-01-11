#!/bin/bash
# troubleshoot-frontend.sh - Diagnose frontend deployment issues

set -e

# Colors
GREEN=$'\033[0;32m'
BLUE=$'\033[0;34m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
NC=$'\033[0m'
BOLD=$'\033[1m'
CYAN=$'\033[0;36m'

echo -e "${BOLD}${BLUE}🔍 Frontend Deployment Troubleshooting${NC}\n"

WEB_ROOT="/var/www/jeffreysanford.us"
BUILD_DIR="dist/apps/craft-web"

# Check 1: Build directory exists and has content
echo -e "${CYAN}1. Checking build directory...${NC}"
if [ -d "$BUILD_DIR" ]; then
    file_count=$(find "$BUILD_DIR" -type f | wc -l)
    echo -e "  ${GREEN}✓ Build directory exists: $BUILD_DIR${NC}"
    echo -e "  ${BLUE}Files in build: $file_count${NC}"
    
    # Show recent build files
    echo -e "  ${BLUE}Recent files:${NC}"
    find "$BUILD_DIR" -type f -name "*.js" -o -name "*.css" -o -name "index.html" | head -5 | sed 's/^/    /'
    
    # Check build timestamp
    if [ -f "$BUILD_DIR/index.html" ]; then
        build_time=$(stat -c %Y "$BUILD_DIR/index.html")
        build_date=$(date -d "@$build_time" '+%Y-%m-%d %H:%M:%S')
        echo -e "  ${BLUE}Last build: $build_date${NC}"
    fi
else
    echo -e "  ${RED}✗ Build directory missing: $BUILD_DIR${NC}"
    echo -e "  ${YELLOW}Run: npm run build:prod${NC}"
fi

echo

# Check 2: Production web directory
echo -e "${CYAN}2. Checking production directory...${NC}"
if [ -d "$WEB_ROOT" ]; then
    prod_file_count=$(find "$WEB_ROOT" -type f | wc -l)
    echo -e "  ${GREEN}✓ Production directory exists: $WEB_ROOT${NC}"
    echo -e "  ${BLUE}Files in production: $prod_file_count${NC}"
    
    # Check production files timestamp
    if [ -f "$WEB_ROOT/index.html" ]; then
        prod_time=$(stat -c %Y "$WEB_ROOT/index.html")
        prod_date=$(date -d "@$prod_time" '+%Y-%m-%d %H:%M:%S')
        echo -e "  ${BLUE}Last deployment: $prod_date${NC}"
        
        # Compare build vs production
        if [ -f "$BUILD_DIR/index.html" ]; then
            if [ "$build_time" -gt "$prod_time" ]; then
                echo -e "  ${YELLOW}⚠ Build is newer than production - deployment needed${NC}"
            else
                echo -e "  ${GREEN}✓ Production is up to date${NC}"
            fi
        fi
    fi
    
    # Check permissions
    owner=$(stat -c '%U:%G' "$WEB_ROOT")
    echo -e "  ${BLUE}Owner: $owner${NC}"
    
    if [ "$owner" = "nginx:nginx" ]; then
        echo -e "  ${GREEN}✓ Correct ownership${NC}"
    else
        echo -e "  ${YELLOW}⚠ Incorrect ownership - should be nginx:nginx${NC}"
    fi
else
    echo -e "  ${RED}✗ Production directory missing: $WEB_ROOT${NC}"
fi

echo

# Check 3: Nginx status and configuration
echo -e "${CYAN}3. Checking nginx...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "  ${GREEN}✓ Nginx is running${NC}"
    
    # Test nginx configuration
    if sudo nginx -t > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Nginx configuration is valid${NC}"
    else
        echo -e "  ${RED}✗ Nginx configuration has errors${NC}"
        sudo nginx -t
    fi
    
    # Check if nginx is serving the correct directory
    nginx_conf=$(sudo nginx -T 2>/dev/null | grep -A 10 "server_name.*jeffreysanford.us" | grep "root" | head -1 | awk '{print $2}' | tr -d ';')
    if [ "$nginx_conf" = "$WEB_ROOT" ]; then
        echo -e "  ${GREEN}✓ Nginx configured for correct directory${NC}"
    else
        echo -e "  ${YELLOW}⚠ Nginx root: $nginx_conf (expected: $WEB_ROOT)${NC}"
    fi
else
    echo -e "  ${RED}✗ Nginx is not running${NC}"
    echo -e "  ${YELLOW}Start with: sudo systemctl start nginx${NC}"
fi

echo

# Check 4: Test website access
echo -e "${CYAN}4. Testing website access...${NC}"

# Local access
if curl -s -I http://localhost > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Local HTTP access works${NC}"
else
    echo -e "  ${RED}✗ Local HTTP access failed${NC}"
fi

# Public access
if curl -s -I https://jeffreysanford.us > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Public HTTPS access works${NC}"
else
    echo -e "  ${YELLOW}⚠ Public HTTPS access failed${NC}"
fi

# Check for cached content
cache_headers=$(curl -s -I https://jeffreysanford.us | grep -i cache || echo "No cache headers")
echo -e "  ${BLUE}Cache headers: $cache_headers${NC}"

echo

# Check 5: Recent nginx logs
echo -e "${CYAN}5. Recent nginx access logs...${NC}"
if [ -f "/var/log/nginx/access.log" ]; then
    echo -e "  ${BLUE}Last 3 requests:${NC}"
    sudo tail -3 /var/log/nginx/access.log | sed 's/^/    /'
else
    echo -e "  ${YELLOW}⚠ No nginx access log found${NC}"
fi

echo

# Check 6: Browser caching issues
echo -e "${CYAN}6. Browser cache troubleshooting...${NC}"
echo -e "  ${BLUE}Current index.html content type:${NC}"
content_type=$(curl -s -I https://jeffreysanford.us | grep -i content-type || echo "Unknown")
echo -e "    $content_type"

echo -e "  ${BLUE}ETag/Last-Modified:${NC}"
etag=$(curl -s -I https://jeffreysanford.us | grep -i etag || echo "No ETag")
last_mod=$(curl -s -I https://jeffreysanford.us | grep -i last-modified || echo "No Last-Modified")
echo -e "    $etag"
echo -e "    $last_mod"

echo

# Provide solutions
echo -e "${BOLD}${YELLOW}💡 TROUBLESHOOTING SOLUTIONS:${NC}\n"

echo -e "${BOLD}${BLUE}If build is newer than production:${NC}"
echo -e "  ${CYAN}sudo ./scripts/deploy-frontend.sh --full-clean${NC}"
echo -e "  ${CYAN}# OR${NC}"
echo -e "  ${CYAN}sudo ./scripts/deploy-all.sh --full-clean${NC}"

echo -e "\n${BOLD}${BLUE}If nginx has issues:${NC}"
echo -e "  ${CYAN}sudo nginx -t${NC}  ${YELLOW}# Test config${NC}"
echo -e "  ${CYAN}sudo nginx -s reload${NC}  ${YELLOW}# Reload config${NC}"
echo -e "  ${CYAN}sudo systemctl restart nginx${NC}  ${YELLOW}# Full restart${NC}"

echo -e "\n${BOLD}${BLUE}If permissions are wrong:${NC}"
echo -e "  ${CYAN}sudo chown -R nginx:nginx $WEB_ROOT${NC}"
echo -e "  ${CYAN}sudo chmod -R 755 $WEB_ROOT${NC}"

echo -e "\n${BOLD}${BLUE}For browser caching issues:${NC}"
echo -e "  ${CYAN}Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)${NC}"
echo -e "  ${CYAN}Clear browser cache completely${NC}"
echo -e "  ${CYAN}Test in incognito/private browsing mode${NC}"
echo -e "  ${CYAN}Test with: curl -H 'Cache-Control: no-cache' https://jeffreysanford.us${NC}"

echo -e "\n${BOLD}${BLUE}Force cache busting deployment:${NC}"
echo -e "  ${CYAN}sudo rsync -avz --delete --no-cache dist/apps/craft-web/ $WEB_ROOT/${NC}"
echo -e "  ${CYAN}sudo nginx -s reload${NC}"

echo -e "\n${BOLD}${GREEN}🔍 Run this to see live changes:${NC}"
echo -e "  ${CYAN}watch -n 2 'curl -s https://jeffreysanford.us | grep -o \"<title>[^<]*\"'${NC}"

echo