#!/bin/bash
# fedramp-oscal.sh - Run OpenSCAP (oscap) with selected SCAP Security Guide profile for Fedora
# Usage: sudo ./scripts/fedramp-oscal.sh [standard|ospp|pci-dss|cusp]

PROFILE=${1:-standard}
PROFILE_ID=""

case "$PROFILE" in
  standard)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_standard" ;;
  ospp)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_ospp" ;;
  pci-dss)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_pci-dss" ;;
  cusp)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_cusp_fedora" ;;
  *)
    echo "Unknown profile: $PROFILE"
    echo "Usage: $0 [standard|ospp|pci-dss|cusp]"
    exit 1
    ;;
esac

SCAP_CONTENT="/usr/share/xml/scap/ssg/content/ssg-fedora-ds.xml"
OSCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/oscal-analysis"
RESULTS="$OSCAL_DIR/oscap-results.xml"
REPORT="$OSCAL_DIR/oscap-report.html"

mkdir -p "$OSCAL_DIR"

if [ ! -f "$SCAP_CONTENT" ]; then
  echo "SCAP Security Guide content not found: $SCAP_CONTENT"
  exit 1
fi

echo "Running OpenSCAP scan with profile: $PROFILE_ID"
oscap xccdf eval --profile "$PROFILE_ID" \
  --results "$RESULTS" \
  --report "$REPORT" \
  "$SCAP_CONTENT"

if [ $? -eq 0 ]; then
  echo "OpenSCAP scan complete."
  echo "Results: $RESULTS"
  echo "HTML Report: $REPORT"
else
  echo "OpenSCAP scan failed."
fi
