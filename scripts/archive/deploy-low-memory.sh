#!/bin/bash
# deploy-low-memory.sh - Memory-optimized deployment for small VPS

set -e

echo "=== Craft Fusion Low-Memory Deployment Started ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Cross-platform path handling
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "${YELLOW}⚠ Running on Windows - some operations may be skipped${NC}"
    IS_WINDOWS=true
    # Configuration for Windows development
    APP_DIR="/var/www/craft-fusion"
    LOG_DIR="/var/log/craft-fusion"
else
    echo -e "${BLUE}Running on Unix-like system${NC}"
    IS_WINDOWS=false
    # Configuration for Linux server
    APP_DIR="/var/www/craft-fusion"
    LOG_DIR="/var/log/craft-fusion"
fi

# Memory optimization settings
export NODE_OPTIONS="--max-old-space-size=512"
export NX_CACHE_DIRECTORY="/tmp/nx-cache"

echo -e "${BLUE}=== Memory Optimization Strategy ===${NC}"
echo -e "${BLUE}Current Memory Status:${NC}"
free -h | grep -E "(Mem|Swap)"

echo -e "${BLUE}=== Phase 1: System Preparation ===${NC}"

# Enable swap if not enough memory
AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')
if [ "$AVAILABLE_MEM" -lt 1000 ]; then
    echo -e "${YELLOW}⚠ Low memory detected ($AVAILABLE_MEM MB), ensuring swap is active...${NC}"
    sudo swapon --show || {
        echo -e "${BLUE}Creating temporary swap file...${NC}"
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
    }
fi

# Stop all unnecessary services temporarily
echo -e "${BLUE}Stopping non-essential services temporarily...${NC}"
sudo systemctl stop httpd || true
sudo systemctl stop apache2 || true
pm2 stop all || true
pm2 delete all || true

# Clear system caches
echo -e "${BLUE}Clearing system caches...${NC}"
sudo sync
sudo sysctl vm.drop_caches=1

echo -e "${BLUE}=== Phase 2: Sequential Build Process ===${NC}"

# Clean old builds
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .nx/cache/
rm -rf /tmp/nx-cache/

# Install dependencies with memory constraints
echo -e "${BLUE}Installing dependencies with memory limits...${NC}"
npm install --no-optional --no-audit --prefer-offline --progress=false --maxsockets=1

echo -e "${BLUE}=== Phase 3: Build Applications (Sequential) ===${NC}"

# Build Go first (lightweight)
echo -e "${BLUE}Building Go application...${NC}"
NODE_OPTIONS="--max-old-space-size=256" npx nx run craft-go:build:production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Go build successful${NC}"
else
    echo -e "${RED}✗ Go build failed${NC}"
    exit 1
fi

# Clear memory before next build
sync && sysctl vm.drop_caches=1 >/dev/null 2>&1 || true

# Build NestJS with memory constraints
echo -e "${BLUE}Building NestJS application...${NC}"
NODE_OPTIONS="--max-old-space-size=512" npx nx run craft-nest:build:production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ NestJS build successful${NC}"
else
    echo -e "${RED}✗ NestJS build failed${NC}"
    exit 1
fi

# Clear memory before frontend build
sync && sysctl vm.drop_caches=1 >/dev/null 2>&1 || true

# Build Angular with strict memory limits
echo -e "${BLUE}Building Angular application (this may take longer)...${NC}"
NODE_OPTIONS="--max-old-space-size=768" npx nx run craft-web:build:production --progress=false
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Angular build successful${NC}"
else
    echo -e "${RED}✗ Angular build failed${NC}"
    exit 1
fi

echo -e "${BLUE}=== Phase 4: Minimal Deployment ===${NC}"

# Create directories
sudo mkdir -p "$APP_DIR"
sudo mkdir -p "$LOG_DIR"/{craft-nest,craft-go}

# Copy only essential files
echo -e "${BLUE}Copying essential files only...${NC}"
sudo cp -r dist/ "$APP_DIR"/
sudo cp ecosystem.config.js "$APP_DIR"/
sudo cp package.json "$APP_DIR"/

