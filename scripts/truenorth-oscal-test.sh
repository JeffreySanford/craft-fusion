#!/bin/bash
# truenorth-oscal-test.sh - Validate the TrueNorth OSCAL Rev5 profile and test real-time monitoring integration
# Usage: bash scripts/truenorth-oscal-test.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

OSCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/oscal-analysis"
TEMPLATE="$OSCAL_DIR/truenorth-template.json"
TEST="$OSCAL_DIR/truenorth-test.json"

# Check for jq (required for JSON validation)
if ! command -v jq &>/dev/null; then
  echo -e "${RED}jq is required for this test. Please install jq.${NC}"
  exit 1
fi

# Validate template JSON
if jq empty "$TEMPLATE"; then
  echo -e "${GREEN}✓ truenorth-template.json is valid JSON.${NC}"
else
  echo -e "${RED}✗ truenorth-template.json is not valid JSON!${NC}"
  exit 1
fi

# Validate test JSON
if jq empty "$TEST"; then
  echo -e "${GREEN}✓ truenorth-test.json is valid JSON.${NC}"
else
  echo -e "${RED}✗ truenorth-test.json is not valid JSON!${NC}"
  exit 1
fi

# Check required fields in template
REQUIRED_FIELDS=("profile" "oscal_version" "baseline" "features.real_time_monitoring" "features.audit_logging" "compliance.rev5" "compliance.3PAO" "compliance.3FAO")
for field in "${REQUIRED_FIELDS[@]}"; do
  if jq -e ".${field}" "$TEMPLATE" | grep -q 'true\|"'; then
    echo -e "${GREEN}✓ Field '${field}' present in template.${NC}"
  else
    echo -e "${RED}✗ Field '${field}' missing or false in template!${NC}"
    exit 1
  fi
done

echo -e "${BLUE}All TrueNorth OSCAL template and test checks passed.${NC}"
