#!/bin/bash
# cleanup-scripts.sh - Clean up unnecessary scripts before production deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧹 Cleaning up scripts for production deployment...${NC}"

# Create archive directory
ARCHIVE_DIR="scripts/archive"
mkdir -p "$ARCHIVE_DIR"

# Scripts to archive (completed/experimental)
SCRIPTS_TO_ARCHIVE=(
    "deploy-timed.sh"
    "deploy-low-memory.sh"
    "deploy-with-monitor.sh"
    "deploy-cross-platform.sh"
    "fix-pm2-permissions.sh"
    "fix-ecosystem-config.sh"
    "fix-and-deploy-ecosystem.sh"
    "quick-test.sh"
    "verify-go-build.sh"
)

# Scripts to keep (essential for production)
ESSENTIAL_SCRIPTS=(
    "deploy-all.sh"
    "test-backends.sh"
    "memory-monitor.sh"
    "clean-build.sh"
    "deploy-frontend.sh"
    "deploy-backend.sh"
    "ssl-setup.sh"
    "wss-setup.sh"
    "nginx-test.sh"
    "verify-deployment.sh"
    "system-optimize.sh"
)

echo -e "${BLUE}Archiving experimental/completed scripts...${NC}"

# Archive scripts
for script in "${SCRIPTS_TO_ARCHIVE[@]}"; do
    if [ -f "scripts/$script" ]; then
        echo -e "  📦 Archiving: $script"
        mv "scripts/$script" "$ARCHIVE_DIR/"
    fi
done

echo -e "${GREEN}✓ Scripts archived to $ARCHIVE_DIR${NC}"

# Verify essential scripts remain
echo -e "${BLUE}Verifying essential scripts are present...${NC}"
missing_scripts=()

for script in "${ESSENTIAL_SCRIPTS[@]}"; do
    if [ -f "scripts/$script" ]; then
        echo -e "  ✓ $script"
    else
        echo -e "  ${RED}✗ Missing: $script${NC}"
        missing_scripts+=("$script")
    fi
done

if [ ${#missing_scripts[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All essential scripts present${NC}"
else
    echo -e "${RED}❌ Missing essential scripts: ${missing_scripts[*]}${NC}"
    exit 1
fi

# Create production script manifest
echo -e "${BLUE}Creating production script manifest...${NC}"
cat > scripts/PRODUCTION-SCRIPTS.md << 'EOF'
# Production Scripts

## Essential Deployment Scripts

### Core Deployment
- `deploy-all.sh` - **Main production deployment orchestrator**
- `deploy-backend.sh` - Backend-only deployment
- `deploy-frontend.sh` - Frontend-only deployment
- `clean-build.sh` - Build cleanup utility

### Testing & Validation
- `test-backends.sh` - API endpoint testing
- `verify-deployment.sh` - Post-deployment validation
- `nginx-test.sh` - Nginx configuration testing

### Infrastructure
- `memory-monitor.sh` - Real-time system monitoring
- `ssl-setup.sh` - SSL certificate configuration
- `wss-setup.sh` - WebSocket Secure setup
- `system-optimize.sh` - VPS optimization

## Archived Scripts

Experimental and completed scripts have been moved to `scripts/archive/`:
- `deploy-timed.sh` - Development version with progress tracking
- `deploy-low-memory.sh` - Memory optimization experiments
- `deploy-with-monitor.sh` - Combined deployment with monitoring
- `fix-pm2-permissions.sh` - One-time PM2 user setup (completed)
- `fix-ecosystem-config.sh` - One-time configuration fix (completed)

## Usage

```bash
# Full production deployment
./scripts/deploy-all.sh

# Test deployment
./scripts/test-backends.sh

# Monitor system resources
./scripts/memory-monitor.sh
```
EOF

echo -e "${GREEN}✅ Script cleanup completed!${NC}"
echo -e "${BLUE}📋 Production scripts documented in scripts/PRODUCTION-SCRIPTS.md${NC}"
echo -e "${BLUE}📦 Archived scripts moved to scripts/archive/${NC}"

echo -e "${YELLOW}📊 Script Summary:${NC}"
echo -e "  Essential Scripts: ${#ESSENTIAL_SCRIPTS[@]}"
echo -e "  Archived Scripts: ${#SCRIPTS_TO_ARCHIVE[@]}"
echo -e "  Ready for production deployment with deploy-all.sh${NC}"

# Update .gitignore to ignore archived scripts in future commits (optional)
if ! grep -q "scripts/archive/" .gitignore 2>/dev/null; then
    echo -e "${BLUE}Adding archive directory to .gitignore...${NC}"
    echo "" >> .gitignore
    echo "# Archived development scripts" >> .gitignore
    echo "scripts/archive/" >> .gitignore
    echo -e "${GREEN}✓ Updated .gitignore${NC}"
fi

echo -e "${GREEN}🎉 Ready for production deployment!${NC}"
echo -e "${BLUE}Next step: Run ${YELLOW}./scripts/deploy-all.sh${BLUE} to deploy to production${NC}"
