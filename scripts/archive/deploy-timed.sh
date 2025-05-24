#!/bin/bash
# deploy-timed.sh - Enhanced deployment script with real-time progress tracking and timers

set -e

# Colors and formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Progress bar characters
PROGRESS_CHAR="█"
EMPTY_CHAR="░"

# Estimated times (in seconds) - based on 1-core 2GB VPS
declare -A STEP_ESTIMATES=(
    ["cleanup"]=30
    ["dependencies"]=180
    ["go_build"]=15
    ["nest_build"]=45
    ["angular_build"]=300
    ["backend_deploy"]=60
    ["frontend_deploy"]=45
    ["ssl_setup"]=120
    ["testing"]=30
    ["final_checks"]=15
)

# Step descriptions
declare -A STEP_DESCRIPTIONS=(
    ["cleanup"]="Cleaning previous builds and caches"
    ["dependencies"]="Installing Node.js dependencies"
    ["go_build"]="Building Go microservice"
    ["nest_build"]="Building NestJS API"
    ["angular_build"]="Building Angular frontend (memory intensive)"
    ["backend_deploy"]="Deploying backend services"
    ["frontend_deploy"]="Deploying frontend assets"
    ["ssl_setup"]="Setting up SSL/WSS (optional)"
    ["testing"]="Running endpoint tests"
    ["final_checks"]="Final system verification"
)

# Progress tracking
TOTAL_STEPS=9  # Excluding SSL as it's optional
CURRENT_STEP=0
DEPLOYMENT_START_TIME=$(date +%s)

# Functions
print_header() {
    clear
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║               🚀 CRAFT FUSION DEPLOYMENT                     ║${NC}"
    echo -e "${BOLD}${CYAN}║                   Real-Time Progress Tracker                 ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

print_overall_progress() {
    local current=$1
    local total=$2
    local percent=$((current * 100 / total))
    local filled=$((current * 50 / total))
    local empty=$((50 - filled))
    
    printf "${BOLD}${BLUE}Overall Progress: ${NC}"
    printf "${GREEN}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${YELLOW}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%% (%d/%d)${NC}\n" "$percent" "$current" "$total"
}

print_step_timer() {
    local step_name=$1
    local start_time=$2
    local estimated_duration=${STEP_ESTIMATES[$step_name]}
    local description=${STEP_DESCRIPTIONS[$step_name]}
    
    echo -e "\n${BOLD}${PURPLE}Current Step: ${description}${NC}"
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        local remaining=$((estimated_duration - elapsed))
        
        if [ $remaining -lt 0 ]; then remaining=0; fi
        
        local percent=$((elapsed * 100 / estimated_duration))
        if [ $percent -gt 100 ]; then percent=100; fi
        
        local filled=$((elapsed * 40 / estimated_duration))
        if [ $filled -gt 40 ]; then filled=40; fi
        local empty=$((40 - filled))
        
        printf "\r${CYAN}Step Progress: ${NC}"
        printf "${GREEN}"
        for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
        printf "${NC}${YELLOW}"
        for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
        printf "${NC}"
        
        printf " ${BOLD}%02d:%02d${NC}" $((elapsed / 60)) $((elapsed % 60))
        if [ $remaining -gt 0 ]; then
            printf " / ${BOLD}%02d:%02d${NC} (${BOLD}-%02d:%02d${NC})" \
                $((estimated_duration / 60)) $((estimated_duration % 60)) \
                $((remaining / 60)) $((remaining % 60))
        else
            printf " / ${BOLD}%02d:%02d${NC} ${YELLOW}(overtime)${NC}" \
                $((estimated_duration / 60)) $((estimated_duration % 60))
        fi
        
        sleep 1
    done
}

run_step_with_timer() {
    local step_name=$1
    local command=$2
    local step_start_time=$(date +%s)
    
    CURRENT_STEP=$((CURRENT_STEP + 1))
    
    print_header
    print_overall_progress $CURRENT_STEP $TOTAL_STEPS
    
    echo -e "\n${BOLD}${BLUE}═══ Step $CURRENT_STEP of $TOTAL_STEPS ═══${NC}"
    echo -e "${CYAN}📋 ${STEP_DESCRIPTIONS[$step_name]}${NC}"
    echo -e "${YELLOW}⏱️  Estimated duration: ${STEP_ESTIMATES[$step_name]} seconds${NC}"
    
    # Start background timer
    print_step_timer "$step_name" "$step_start_time" &
    local timer_pid=$!
    
    # Run the actual command
    echo -e "\n${BLUE}🔧 Executing command...${NC}"
    if eval "$command"; then
        kill $timer_pid 2>/dev/null || true
        wait $timer_pid 2>/dev/null || true
        
        local step_end_time=$(date +%s)
        local actual_duration=$((step_end_time - step_start_time))
        
        printf "\r\033[K${GREEN}✅ Step completed in %02d:%02d${NC}\n" \
            $((actual_duration / 60)) $((actual_duration % 60))
        
        sleep 2
        return 0
    else
        kill $timer_pid 2>/dev/null || true
        wait $timer_pid 2>/dev/null || true
        
        printf "\r\033[K${RED}❌ Step failed${NC}\n"
        sleep 2
        return 1
    fi
}

calculate_total_time() {
    local total=0
    for step in cleanup dependencies go_build nest_build angular_build backend_deploy frontend_deploy testing final_checks; do
        total=$((total + STEP_ESTIMATES[$step]))
    done
    echo $total
}

print_deployment_summary() {
    local end_time=$(date +%s)
    local total_duration=$((end_time - DEPLOYMENT_START_TIME))
    local estimated_total=$(calculate_total_time)
    
    clear
    echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${GREEN}║                🎉 DEPLOYMENT COMPLETE! 🎉                   ║${NC}"
    echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BOLD}${BLUE}📊 Deployment Statistics:${NC}"
    echo -e "   ⏱️  Total time: ${BOLD}%02d:%02d${NC}" $((total_duration / 60)) $((total_duration % 60))
    echo -e "   📈 Estimated:  ${BOLD}%02d:%02d${NC}" $((estimated_total / 60)) $((estimated_total % 60))
    
    if [ $total_duration -lt $estimated_total ]; then
        local saved=$((estimated_total - total_duration))
        echo -e "   🚀 Finished ${GREEN}%02d:%02d faster${NC} than estimated!" $((saved / 60)) $((saved % 60))
    else
        local over=$((total_duration - estimated_total))
        echo -e "   🐌 Took ${YELLOW}%02d:%02d longer${NC} than estimated" $((over / 60)) $((over % 60))
    fi
    echo
}