# Create minimal package.json for production
cat > /tmp/production-package.json << 'EOF'
{
  "name": "craft-fusion-production",
  "version": "1.0.0",
  "scripts": {
    "start:nest": "node dist/apps/craft-nest/src/main.js",
    "start:go": "./dist/apps/craft-go/main"
  },
  "dependencies": {
    "@nestjs/common": "*",
    "@nestjs/core": "*",
    "@nestjs/platform-express": "*",
    "@nestjs/platform-socket.io": "*",
    "@nestjs/websockets": "*",
    "rxjs": "*",
    "reflect-metadata": "*",
    "socket.io": "*"
  }
}
EOF

sudo cp /tmp/production-package.json "$APP_DIR"/package.json

# Install only production dependencies
echo -e "${BLUE}Installing minimal production dependencies...${NC}"
cd "$APP_DIR"
sudo NODE_OPTIONS="--max-old-space-size=256" npm install --production --no-optional --no-audit

# Set permissions
echo -e "${BLUE}Setting permissions...${NC}"
if ! id "craft-fusion" &>/dev/null; then
    sudo useradd -r -s /bin/false craft-fusion
fi
sudo chown -R craft-fusion:craft-fusion "$APP_DIR"
sudo chown -R craft-fusion:craft-fusion "$LOG_DIR"
sudo chmod +x "$APP_DIR/dist/apps/craft-go/main"

echo -e "${BLUE}=== Phase 5: Memory-Optimized PM2 Configuration ===${NC}"

# Create memory-optimized ecosystem config
cat > /tmp/ecosystem-optimized.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'craft-nest-api',
      script: 'dist/apps/craft-nest/src/main.js',
      cwd: '/var/www/craft-fusion',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M',
      node_args: '--max-old-space-size=256',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: '/var/log/craft-fusion/craft-nest/combined.log',
      out_file: '/var/log/craft-fusion/craft-nest/out.log',
      error_file: '/var/log/craft-fusion/craft-nest/error.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'craft-go-api',
      script: 'dist/apps/craft-go/main',
      cwd: '/var/www/craft-fusion',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '100M',
      env: {
        PORT: 4000,
        GO_ENV: 'production'
      },
      log_file: '/var/log/craft-fusion/craft-go/combined.log',
      out_file: '/var/log/craft-fusion/craft-go/out.log',
      error_file: '/var/log/craft-fusion/craft-go/error.log',
      merge_logs: true,
      time: true
    }
  ]
};
EOF

sudo cp /tmp/ecosystem-optimized.config.js "$APP_DIR"/ecosystem.config.js

# Start services with memory monitoring
echo -e "${BLUE}Starting optimized services...${NC}"
sudo -u craft-fusion pm2 start "$APP_DIR"/ecosystem.config.js
sudo -u craft-fusion pm2 save

# Setup nginx for static files (reduces Node.js memory usage)
echo -e "${BLUE}=== Phase 6: Nginx Static File Optimization ===${NC}"

# Deploy Angular files to nginx
sudo mkdir -p /var/www/jeffreysanford.us
sudo cp -r "$APP_DIR/dist/apps/craft-web/"* /var/www/jeffreysanford.us/
sudo chown -R nginx:nginx /var/www/jeffreysanford.us

# Create memory-optimized nginx config
cat > /tmp/nginx-optimized.conf << 'EOF'
server {
    listen 80;
    server_name jeffreysanford.us www.jeffreysanford.us;
    
    # Static files served directly by nginx (saves Node.js memory)
    root /var/www/jeffreysanford.us;
    index index.html;
    
    # Gzip compression to reduce bandwidth
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Angular routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # NestJS API (memory-optimized proxy)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
    }
    
    # Go API
    location /go-api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
    }
    
    # WebSocket (if needed)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo cp /tmp/nginx-optimized.conf /etc/nginx/conf.d/craft-fusion.conf
sudo nginx -t && sudo systemctl reload nginx

echo -e "${BLUE}=== Phase 7: System Monitoring Setup ===${NC}"

# Create memory monitoring script
cat > /tmp/memory-monitor.sh << 'EOF'
#!/bin/bash
# Monitor memory usage and restart services if needed

