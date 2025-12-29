#!/bin/bash
# install-security-tools.sh - Install security scanning tools for Admin Security Tab
# Requires: Go, Docker (optional but recommended)

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}=== Installing Security Scanning Tools ===${NC}"

# Check if running on supported platform
if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Warning: This script is designed for Linux/macOS. Windows users should install tools manually.${NC}"
fi

# Install osv-scanner (Go-based vulnerability scanner)
echo -e "${BLUE}Installing osv-scanner...${NC}"
if command -v go &> /dev/null; then
    go install github.com/google/osv-scanner/cmd/osv-scanner@latest
    echo -e "${GREEN}✓ osv-scanner installed${NC}"
else
    echo -e "${YELLOW}Go not found. Please install Go first, then run: go install github.com/google/osv-scanner/cmd/osv-scanner@latest${NC}"
fi

# Install syft (SBOM generator)
echo -e "${BLUE}Installing syft...${NC}"
if command -v docker &> /dev/null; then
    # Use Docker image for syft
    echo -e "${GREEN}✓ Docker available - syft will be run via Docker container${NC}"
    echo -e "${YELLOW}Note: Backend will use 'docker run --rm -v $(pwd):/app anchore/syft:latest dir:/app -o cyclonedx-json'${NC}"
elif command -v brew &> /dev/null; then
    brew install syft
    echo -e "${GREEN}✓ syft installed via Homebrew${NC}"
else
    echo -e "${YELLOW}Docker not found. Please install Docker or use the Docker image approach.${NC}"
    echo -e "${YELLOW}Alternative: curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh${NC}"
fi

# Install grype (vulnerability scanner)
echo -e "${BLUE}Installing grype...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker available - grype will be run via Docker container${NC}"
    echo -e "${YELLOW}Note: Backend will use 'docker run --rm -v $(pwd):/app anchore/grype:latest sbom:/app/sbom.json'${NC}"
elif command -v brew &> /dev/null; then
    brew install grype
    echo -e "${GREEN}✓ grype installed via Homebrew${NC}"
else
    echo -e "${YELLOW}Docker not found. Please install Docker or use the Docker image approach.${NC}"
    echo -e "${YELLOW}Alternative: curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh${NC}"
fi

# Verify installations
echo -e "${BOLD}${BLUE}=== Verification ===${NC}"

if command -v osv-scanner &> /dev/null; then
    echo -e "${GREEN}✓ osv-scanner: $(osv-scanner --version)${NC}"
else
    echo -e "${RED}✗ osv-scanner not found in PATH${NC}"
fi

if command -v syft &> /dev/null; then
    echo -e "${GREEN}✓ syft: $(syft version)${NC}"
elif command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ syft: Available via Docker${NC}"
else
    echo -e "${RED}✗ syft not available${NC}"
fi

if command -v grype &> /dev/null; then
    echo -e "${GREEN}✓ grype: $(grype version)${NC}"
elif command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ grype: Available via Docker${NC}"
else
    echo -e "${RED}✗ grype not available${NC}"
fi

echo -e "${BOLD}${GREEN}=== Installation Complete ===${NC}"
echo -e "${BLUE}The Admin Security Tab is now ready to run real security scans!${NC}"
echo -e "${YELLOW}Note: OSCAL scanner uses the existing Go script in scripts/oscal/${NC}"