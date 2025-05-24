#!/bin/bash
# verify-go-build.sh - Script to verify and fix Go build configuration

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Go Build Verification ==="

echo -e "${BLUE}1. Checking Go installation...${NC}"
if command -v go &> /dev/null; then
    GO_VERSION=$(go version)
    echo -e "${GREEN}✓ Go found: $GO_VERSION${NC}"
else
    echo -e "${RED}✗ Go not found${NC}"
    exit 1
fi

echo -e "${BLUE}2. Cleaning previous Go builds...${NC}"
rm -rf dist/apps/craft-go/

echo -e "${BLUE}3. Testing development build...${NC}"
npx nx run craft-go:build --configuration=development
if [ -f "dist/apps/craft-go/main.exe" ]; then
    echo -e "${GREEN}✓ Development build created main.exe (Windows)${NC}"
    rm -f dist/apps/craft-go/main.exe
else
    echo -e "${RED}✗ Development build failed${NC}"
fi

echo -e "${BLUE}4. Testing production build...${NC}"
npx nx run craft-go:build --configuration=production
if [ -f "dist/apps/craft-go/main" ]; then
    echo -e "${GREEN}✓ Production build created main (Linux)${NC}"
    
    # Verify the binary type
    if command -v file &> /dev/null; then
        BINARY_TYPE=$(file dist/apps/craft-go/main)
        echo -e "${BLUE}Binary type: $BINARY_TYPE${NC}"
        
        if [[ "$BINARY_TYPE" == *"Linux"* ]] && [[ "$BINARY_TYPE" == *"x86-64"* ]]; then
            echo -e "${GREEN}✓ Binary is correct Linux x86-64 executable${NC}"
        else
            echo -e "${YELLOW}⚠ Unexpected binary type: $BINARY_TYPE${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ 'file' command not available, cannot verify binary type${NC}"
    fi
    
    # Check binary size
    BINARY_SIZE=$(ls -lh dist/apps/craft-go/main | awk '{print $5}')
    echo -e "${BLUE}Binary size: $BINARY_SIZE${NC}"
    
else
    echo -e "${RED}✗ Production build failed - main executable not found${NC}"
    
    echo -e "${BLUE}Checking build output...${NC}"
    ls -la dist/apps/craft-go/ || echo "No build output directory"
    
    echo -e "${BLUE}Trying manual build...${NC}"
    cd apps/craft-go
    GOOS=linux GOARCH=amd64 go build -o ../../dist/apps/craft-go/main ./main.go
    cd ../..
    
    if [ -f "dist/apps/craft-go/main" ]; then
        echo -e "${GREEN}✓ Manual build successful${NC}"
    else
        echo -e "${RED}✗ Manual build also failed${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}5. Testing Go application dependencies...${NC}"
cd apps/craft-go
go mod tidy
go mod verify
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Go modules verified${NC}"
else
    echo -e "${RED}✗ Go modules verification failed${NC}"
    exit 1
fi
cd ../..

echo -e "${GREEN}=== Go Build Verification Complete ===${NC}"

if [ -f "dist/apps/craft-go/main" ]; then
    echo -e "${GREEN}✓ Production Linux binary ready for deployment${NC}"
    echo -e "${BLUE}Binary location: dist/apps/craft-go/main${NC}"
else
    echo -e "${RED}✗ Production binary not available${NC}"
    exit 1
fi
