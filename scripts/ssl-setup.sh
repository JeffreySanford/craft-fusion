#!/bin/bash
# ssl-setup.sh - Set up SSL certificates for WSS support

set -e

echo "=== SSL Certificate Setup for WSS ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="jeffreysanford.us"
EMAIL="your-email@example.com"  # Replace with your email

echo -e "${BLUE}1. Installing Certbot...${NC}"
# For Fedora
if command -v dnf &> /dev/null; then
    sudo dnf install -y certbot python3-certbot-nginx
# For Ubuntu/Debian
elif command -v apt &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
else
    echo -e "${RED}Unsupported package manager. Please install certbot manually.${NC}"
    exit 1
fi

echo -e "${BLUE}2. Stopping nginx temporarily...${NC}"
sudo systemctl stop nginx

echo -e "${BLUE}3. Obtaining SSL certificate...${NC}"
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate obtained successfully${NC}"
else
    echo -e "${RED}✗ Failed to obtain SSL certificate${NC}"
    exit 1
fi

echo -e "${BLUE}4. Setting up automatic renewal...${NC}"
# Add cron job for automatic renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo -e "${BLUE}5. Testing certificate...${NC}"
sudo certbot certificates

echo -e "${BLUE}6. Starting nginx...${NC}"
sudo systemctl start nginx

echo -e "${GREEN}=== SSL Setup Complete ===${NC}"
echo -e "${BLUE}Certificate location: /etc/letsencrypt/live/$DOMAIN/${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Copy the nginx-wss.conf to /etc/nginx/sites-available/$DOMAIN"
echo -e "2. Create symlink: sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
echo -e "3. Test nginx: sudo nginx -t"
echo -e "4. Reload nginx: sudo nginx -s reload"
