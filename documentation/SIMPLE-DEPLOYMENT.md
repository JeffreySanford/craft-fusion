# Simple Production Deployment Guide (2025 Vibrant Edition)

## 🚀 Vibrant Quick Start

1. **Run full deployment:**

   ```bash
   bash scripts/deploy-all.sh
   ```

     Flags you can add:

     ```bash
     # Power-friendly priorities and full clean build
     bash scripts/deploy-all.sh --power --full-clean

     # SSL/WSS automation options
     bash scripts/deploy-all.sh --yes-ssl   # auto-run without prompt
     bash scripts/deploy-all.sh --skip-ssl  # skip SSL/WSS step
     ```

2. **Monitor system health in real time:**

   ```bash

  bash scripts/tools/memory-monitor.sh

   ```bash
3. **Run compliance scans:**
   ```bash
  sudo bash scripts/oscal/fedramp-minor.sh

> Tip: Override the domain used by the frontend deployer with:

```bash
DEPLOY_HOST=staging.example.com bash scripts/deploy-frontend.sh
```

   ```bash

  bash scripts/tools/memory-monitor.sh

   ```bash
3. **Run compliance scans:**
   ```bash
  sudo bash scripts/oscal/fedramp-minor.sh

> Tip: Override the domain used by the frontend deployer with:

```bash
DEPLOY_HOST=staging.example.com bash scripts/deploy-frontend.sh
## Example Vibrant Output
```text
🖥️  TRUE NORTH INSIGHTS: CRAFT FUSION SYSTEM MONITOR
...colorful output...
```

---

## Service Endpoints

- **NestJS API**: `jeffreysanford.us:3000`
- **Go API**: `jeffreysanford.us:4000`

## Testing Backend Services

### Health Check Commands

**NestJS API Health Check:**

```bash
curl -X GET "http://jeffreysanford.us:3000/health" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"
```

**Go API Health Check:**

```bash
curl -X GET "http://jeffreysanford.us:4000/health" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"
```

### API Information Commands

**NestJS API Info:**

```bash
curl -X GET "http://jeffreysanford.us:3000/api" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

**Go API Info:**

```bash
curl -X GET "http://jeffreysanford.us:4000/api/info" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

### Authentication Testing

**NestJS Login:**

```bash
curl -X POST "http://jeffreysanford.us:3000/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

**NestJS Register:**

