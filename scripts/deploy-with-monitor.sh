#!/bin/bash
# deploy-with-monitor.sh - Run deployment with split-screen memory monitoring

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}🚀 Craft Fusion Deployment with Memory Monitoring${NC}"
echo -e "${BLUE}This will start the deployment in one terminal and memory monitoring in another.${NC}"
echo

# Check if tmux is available for split screen
if command -v tmux >/dev/null 2>&1; then
    echo -e "${GREEN}✓ tmux detected - Will use split-screen monitoring${NC}"
    echo -e "${YELLOW}Instructions:${NC}"
    echo -e "  • Left panel: Deployment progress with timers"
    echo -e "  • Right panel: Real-time memory monitoring"
    echo -e "  • Use ${BOLD}Ctrl+B then arrow keys${NC} to switch panels"
    echo -e "  • Use ${BOLD}Ctrl+B then x${NC} to close a panel"
    echo -e "  • Use ${BOLD}Ctrl+B then d${NC} to detach (deployment continues)"
    echo
    
    read -p "Start deployment with split-screen monitoring? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Make scripts executable
        chmod +x scripts/deploy-timed.sh scripts/memory-monitor.sh
        
        # Start tmux session with split screen
        tmux new-session -d -s deployment-monitor
        tmux split-window -h -t deployment-monitor
        
        # Left panel: deployment
        tmux send-keys -t deployment-monitor:0.0 'cd /home/jeffrey/repos/craft-fusion && ./scripts/deploy-timed.sh' Enter
        
        # Right panel: memory monitor
        tmux send-keys -t deployment-monitor:0.1 'cd /home/jeffrey/repos/craft-fusion && ./scripts/memory-monitor.sh' Enter
        
        # Attach to session
        tmux attach-session -t deployment-monitor
        
        exit 0
    fi
fi

echo -e "${YELLOW}Manual setup instructions:${NC}"
echo -e "1. ${BOLD}In this terminal:${NC} Run the deployment"
echo -e "   ./scripts/deploy-timed.sh"
echo
echo -e "2. ${BOLD}In a second terminal:${NC} Monitor memory"
echo -e "   ssh jeffrey@jeffreysanford.us"
echo -e "   cd /home/jeffrey/repos/craft-fusion"
echo -e "   ./scripts/memory-monitor.sh"
echo
echo -e "3. ${BOLD}Or use htop:${NC} Simple system monitor"
echo -e "   htop"
echo

read -p "Start deployment now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    chmod +x scripts/deploy-timed.sh
    ./scripts/deploy-timed.sh
fi
