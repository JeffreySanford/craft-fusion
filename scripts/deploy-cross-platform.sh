#!/bin/bash
# deploy-cross-platform.sh - Cross-platform deployment script for Windows dev to Linux server workflow

set -e

echo "=== Craft Fusion Cross-Platform Deployment Started ==="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
MEMORY_OPTIMIZED=${1:-"true"}
DEPLOYMENT_TYPE=${2:-"full"}  # full, frontend, backend, low-memory

# Cross-platform path handling
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "${BLUE}Detected Windows development environment${NC}"
    IS_WINDOWS=true
    # Convert Windows paths to Unix-style for scripts
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -W 2>/dev/null || pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -W 2>/dev/null || pwd)"
else
    echo -e "${BLUE}Detected Unix-like environment${NC}"
    IS_WINDOWS=false
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

# Normalize paths to Unix style
SCRIPT_DIR=$(echo "$SCRIPT_DIR" | sed 's|\\|/|g')
PROJECT_ROOT=$(echo "$PROJECT_ROOT" | sed 's|\\|/|g')

echo -e "${BLUE}Script directory: $SCRIPT_DIR${NC}"
echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"

# Change to project root
cd "$PROJECT_ROOT"

# Make scripts executable (important for cross-platform)
find scripts -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || {
    echo -e "${YELLOW}Note: chmod might not work on Windows - scripts should still execute${NC}"
}

echo -e "${BLUE}=== Environment Detection ===${NC}"

# Check available memory if on Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    AVAILABLE_MEM=$(free -m | awk 'NR==2{print $7}')
    TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
    echo -e "${BLUE}Available memory: ${AVAILABLE_MEM}MB / ${TOTAL_MEM}MB${NC}"
    
    if [ "$AVAILABLE_MEM" -lt 1000 ]; then
        echo -e "${YELLOW}Low memory detected - enabling memory optimizations${NC}"
        MEMORY_OPTIMIZED="true"
    fi
else
    echo -e "${BLUE}Non-Linux environment detected - assuming sufficient memory${NC}"
fi