```bash
curl -X POST "http://jeffreysanford.us:3000/auth/register" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "firstName": "Test",
    "lastName": "User"
  }' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

### Authenticated Requests

**Get JWT Token and Use It:**

```bash
# First, get a token
TOKEN=$(curl -s -X POST "http://jeffreysanford.us:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}' | \
  jq -r '.access_token')

# Then use the token for authenticated requests
curl -X GET "http://jeffreysanford.us:3000/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

### Data Operations

**Create Data (NestJS):**

```bash
curl -X POST "http://jeffreysanford.us:3000/api/items" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Item",
    "description": "Created via curl",
    "category": "testing"
  }' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

**Get Data (NestJS):**

```bash
curl -X GET "http://jeffreysanford.us:3000/api/items" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

**Go API Data Operations:**

```bash
# GET request with query parameters
curl -X GET "http://jeffreysanford.us:4000/api/data?limit=10&offset=0" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'

# POST request to Go API
curl -X POST "http://jeffreysanford.us:4000/api/data" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Go API Test",
    "content": "Testing Go backend",
    "tags": ["test", "api", "go"]
  }' \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" | jq '.'
```

### Performance Testing

**Load Test with Multiple Requests:**

```bash
# Test NestJS API with 10 concurrent requests
for i in {1..10}; do
  curl -X GET "http://jeffreysanford.us:3000/health" \
    -w "Request $i: %{http_code} in %{time_total}s\n" \
    -s -o /dev/null &
done
wait

# Test Go API with 10 concurrent requests
for i in {1..10}; do
  curl -X GET "http://jeffreysanford.us:4000/health" \
    -w "Request $i: %{http_code} in %{time_total}s\n" \
    -s -o /dev/null &
done
wait
```

**Response Time Testing:**

```bash
# Detailed timing for NestJS
curl -X GET "http://jeffreysanford.us:3000/health" \
  -w "DNS Lookup: %{time_namelookup}s\nConnect: %{time_connect}s\nApp Connect: %{time_appconnect}s\nRedirect: %{time_redirect}s\nStart Transfer: %{time_starttransfer}s\nTotal: %{time_total}s\nSize: %{size_download} bytes\n" \
  -s -o /dev/null

# Detailed timing for Go API
curl -X GET "http://jeffreysanford.us:4000/health" \
  -w "DNS Lookup: %{time_namelookup}s\nConnect: %{time_connect}s\nApp Connect: %{time_appconnect}s\nRedirect: %{time_redirect}s\nStart Transfer: %{time_starttransfer}s\nTotal: %{time_total}s\nSize: %{size_download} bytes\n" \
  -s -o /dev/null
```

### Error Testing

**Test Invalid Endpoints:**

```bash
# Test 404 responses
curl -X GET "http://jeffreysanford.us:3000/nonexistent" \
  -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Not JSON response"

curl -X GET "http://jeffreysanford.us:4000/invalid" \
  -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Not JSON response"
```

**Test Bad Request Data:**

```bash
# Test malformed JSON
curl -X POST "http://jeffreysanford.us:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"invalid": json}' \
  -w "\nStatus: %{http_code}\n" 2>/dev/null
```

### CORS Testing

**Test CORS Headers:**

```bash
curl -X OPTIONS "http://jeffreysanford.us:3000/health" \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(Access-Control|HTTP/)"
```

### WebSocket Testing (if applicable)

**Test WebSocket Connection:**

```bash
# Install wscat if not available: npm install -g wscat
# wscat -c ws://jeffreysanford.us:3000/socket.io/?EIO=4&transport=websocket
```

### Complete Test Suite Script

Create a test script to run all tests:

```bash
#!/bin/bash
# test-backends.sh

echo "=== Testing Backend Services ==="
echo

echo "1. Testing NestJS Health..."
curl -s -X GET "http://jeffreysanford.us:3000/health" -w "Status: %{http_code}\n"

echo
echo "2. Testing Go API Health..."
curl -s -X GET "http://jeffreysanford.us:4000/health" -w "Status: %{http_code}\n"

echo
echo "3. Testing NestJS API Info..."
curl -s -X GET "http://jeffreysanford.us:3000/api" | jq '.' 2>/dev/null || echo "No JSON response"

echo
echo "4. Testing Go API Info..."
curl -s -X GET "http://jeffreysanford.us:4000/api/info" | jq '.' 2>/dev/null || echo "No JSON response"

echo
echo "5. Performance test (5 requests each)..."
echo "NestJS timing:"
for i in {1..5}; do
  curl -s -X GET "http://jeffreysanford.us:3000/health" -w "Request $i: %{time_total}s\n" -o /dev/null
done

echo "Go API timing:"
for i in {1..5}; do
  curl -s -X GET "http://jeffreysanford.us:4000/health" -w "Request $i: %{time_total}s\n" -o /dev/null
done

echo
echo "=== Test Complete ==="
```

## Frontend Deployment

### Angular Web Application Deployment

The Angular frontend (`craft-web`) needs to be built and deployed to nginx for serving static files.

#### 1. Clean and Build Frontend

```bash
# Clean previous builds
rm -rf dist/

# Build Angular app for production
npx nx run craft-web:build --configuration=production
```

#### 2. Deploy to Web Server

```bash
# Remove old deployment
sudo rm -rf /var/www/jeffreysanford.us/*

# Copy new build to nginx document root
sudo cp -r dist/apps/craft-web/* /var/www/jeffreysanford.us/

# Set proper ownership and permissions
sudo chown -R www-data:www-data /var/www/jeffreysanford.us/
sudo chmod -R 755 /var/www/jeffreysanford.us/
```

#### 3. Nginx Configuration

**Basic nginx config for Angular SPA (`/etc/nginx/sites-available/jeffreysanford.us`):**

```nginx
server {
    listen 80;
    server_name jeffreysanford.us www.jeffreysanford.us;
    root /var/www/jeffreysanford.us;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;

    # Handle Angular routes (SPA routing)
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

    # API proxy to backend services
    location /api/ {
        proxy_pass http://localhost:3000/;
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
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### 4. Nginx Commands

**Test and Reload Nginx Configuration:**

```bash
# Test nginx configuration syntax
sudo nginx -t

# If test passes, reload nginx
sudo nginx -s reload

# Alternative: restart nginx service
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View nginx error logs if needed
sudo tail -f /var/log/nginx/error.log

# View nginx access logs
sudo tail -f /var/log/nginx/access.log
```

**Enable the site (if not already enabled):**

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/jeffreysanford.us /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t && sudo nginx -s reload
```

#### 5. Complete Deployment Script

Create a deployment script (`scripts/deploy-frontend.sh`):

```bash
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
if [ -d "$WEB_ROOT" ] && [ "$(ls -A $WEB_ROOT)" ]; then
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

echo -e "${BLUE}4. Deploying to web server...${NC}"
# Remove old deployment
sudo rm -rf "$WEB_ROOT"/*

# Copy new build
sudo cp -r dist/apps/craft-web/* "$WEB_ROOT"/
echo -e "${GREEN}✓ Files copied to $WEB_ROOT${NC}"

echo -e "${BLUE}5. Setting permissions...${NC}"
sudo chown -R www-data:www-data "$WEB_ROOT"/
sudo chmod -R 755 "$WEB_ROOT"/
echo -e "${GREEN}✓ Permissions set${NC}"

echo -e "${BLUE}6. Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration valid${NC}"
    
    echo -e "${BLUE}7. Reloading nginx...${NC}"
    sudo nginx -s reload
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${RED}✗ Nginx configuration error${NC}"
    exit 1
fi

echo -e "${BLUE}8. Testing deployment...${NC}"
# Test if the site is accessible
if curl -s -f "http://jeffreysanford.us" > /dev/null; then
    echo -e "${GREEN}✓ Site is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Site test failed - check logs${NC}"
fi

echo -e "${GREEN}=== Frontend Deployment Complete ===${NC}"
echo -e "${BLUE}Site: http://jeffreysanford.us${NC}"
echo -e "${BLUE}Logs: sudo tail -f /var/log/nginx/access.log${NC}"
```

#### 6. Frontend Testing Commands

**Test the deployed frontend:**

```bash
# Test main page
curl -I "http://jeffreysanford.us"

# Test Angular routing
curl -I "http://jeffreysanford.us/dashboard"

# Test API proxy
curl -X GET "http://jeffreysanford.us/api/health" \
  -H "Accept: application/json"

# Test Go API proxy  
curl -X GET "http://jeffreysanford.us/api-go/health" \
  -H "Accept: application/json"

# Test static assets
curl -I "http://jeffreysanford.us/favicon.ico"

# Performance test
curl -w "DNS: %{time_namelookup}s, Connect: %{time_connect}s, Total: %{time_total}s\n" \
  -o /dev/null -s "http://jeffreysanford.us"
```

**Browser testing checklist:**

```bash
# Open in browser and test:
# - Main page loads
# - Angular routing works
# - API calls to backend work
# - WebSocket connections (if applicable)
# - No console errors
# - Responsive design
```

### NPM Scripts for Frontend Deployment

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "deploy:frontend": "bash ./scripts/deploy-frontend.sh",
    "build:prod": "rm -rf dist && npx nx run craft-web:build --configuration=production",
    "test:frontend": "curl -I http://jeffreysanford.us && curl -I http://jeffreysanford.us/api/health",
    "nginx:test": "sudo nginx -t",
    "nginx:reload": "sudo nginx -t && sudo nginx -s reload",
    "nginx:restart": "sudo systemctl restart nginx",
    "nginx:status": "sudo systemctl status nginx",
    "nginx:logs": "sudo tail -f /var/log/nginx/access.log"
  }
}
```

## Troubleshooting

### If PM2 fails to start services

1. **Check builds exist:**

   ```bash
   ls -la dist/apps/craft-nest/main.js
   ls -la dist/apps/craft-go/main
   ```

2. **Test applications manually:**

   ```bash
   # Test NestJS
   cd dist/apps/craft-nest && node main.js
   
   # Test Go (in another terminal)
   cd dist/apps/craft-go && ./main
   ```

3. **Check PM2 status:**

   ```bash
   pm2 list
   pm2 describe craft-nest-api
   pm2 describe craft-go-api
   ```

4. **View detailed logs:**

   ```bash
   pm2 logs craft-nest-api --lines 50
   pm2 logs craft-go-api --lines 50
   ```

### Common Issues

1. **Port conflicts**: Make sure ports 3000 and 4000 are available
2. **Missing builds**: Run `npm run pm2:build` before starting
3. **Permission issues**: Ensure log directories are writable
4. **Go binary**: Verify the Go app builds correctly for your target platform

### Emergency Fallback

If PM2 continues to have issues, you can run the services directly:

```bash
# Terminal 1: NestJS
cd dist/apps/craft-nest
NODE_ENV=production PORT=3000 HOST=jeffreysanford.us node main.js

# Terminal 2: Go API  
cd dist/apps/craft-go
NODE_ENV=production PORT=4000 HOST=jeffreysanford.us ./main
```

## Useful Commands

```bash
pm2 start ecosystem.config.js    # Start all services
pm2 stop all                     # Stop all services
pm2 restart all                  # Restart all services
pm2 reload all                   # Zero-downtime restart
pm2 delete all                   # Remove all services
pm2 save                         # Save current PM2 setup
pm2 startup                      # Setup auto-start on boot
```

## Environment Variables

The configuration uses these environment variables:

- `NODE_ENV=production`
- `PORT=3000` (NestJS) / `PORT=4000` (Go)
- `HOST=jeffreysanford.us`
- `LOG_LEVEL=info`

You can override these by setting them before starting PM2:

```bash
PORT=3001 npm run pm2:start
```
