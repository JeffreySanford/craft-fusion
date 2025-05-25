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

# === Environment & Time Estimate Infographic ===
CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')

bar() {
  local label="$1"; local value="$2"; local max="$3"; local color="$4"
  local n=$((value > max ? max : value))
  printf "${color}%-18s [" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "]${NC} %s\n" "$value"
}

OSCAL_EST=3; if [ "$CPU_CORES" -le 1 ]; then OSCAL_EST=7; elif [ "$CPU_CORES" -le 2 ]; then OSCAL_EST=5; fi; if [ "$MEM_TOTAL_MB" -lt 1500 ]; then OSCAL_EST=$((OSCAL_EST+2)); fi

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🛡️  FedRAMP OSCAL Scan Environment         ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
bar "OSCAL Scan" $OSCAL_EST 10 "$PURPLE"
echo -e "${BOLD}${WHITE}Estimated Time: ~${OSCAL_EST} min${NC}\n"

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
