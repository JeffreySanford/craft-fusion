#!/bin/bash
# system-optimize.sh - Optimize Fedora system for low-memory deployment
# Accepts --power for aggressive optimization (passed from deploy-all.sh via system-prep.sh)

set -e

# Parse --power argument
POWER_MODE=false
for arg in "$@"; do
  if [ "$arg" == "--power" ]; then
    POWER_MODE=true
  fi
done

echo "=== System Optimization for Low-Memory VPS ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Current System Status ===${NC}"
echo -e "${BLUE}Memory:${NC}"
free -h

echo -e "${BLUE}CPU:${NC}"
cat /proc/cpuinfo | grep -E "(processor|model name)" | head -2

echo -e "${BLUE}Disk:${NC}"
df -h /

echo -e "${BLUE}=== Memory Optimization ===${NC}"

# Check and optimize swap
SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -lt 2000 ] || [ "$POWER_MODE" = true ]; then
    echo -e "${YELLOW}⚠ Swap size is small ($SWAP_SIZE MB), creating additional swap...${NC}"
    
    if [ ! -f /swapfile-extra ]; then
        sudo fallocate -l 2G /swapfile-extra
        sudo chmod 600 /swapfile-extra
        sudo mkswap /swapfile-extra
        sudo swapon /swapfile-extra
        
        # Make permanent
        echo '/swapfile-extra none swap sw 0 0' | sudo tee -a /etc/fstab
        echo -e "${GREEN}✓ Additional 2GB swap created${NC}"
    fi
fi

# Optimize swappiness for server workload
if [ "$POWER_MODE" = true ]; then
  echo -e "${BLUE}Optimizing swappiness (power mode)...${NC}"
  sudo sysctl vm.swappiness=1
  echo 'vm.swappiness=1' | sudo tee -a /etc/sysctl.conf
else
  echo -e "${BLUE}Optimizing swappiness...${NC}"
  sudo sysctl vm.swappiness=10
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
fi

# Optimize file system cache
echo -e "${BLUE}Optimizing file system cache...${NC}"
sudo sysctl vm.vfs_cache_pressure=50
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

echo -e "${BLUE}=== Service Optimization ===${NC}"

# Disable unnecessary services
SERVICES_TO_DISABLE=(
    "bluetooth"
    "cups"
    "avahi-daemon"
    "ModemManager"
    "wpa_supplicant"
)

for service in "${SERVICES_TO_DISABLE[@]}"; do
    if systemctl is-enabled "$service" >/dev/null 2>&1; then
        echo -e "${BLUE}Disabling $service...${NC}"
        sudo systemctl disable "$service"
        sudo systemctl stop "$service" || true
    fi
done

echo -e "${BLUE}=== Package Cleanup ===${NC}"

# Clean package caches
echo -e "${BLUE}Cleaning package caches...${NC}"
sudo dnf clean all
sudo dnf autoremove -y

# Remove development packages if not needed
echo -e "${BLUE}Checking for removable development packages...${NC}"
LARGE_PACKAGES=$(rpm -qa --queryformat '%{SIZE} %{NAME}\n' | sort -nr | head -20)
echo -e "${BLUE}Largest installed packages:${NC}"
echo "$LARGE_PACKAGES" | awk '{printf "  %.1f MB - %s\n", $1/1024/1024, $2}'

echo -e "${BLUE}=== Node.js Optimization ===${NC}"

# Set global Node.js memory limits
echo -e "${BLUE}Setting global Node.js memory limits...${NC}"
cat > /tmp/node-env << 'EOF'
# Node.js memory optimization for low-memory systems
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"
export NX_CACHE_DIRECTORY="/tmp/nx-cache"
export npm_config_maxsockets=1
export npm_config_progress=false
EOF

sudo cp /tmp/node-env /etc/environment.d/50-node-optimization.conf

# Clean npm global cache
echo -e "${BLUE}Cleaning npm caches...${NC}"
npm cache clean --force || true
sudo npm cache clean --force || true

echo -e "${BLUE}=== Nginx Optimization ===${NC}"

# Optimize nginx for low memory
cat > /tmp/nginx-memory.conf << 'EOF'
# Memory optimization for nginx
worker_processes 1;
worker_rlimit_nofile 1024;

events {
    worker_connections 512;
    use epoll;
    multi_accept on;
}