MEMORY_THRESHOLD=80  # Restart if memory usage > 80%
LOG_FILE="/var/log/craft-fusion/memory-monitor.log"

while true; do
    MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    
    if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
        echo "$(date): High memory usage detected: ${MEMORY_USAGE}%" >> "$LOG_FILE"
        
        # Restart services to free memory
        pm2 restart all
        
        # Clear caches
        sync
        echo 1 > /proc/sys/vm/drop_caches
        
        echo "$(date): Services restarted and caches cleared" >> "$LOG_FILE"
        
        # Wait before checking again
        sleep 300
    else
        sleep 60
    fi
done
EOF

sudo cp /tmp/memory-monitor.sh /usr/local/bin/memory-monitor.sh
sudo chmod +x /usr/local/bin/memory-monitor.sh

# Create systemd service for memory monitoring
cat > /tmp/memory-monitor.service << 'EOF'
[Unit]
Description=Memory Monitor for Craft Fusion
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/memory-monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo cp /tmp/memory-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable memory-monitor
sudo systemctl start memory-monitor

echo -e "${BLUE}=== Phase 8: Final Tests ===${NC}"

# Wait for services to start
sleep 10

# Test services
echo -e "${BLUE}Testing services...${NC}"

# Test NestJS
NEST_STATUS=$(curl -s -f -w "%{http_code}" -o /dev/null "http://localhost:3000/api/health" 2>/dev/null || echo "000")
echo -e "  NestJS API: $([ "$NEST_STATUS" -eq 200 ] && echo -e "${GREEN}✓ $NEST_STATUS${NC}" || echo -e "${YELLOW}⚠ $NEST_STATUS${NC}")"

# Test Go
GO_STATUS=$(curl -s -f -w "%{http_code}" -o /dev/null "http://localhost:4000/health" 2>/dev/null || echo "000")
echo -e "  Go API: $([ "$GO_STATUS" -eq 200 ] && echo -e "${GREEN}✓ $GO_STATUS${NC}" || echo -e "${YELLOW}⚠ $GO_STATUS${NC}")"

# Test main site
SITE_STATUS=$(curl -s -f -w "%{http_code}" -o /dev/null "http://jeffreysanford.us" 2>/dev/null || echo "000")
echo -e "  Main Site: $([ "$SITE_STATUS" -eq 200 ] && echo -e "${GREEN}✓ $SITE_STATUS${NC}" || echo -e "${YELLOW}⚠ $SITE_STATUS${NC}")"

echo -e "${BLUE}=== Final Memory Status ===${NC}"
free -h | grep -E "(Mem|Swap)"

echo -e "${BLUE}PM2 Process Status:${NC}"
sudo -u craft-fusion pm2 list

echo -e "${GREEN}=== Low-Memory Deployment Complete ===${NC}"
echo
echo -e "${BLUE}🎉 Your Craft Fusion application is optimized for low memory!${NC}"
echo
echo -e "${BLUE}Memory Optimizations Applied:${NC}"
echo -e "  ✓ Sequential builds (one at a time)"
echo -e "  ✓ Memory-limited Node.js processes"
echo -e "  ✓ Minimal production dependencies"
echo -e "  ✓ Static files served by nginx"
echo -e "  ✓ Automatic memory monitoring"
echo -e "  ✓ Process restart on high memory usage"
echo
echo -e "${BLUE}Monitoring Commands:${NC}"
echo -e "  Memory usage: ${YELLOW}free -h${NC}"
echo -e "  PM2 status: ${YELLOW}sudo -u craft-fusion pm2 list${NC}"
echo -e "  Memory monitor log: ${YELLOW}sudo tail -f /var/log/craft-fusion/memory-monitor.log${NC}"
echo -e "  Restart services: ${YELLOW}sudo -u craft-fusion pm2 restart all${NC}"

# Cleanup temporary files
rm -f /tmp/production-package.json /tmp/ecosystem-optimized.config.js /tmp/nginx-optimized.conf
rm -f /tmp/memory-monitor.sh /tmp/memory-monitor.service

echo -e "${BLUE}✓ Cleanup complete${NC}"
