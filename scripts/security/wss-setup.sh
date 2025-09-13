#!/bin/bash
# wss-setup.sh - Complete WSS setup for Craft Fusion

set -e

echo "=== WSS (WebSocket Secure) Setup for Craft Fusion ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="jeffreysanford.us"
EMAIL="your-email@example.com"  # Update this with your actual email
NGINX_SITE_FILE="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED_FILE="/etc/nginx/sites-enabled/$DOMAIN"

echo -e "${BLUE}1. Checking prerequisites...${NC}"

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    echo -e "${YELLOW}⚠ Running as root${NC}"
elif sudo -n true 2>/dev/null; then
    echo -e "${GREEN}✓ Sudo access available${NC}"
else
    echo -e "${RED}✗ This script requires sudo access${NC}"
    exit 1
fi

# Check if nginx is installed
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓ Nginx is installed${NC}"
else
    echo -e "${BLUE}Installing nginx...${NC}"
    if command -v dnf &> /dev/null; then
        sudo dnf install -y nginx
    elif command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y nginx
    else
        echo -e "${RED}✗ Unsupported package manager${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}2. Installing Certbot...${NC}"
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✓ Certbot already installed${NC}"
else
    if command -v dnf &> /dev/null; then
        sudo dnf install -y certbot python3-certbot-nginx
    elif command -v apt &> /dev/null; then
        sudo apt install -y certbot python3-certbot-nginx
    fi
fi

echo -e "${BLUE}3. Backing up existing nginx configuration...${NC}"
if [ -f "$NGINX_SITE_FILE" ]; then
    sudo cp "$NGINX_SITE_FILE" "$NGINX_SITE_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    echo -e "${GREEN}✓ Backup created${NC}"
fi

echo -e "${BLUE}4. Creating nginx sites directories...${NC}"
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

echo -e "${BLUE}5. Enabling sites-enabled in main nginx config...${NC}"
if ! grep -q "include /etc/nginx/sites-enabled/" /etc/nginx/nginx.conf; then
    sudo sed -i '/http {/a\\tinclude /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
    echo -e "${GREEN}✓ sites-enabled included in main config${NC}"
else
    echo -e "${GREEN}✓ sites-enabled already included${NC}"
fi

echo -e "${BLUE}6. Creating temporary nginx configuration (HTTP only)...${NC}"
sudo tee "$NGINX_SITE_FILE" > /dev/null << 'EOF'
server {
    listen 80;
    server_name jeffreysanford.us www.jeffreysanford.us;
    
    root /var/www/jeffreysanford.us;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF

echo -e "${BLUE}7. Enabling the site...${NC}"
sudo ln -sf "$NGINX_SITE_FILE" "$NGINX_ENABLED_FILE"
sudo rm -f /etc/nginx/sites-enabled/default

echo -e "${BLUE}8. Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration valid${NC}"
    sudo systemctl enable nginx
    sudo systemctl restart nginx
else
    echo -e "${RED}✗ Nginx configuration error${NC}"
    exit 1
fi

echo -e "${BLUE}9. Obtaining SSL certificate...${NC}"
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    sudo certbot certonly --webroot \
        -w /var/www/html \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SSL certificate obtained${NC}"
    else
        echo -e "${RED}✗ Failed to obtain SSL certificate${NC}"
        echo -e "${YELLOW}Trying standalone method...${NC}"
        sudo systemctl stop nginx
        sudo certbot certonly --standalone \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN
        sudo systemctl start nginx
    fi
else
    echo -e "${GREEN}✓ SSL certificate already exists${NC}"
fi

echo -e "${BLUE}10. Creating production nginx configuration with WSS...${NC}"
sudo tee "$NGINX_SITE_FILE" > /dev/null << 'EOF'
server {
    listen 80;
    server_name jeffreysanford.us www.jeffreysanford.us;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name jeffreysanford.us www.jeffreysanford.us;
    http2 on;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/jeffreysanford.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jeffreysanford.us/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Frontend
    root /var/www/jeffreysanford.us;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/js text/xml text/javascript application/javascript application/json application/xml+rss;
    
    # Handle Angular routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Nest API proxy
    location /api/ {
        # Note: no trailing slash to preserve the /api prefix (e.g., /api/health -> upstream /api/health)
        # Use 127.0.0.1 (IPv4) to avoid IPv6 localhost resolution issues
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Go API proxy
    location /api-go/ {
        # Note: no trailing slash on proxy_pass so the /api-go prefix is preserved
        # Use 127.0.0.1 (IPv4) to avoid IPv6 localhost resolution issues
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket Secure (WSS) support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        
        # WebSocket headers
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Protocol $http_sec_websocket_protocol;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' wss://jeffreysanford.us" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
EOF

echo -e "${BLUE}11. Testing final nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Final nginx configuration valid${NC}"
    sudo nginx -s reload
else
    echo -e "${RED}✗ Final nginx configuration error${NC}"
    exit 1
fi

echo -e "${BLUE}12. Setting up automatic SSL renewal...${NC}"
if ! crontab -l 2>/dev/null | grep -q certbot; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx") | crontab -
    echo -e "${GREEN}✓ Automatic renewal configured${NC}"
else
    echo -e "${GREEN}✓ Automatic renewal already configured${NC}"
fi

echo -e "${BLUE}13. Testing WSS connection...${NC}"
sleep 3  # Give nginx a moment to fully reload

# Test HTTPS
HTTPS_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "https://jeffreysanford.us" 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS site accessible${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS test failed (HTTP $HTTPS_RESPONSE)${NC}"
fi

# Test Nest API
API_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/api/health" 2>/dev/null || echo "000")
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS Nest API accessible (/api)${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS Nest API test failed (HTTP $API_RESPONSE) - make sure Nest backend is running on :3000${NC}"
fi

# Test Go API
GO_API_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "https://jeffreysanford.us/api-go/health" 2>/dev/null || echo "000")
if [ "$GO_API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS Go API accessible (/api-go)${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS Go API test failed (HTTP $GO_API_RESPONSE) - make sure Go backend is running on :4000${NC}"
fi

echo -e "${GREEN}=== WSS Setup Complete ===${NC}"
echo
echo -e "${BLUE}Summary:${NC}"
echo -e "✓ SSL Certificate: /etc/letsencrypt/live/$DOMAIN/"
echo -e "✓ Nginx Config: $NGINX_SITE_FILE"
echo -e "✓ WSS Endpoint: wss://jeffreysanford.us/socket.io/"
echo -e "✓ Automatic renewal: Configured"
echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Make sure your NestJS backend is running on port 3000"
echo -e "2. Make sure your Go backend is running on port 4000"
echo -e "3. Test WSS with: wscat -c 'wss://jeffreysanford.us/socket.io/?EIO=4&transport=websocket'"
echo -e "4. Deploy your frontend using the updated deploy script"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  Check SSL: ${YELLOW}sudo certbot certificates${NC}"
echo -e "  Test nginx: ${YELLOW}sudo nginx -t${NC}"
echo -e "  Reload nginx: ${YELLOW}sudo nginx -s reload${NC}"
echo -e "  View logs: ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