http {
    # Memory efficient settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    keepalive_requests 100;
    
    # Reduce buffer sizes
    client_body_buffer_size 8k;
    client_header_buffer_size 1k;
    client_max_body_size 1m;
    large_client_header_buffers 2 1k;
    
    # Disable access logging for static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        access_log off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

sudo cp /tmp/nginx-memory.conf /etc/nginx/conf.d/memory-optimization.conf

echo -e "${BLUE}=== Create Monitoring Tools ===${NC}"

# Create system resource monitor
cat > /tmp/resource-monitor.sh << 'EOF'
#!/bin/bash
# Simple resource monitoring script

echo "=== System Resources $(date) ==="
echo
echo "Memory Usage:"
free -h | grep -E "(Mem|Swap)"
echo
echo "CPU Load:"
uptime
echo
echo "Disk Usage:"
df -h / | tail -1 | awk '{print "  Root: " $3 " used of " $2 " (" $5 " full)"}'
echo
echo "Top Processes by Memory:"
ps aux --sort=-%mem | head -6 | awk '{printf "  %-15s %5s %5s %s\n", $1, $3, $4, $11}'
echo
echo "PM2 Processes:"
if command -v pm2 >/dev/null 2>&1; then
    sudo -u craft-fusion pm2 list 2>/dev/null || echo "  PM2 not running"
else
    echo "  PM2 not installed"
fi
echo
EOF

sudo cp /tmp/resource-monitor.sh /usr/local/bin/resource-monitor.sh
sudo chmod +x /usr/local/bin/resource-monitor.sh

# Create memory cleanup script
cat > /tmp/memory-cleanup.sh << 'EOF'
#!/bin/bash
# Emergency memory cleanup script

echo "=== Emergency Memory Cleanup ==="

# Clear system caches
echo "Clearing system caches..."
sync
sudo sysctl vm.drop_caches=3

# Restart memory-heavy services
echo "Restarting services..."
if command -v pm2 >/dev/null 2>&1; then
    sudo -u craft-fusion pm2 restart all || true
fi

# Force garbage collection if possible
if pgrep node >/dev/null; then
    echo "Sending cleanup signals to Node.js processes..."
    sudo pkill -USR2 node || true
fi

echo "Cleanup complete. New memory status:"
free -h | grep Mem
EOF

sudo cp /tmp/memory-cleanup.sh /usr/local/bin/memory-cleanup.sh
sudo chmod +x /usr/local/bin/memory-cleanup.sh

echo -e "${BLUE}=== Final System Configuration ===${NC}"

# Configure journal size limit
echo -e "${BLUE}Limiting journal size...${NC}"
sudo mkdir -p /etc/systemd/journald.conf.d
cat > /tmp/journal-size.conf << 'EOF'
[Journal]
SystemMaxUse=100M
RuntimeMaxUse=50M
EOF
sudo cp /tmp/journal-size.conf /etc/systemd/journald.conf.d/size-limit.conf
sudo systemctl restart systemd-journald

# Set up automatic log rotation
echo -e "${BLUE}Setting up log rotation...${NC}"
cat > /tmp/craft-fusion-logs << 'EOF'
/var/log/craft-fusion/*/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        sudo -u craft-fusion pm2 reloadLogs || true
    endscript
}
EOF
sudo cp /tmp/craft-fusion-logs /etc/logrotate.d/craft-fusion

echo -e "${BLUE}=== Optimization Complete ===${NC}"
echo
echo -e "${GREEN}✓ System optimized for low-memory deployment${NC}"
echo
echo -e "${BLUE}Optimizations Applied:${NC}"
echo -e "  ✓ Swap configuration optimized"
echo -e "  ✓ Unnecessary services disabled"
echo -e "  ✓ Package caches cleaned"
echo -e "  ✓ Node.js memory limits set"
echo -e "  ✓ Nginx memory optimized"
echo -e "  ✓ Log rotation configured"
echo -e "  ✓ Monitoring tools installed"
echo
echo -e "${BLUE}Available Tools:${NC}"
echo -e "  Check resources: ${YELLOW}resource-monitor.sh${NC}"
echo -e "  Emergency cleanup: ${YELLOW}memory-cleanup.sh${NC}"
echo -e "  Manual memory cleanup: ${YELLOW}sudo sysctl vm.drop_caches=3${NC}"
echo
echo -e "${BLUE}Updated Memory Status:${NC}"
free -h | grep -E "(Mem|Swap)"

# Cleanup temporary files
rm -f /tmp/node-env /tmp/nginx-memory.conf /tmp/resource-monitor.sh
rm -f /tmp/memory-cleanup.sh /tmp/journal-size.conf /tmp/craft-fusion-logs

echo -e "${GREEN}Ready for low-memory deployment!${NC}"
