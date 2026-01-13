#!/bin/bash
# scripts/system-optimize.sh - Optimize Fedora server for Nx/Angular builds

BOLD='\033[1m'
NC='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'

echo -e "${BOLD}${BLUE}=== Craft Fusion: System Optimization ===${NC}"

# 1. Swap Check & Creation
echo -e "${YELLOW}Checking Swap space...${NC}"
SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -lt 1024 ]; then
    echo -e "${YELLOW}Insufficient swap ($SWAP_SIZE MB). Creating a 2GB swap file...${NC}"
    if [ "$(id -u)" -ne 0 ]; then
        echo -e "${RED}Error: Swap creation requires sudo.${NC}"
        echo "Please run: sudo $0"
        exit 1
    fi
    
    # Create 2GB swap file
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Make persistent
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
    fi
    echo -e "${GREEN}✓ 2GB Swap file created and activated.${NC}"
else
    echo -e "${GREEN}✓ Swap space is sufficient ($SWAP_SIZE MB).${NC}"
fi

# 2. Increase File Watchers (Important for Nx/Vite)
echo -e "${YELLOW}Optimizing file watchers (fs.inotify.max_user_watches)...${NC}"
if [ "$(id -u)" -eq 0 ]; then
    echo 524288 > /proc/sys/fs/inotify/max_user_watches
    echo "fs.inotify.max_user_watches=524288" > /etc/sysctl.d/99-nx-watches.conf
    sysctl -p /etc/sysctl.d/99-nx-watches.conf > /dev/null 2>&1
    echo -e "${GREEN}✓ File watchers increased to 524,288.${NC}"
else
    echo -e "${BLUE}Skipping file watcher optimization (requires root).${NC}"
fi

# 3. Memory Cleanup
if [ -f "scripts/memory-cleanup.sh" ]; then
    bash scripts/memory-cleanup.sh
fi

echo -e "${GREEN}${BOLD}✓ System optimization complete!${NC}"
