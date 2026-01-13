#!/bin/bash
# scripts/memory-cleanup.sh - Extreme memory cleanup for low-RAM Fedora servers (2GB)

BOLD='\033[1m'
NC='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'

echo -e "${BOLD}${BLUE}=== Craft Fusion: High-Impact Memory Cleanup ===${NC}"

# 1. Kill all Node/Nx processes (including hidden ones)
echo -e "${YELLOW}Stopping all Node.js and Nx processes...${NC}"
pkill -9 -f node 2>/dev/null || true
pkill -9 -f nx-daemon 2>/dev/null || true
pkill -9 -f "nx-daemon" 2>/dev/null || true
pkill -9 -f "nx" 2>/dev/null || true

# 2. Stop PM2 apps to free up runtime RAM
if command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping PM2 processes...${NC}"
    sudo -u jeffrey pm2 stop all 2>/dev/null || pm2 stop all 2>/dev/null || true
    sudo -u jeffrey pm2 kill 2>/dev/null || pm2 kill 2>/dev/null || true
fi

# 3. Clear System Caches (Requires Sudo)
echo -e "${YELLOW}Clearing Linux kernel pagecache, dentries, and inodes...${NC}"
sync
if [ "$(id -u)" -eq 0 ]; then
    echo 3 > /proc/sys/vm/drop_caches
else
    echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null
fi

# 4. Swap Reset (Flushes swap back to RAM, then reenables)
# This is useful if swap is highly fragmented or filled with stale data.
if [ "$(id -u)" -eq 0 ] || sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}Cycling Swap to flush fragmented memory...${NC}"
    sudo swapoff -a && sudo swapon -a
else
    echo -e "${BLUE}Skipping swap reset (requires sudo without password).${NC}"
fi

# 5. DNF Cleanup (Fedora specific)
if command -v dnf >/dev/null 2>&1; then
    echo -e "${YELLOW}Cleaning DNF metadata and cache...${NC}"
    sudo dnf clean all > /dev/null
fi

# 6. Final Status
echo -e "${GREEN}${BOLD}✓ Memory cleanup complete!${NC}"
echo -e "${BLUE}Current System State:${NC}"
free -h

echo -e "\n${YELLOW}PRO TIP: If you still see 'OOM' (Out of Memory) during Angular builds,${NC}"
echo -e "${YELLOW}         consider using the --power flag in deploy-all.sh to allow higher heap usage.${NC}"
