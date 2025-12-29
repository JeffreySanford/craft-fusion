#!/bin/bash
# run-oscal-scanner.sh - Runs the Go-based OSCAL scanner

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
CYAN='\033[0;36m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}=== Go OSCAL Scanner Launcher ===${NC}"

# Check if Go is installed
if ! command -v go &> /dev/null; then
  echo -e "${RED}Error: Go is not installed. Please install Go first.${NC}"
  exit 1
fi

# Build the scanner
echo -e "${BLUE}Compiling oscal-scanner.go...${NC}"
cd "$(dirname "$0")" # Move to script directory

go_build_output=$(go build oscal-scanner.go 2>&1)
if [ $? -ne 0 ]; then
  echo -e "${RED}Go build failed:${NC}\n$go_build_output"
  exit 1
fi

echo -e "${GREEN}✓ Compilation successful${NC}"

# Run the scanner with any arguments passed to this script
echo -e "${BLUE}Launching OSCAL scanner...${NC}"
echo -e "${YELLOW}Note: This may require sudo for some scans${NC}"

# Check if we're running with sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Warning: Not running with sudo. Some scans might fail.${NC}"
  echo -e "${YELLOW}Consider running with: sudo $0 $*${NC}"
fi

# Run the scanner with provided arguments
./oscal-scanner "$@"

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ OSCAL scanning completed successfully${NC}"
else
  echo -e "${RED}✗ OSCAL scanning failed${NC}"
  exit 1
fi

echo -e "${BOLD}${CYAN}=== Go OSCAL Scanner Complete ===${NC}"
