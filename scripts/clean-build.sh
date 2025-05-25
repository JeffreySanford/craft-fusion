#!/bin/bash
# clean-build.sh - Clean build script for development and CI/CD

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Clean Build Started ==="

# --- System Prep: Clean up lingering processes and free memory ---
source "$(dirname "$0")/system-prep.sh"

echo -e "${BLUE}1. Cleaning individual app dist directories...${NC}"
# Clean specific app directories
rm -rf dist/apps/craft-web/
rm -rf dist/apps/craft-nest/
rm -rf dist/apps/craft-go/
rm -rf dist/libs/craft-library/

echo -e "${BLUE}2. Cleaning root dist directory...${NC}"
# Clean root dist
rm -rf dist/

echo -e "${BLUE}3. Cleaning Nx cache...${NC}"
timeout 20s npx nx reset || echo -e "${YELLOW}⚠ nx reset timed out or failed, continuing...${NC}"

echo -e "${BLUE}4. Cleaning node_modules cache...${NC}"
npm cache clean --force

echo -e "${GREEN}✓ All build artifacts cleaned${NC}"

# Optional: If arguments are provided, run builds
if [ $# -gt 0 ]; then
    run_build() {
        local project_name=$1
        local build_command=$2
        echo -e "${BLUE}Building $project_name...${NC}"
        eval "$build_command"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ $project_name build successful${NC}"
        else
            echo -e "${RED}✗ $project_name build failed${NC}"
            exit 1
        fi
    }

    echo -e "${BLUE}5. Running builds for: $@${NC}"
    
    for project in "$@"; do
        echo -e "${BLUE}Building $project...${NC}"
        case $project in
            "craft-web")
                run_build "craft-web" "npx nx run craft-web:build --configuration=production"
                ;;
            "craft-nest")
                run_build "craft-nest" "npx nx run craft-nest:build --configuration=production"
                ;;
            "craft-go")
                run_build "craft-go" "npx nx run craft-go:build --configuration=production"
                ;;
            "craft-library")
                run_build "craft-library" "npx nx run craft-library:build"
                ;;
            "all")
                echo -e "${BLUE}Building all projects...${NC}"
                run_build "craft-library" "npx nx run craft-library:build"
                run_build "craft-nest" "npx nx run craft-nest:build --configuration=production"
                run_build "craft-go" "npx nx run craft-go:build --configuration=production"
                run_build "craft-web" "npx nx run craft-web:build --configuration=production"
                ;;
            *)
                echo -e "${YELLOW}⚠ Unknown project: $project${NC}"
                ;;
        esac
    done
fi

echo -e "${GREEN}=== Clean Build Complete ===${NC}"