# Memory optimization settings
export NODE_OPTIONS="--max-old-space-size=512"
export NX_CACHE_DIRECTORY="/tmp/nx-cache"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Ensure scripts are executable
chmod +x scripts/*.sh

print_header
echo -e "${BOLD}${BLUE}🔍 Pre-deployment System Check${NC}"
echo -e "${CYAN}📁 Project root: $PROJECT_ROOT${NC}"

# Memory check
AVAILABLE_MEM=$(free -m 2>/dev/null | awk 'NR==2{print $7}' || echo "2000")
echo -e "${CYAN}💾 Available memory: ${AVAILABLE_MEM}MB${NC}"

if [ "$AVAILABLE_MEM" -lt 1000 ]; then
    echo -e "${YELLOW}⚠️  Low memory detected - enabling aggressive optimization${NC}"
fi

echo -e "\n${BOLD}${BLUE}📋 Deployment Plan:${NC}"
local total_est=$(calculate_total_time)
echo -e "${CYAN}📅 Estimated total time: ${BOLD}%02d:%02d${NC}" $((total_est / 60)) $((total_est % 60))
echo -e "${CYAN}🏁 Expected completion: $(date -d "+${total_est} seconds" '+%H:%M:%S')${NC}"

echo -e "\n${YELLOW}Press Enter to start deployment, or Ctrl+C to cancel...${NC}"
read -r

# Execute deployment steps
run_step_with_timer "cleanup" "./scripts/clean-build.sh && sudo sync && sudo sysctl vm.drop_caches=1 2>/dev/null || true"

run_step_with_timer "dependencies" "npm install --no-optional --no-audit --prefer-offline --progress=false --maxsockets=1"

run_step_with_timer "go_build" "npx nx build craft-go --configuration=production"

run_step_with_timer "nest_build" "npx nx build craft-nest --configuration=production"

run_step_with_timer "angular_build" "npx nx build craft-web --configuration=production --progress=false"

run_step_with_timer "backend_deploy" "./scripts/deploy-backend.sh"

run_step_with_timer "frontend_deploy" "./scripts/deploy-frontend.sh"

# Optional SSL setup
echo -e "\n${BOLD}${BLUE}🔐 SSL/WSS Setup${NC}"
read -p "Do you want to set up SSL/WSS? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    TOTAL_STEPS=$((TOTAL_STEPS + 1))
    run_step_with_timer "ssl_setup" "./scripts/ssl-setup.sh && ./scripts/wss-setup.sh"
fi

run_step_with_timer "testing" "curl -s -f http://jeffreysanford.us >/dev/null && curl -s -f http://jeffreysanford.us/api/health >/dev/null"

run_step_with_timer "final_checks" "systemctl is-active --quiet nginx && pm2 list >/dev/null"

print_deployment_summary

echo -e "${BOLD}${GREEN}🌐 Your application is live at: https://jeffreysanford.us${NC}"
echo -e "${BOLD}${BLUE}📡 API endpoints: /api/* and /go-api/*${NC}"
echo -e "${BOLD}${PURPLE}🔌 WebSocket: wss://jeffreysanford.us${NC}"
echo
echo -e "${CYAN}For real-time monitoring, run: ${YELLOW}htop${NC} or ${YELLOW}sudo -u craft-fusion pm2 monit${NC}"