# Function to run cross-platform commands
run_command() {
    local cmd="$1"
    local description="$2"
    
    echo -e "${BLUE}$description${NC}"
    
    if $IS_WINDOWS; then
        # On Windows, ensure we use bash for script execution
        if [[ "$cmd" == scripts/* ]]; then
            bash "$cmd"
        else
            eval "$cmd"
        fi
    else
        eval "$cmd"
    fi
}

# Function to check if we're running this script on the server or from dev machine
detect_deployment_context() {
    if [ -f "/etc/redhat-release" ] || [ -f "/etc/fedora-release" ]; then
        echo "server"
    elif [ -d "/var/www" ] && [ -w "/var/www" ]; then
        echo "server"
    else
        echo "development"
    fi
}

DEPLOYMENT_CONTEXT=$(detect_deployment_context)
echo -e "${BLUE}Deployment context: $DEPLOYMENT_CONTEXT${NC}"

if [ "$DEPLOYMENT_CONTEXT" = "development" ]; then
    echo -e "${YELLOW}⚠ This script should typically be run on the production server${NC}"
    echo -e "${YELLOW}⚠ Make sure to transfer files to server before running deployment scripts${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Deployment cancelled${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}=== Phase 1: Dependency Management ===${NC}"

# Clear problematic caches
echo -e "${BLUE}Clearing caches...${NC}"
rm -rf node_modules/.cache/nx 2>/dev/null || true
rm -rf .nx/cache 2>/dev/null || true

if [ "$MEMORY_OPTIMIZED" = "true" ]; then
    # Memory-optimized dependency installation
    echo -e "${BLUE}Installing dependencies with memory optimizations...${NC}"
    export NODE_OPTIONS="--max-old-space-size=512"
    npm install --no-optional --no-audit --prefer-offline --progress=false --maxsockets=1
else
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install --no-optional --no-audit --prefer-offline --progress=false
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Dependencies installation failed${NC}"
    exit 1
fi

echo -e "${BLUE}=== Phase 2: Build Process ===${NC}"

case "$DEPLOYMENT_TYPE" in
    "low-memory")
        echo -e "${BLUE}Running low-memory optimized deployment...${NC}"
        if [ -f "scripts/deploy-low-memory.sh" ]; then
            run_command "scripts/deploy-low-memory.sh" "Executing low-memory deployment"
        else
            echo -e "${RED}✗ Low-memory deployment script not found${NC}"
            exit 1
        fi
        ;;
    "frontend")
        echo -e "${BLUE}Running frontend-only deployment...${NC}"
        if [ -f "scripts/deploy-frontend.sh" ]; then
            run_command "scripts/deploy-frontend.sh" "Executing frontend deployment"
        else
            echo -e "${RED}✗ Frontend deployment script not found${NC}"
            exit 1
        fi
        ;;
    "backend")
        echo -e "${BLUE}Running backend-only deployment...${NC}"
        if [ -f "scripts/deploy-backend.sh" ]; then
            run_command "scripts/deploy-backend.sh" "Executing backend deployment"
        else
            echo -e "${RED}✗ Backend deployment script not found${NC}"
            exit 1
        fi
        ;;
    "full"|*)
        if [ "$MEMORY_OPTIMIZED" = "true" ]; then
            echo -e "${BLUE}Running memory-optimized full deployment...${NC}"
            
            # Sequential builds to conserve memory
            echo -e "${BLUE}Building Go application...${NC}"
            NODE_OPTIONS="--max-old-space-size=256" npx nx run craft-go:build:production
            if [ $? -ne 0 ]; then
                echo -e "${RED}✗ Go build failed${NC}"
                exit 1
            fi
            
            # Clear memory
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sync && sudo sysctl vm.drop_caches=1 >/dev/null 2>&1 || true
            fi
            
            echo -e "${BLUE}Building NestJS application...${NC}"
            NODE_OPTIONS="--max-old-space-size=512" npx nx run craft-nest:build:production
            if [ $? -ne 0 ]; then
                echo -e "${RED}✗ NestJS build failed${NC}"
                exit 1
            fi
            
            # Clear memory again
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sync && sudo sysctl vm.drop_caches=1 >/dev/null 2>&1 || true
            fi
            
            echo -e "${BLUE}Building Angular application...${NC}"
            NODE_OPTIONS="--max-old-space-size=768" npx nx run craft-web:build:production --progress=false
            if [ $? -ne 0 ]; then
                echo -e "${RED}✗ Angular build failed${NC}"
                exit 1
            fi
            
            # Deploy with existing scripts
            if [ -f "scripts/deploy-backend.sh" ]; then
                run_command "scripts/deploy-backend.sh" "Deploying backend services"
            fi
            
            if [ -f "scripts/deploy-frontend.sh" ]; then
                run_command "scripts/deploy-frontend.sh" "Deploying frontend"
            fi
        else
            echo -e "${BLUE}Running standard full deployment...${NC}"
            if [ -f "scripts/deploy-all.sh" ]; then
                run_command "scripts/deploy-all.sh" "Executing full deployment"
            else
                echo -e "${YELLOW}⚠ Full deployment script not found, running individual scripts${NC}"
                
                if [ -f "scripts/deploy-backend.sh" ]; then
                    run_command "scripts/deploy-backend.sh" "Deploying backend services"
                fi
                
                if [ -f "scripts/deploy-frontend.sh" ]; then
                    run_command "scripts/deploy-frontend.sh" "Deploying frontend"
                fi
            fi
        fi
        ;;
esac

echo -e "${BLUE}=== Phase 3: Post-Deployment Verification ===${NC}"

# Only run server-specific tests if we're on the server
if [ "$DEPLOYMENT_CONTEXT" = "server" ]; then
    echo -e "${BLUE}Running server verification tests...${NC}"
    
    # Wait for services to start
    sleep 5
    
    # Test endpoints
    echo -e "${BLUE}Testing endpoints...${NC}"
    
    # Test main site
    SITE_STATUS=$(curl -s -f -w "%{http_code}" -o /dev/null "http://localhost" 2>/dev/null || echo "000")
    echo -e "  Main Site: $([ "$SITE_STATUS" -eq 200 ] && echo -e "${GREEN}✓ $SITE_STATUS${NC}" || echo -e "${YELLOW}⚠ $SITE_STATUS${NC}")"
    
    # Test APIs if they exist
    API_NEST_STATUS=$(curl -s -f -w "%{http_code}" -o /dev/null "http://localhost:3000/api/health" 2>/dev/null || echo "000")
    echo -e "  NestJS API: $([ "$API_NEST_STATUS" -eq 200 ] && echo -e "${GREEN}✓ $API_NEST_STATUS${NC}" || echo -e "${YELLOW}⚠ $API_NEST_STATUS${NC}")"
    
    API_GO_STATUS=$(curl -s -f -w "%{http_code}" -o /dev/null "http://localhost:4000/health" 2>/dev/null || echo "000")
    echo -e "  Go API: $([ "$API_GO_STATUS" -eq 200 ] && echo -e "${GREEN}✓ $API_GO_STATUS${NC}" || echo -e "${YELLOW}⚠ $API_GO_STATUS${NC}")"
    
    # Show system status
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "${BLUE}System Status:${NC}"
        free -h | grep -E "(Mem|Swap)" || true
        
        if command -v pm2 &> /dev/null; then
            echo -e "${BLUE}PM2 Status:${NC}"
            pm2 list 2>/dev/null || true
        fi
    fi
else
    echo -e "${YELLOW}Skipping server-specific tests (not running on server)${NC}"
fi

echo -e "${GREEN}=== Cross-Platform Deployment Complete ===${NC}"
echo
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Environment: $([ "$IS_WINDOWS" = "true" ] && echo "Windows development" || echo "Unix-like")"
echo -e "  Memory Optimized: $MEMORY_OPTIMIZED"
echo -e "  Deployment Type: $DEPLOYMENT_TYPE"
echo -e "  Context: $DEPLOYMENT_CONTEXT"
echo
echo -e "${BLUE}Next Steps:${NC}"
if [ "$DEPLOYMENT_CONTEXT" = "development" ]; then
    echo -e "  1. Transfer built files to production server"
    echo -e "  2. Run this script on the production server with same parameters"
    echo -e "  3. Set up SSL/WSS if needed: ${YELLOW}bash scripts/wss-setup.sh${NC}"
else
    echo -e "  1. Verify all endpoints are working correctly"
    echo -e "  2. Set up SSL/WSS if needed: ${YELLOW}bash scripts/wss-setup.sh${NC}"
    echo -e "  3. Monitor system resources: ${YELLOW}free -h && pm2 list${NC}"
fi

echo -e "${BLUE}✓ Deployment script completed successfully${NC}"
