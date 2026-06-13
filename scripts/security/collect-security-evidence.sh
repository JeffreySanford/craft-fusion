#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="${SECURITY_EVIDENCE_DIR:-$PROJECT_ROOT/security-evidence}"
OUT_FILE="$OUT_DIR/host-security-evidence.json"
SITE_URL="${SECURITY_SITE_URL:-https://jeffreysanford.us}"
API_HEALTH_URL="${SECURITY_API_HEALTH_URL:-https://jeffreysanford.us/api/health}"

mkdir -p "$OUT_DIR"

status_json() {
  local key="$1"
  local status="$2"
  local evidence="$3"
  local checked_at
  checked_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  printf '    "%s": {"status": "%s", "evidence": "%s", "checkedAt": "%s"}' \
    "$key" "$status" "$(printf '%s' "$evidence" | sed 's/\\/\\\\/g; s/"/\\"/g')" "$checked_at"
}

http_code() {
  curl -k -s -o /dev/null -w "%{http_code}" "$1" 2>/dev/null || printf '000'
}

header_value() {
  curl -k -sI "$SITE_URL" 2>/dev/null | awk -v name="$1" 'BEGIN{IGNORECASE=1} $0 ~ "^" name ":" { sub("^[^:]+:[[:space:]]*", ""); gsub("\r", ""); print; exit }'
}

api_status="$(http_code "$API_HEALTH_URL")"
if [ "$api_status" = "200" ]; then
  app_health_status="pass"
  app_health_evidence="API health endpoint returned HTTP 200."
else
  app_health_status="fail"
  app_health_evidence="API health endpoint returned HTTP $api_status."
fi

hsts="$(header_value "strict-transport-security")"
csp="$(header_value "content-security-policy")"
x_frame="$(header_value "x-frame-options")"
x_content="$(header_value "x-content-type-options")"
if [ -n "$hsts" ] && [ -n "$csp" ] && [ -n "$x_content" ]; then
  app_headers_status="pass"
  app_headers_evidence="Security headers present: HSTS, CSP, X-Content-Type-Options${x_frame:+, X-Frame-Options}."
else
  app_headers_status="fail"
  app_headers_evidence="Missing security headers. HSTS=${hsts:-missing}; CSP=${csp:-missing}; X-Content-Type-Options=${x_content:-missing}; X-Frame-Options=${x_frame:-missing}."
fi

if [ "$(http_code "$SITE_URL")" = "200" ]; then
  tls_status="pass"
  tls_evidence="$SITE_URL returned HTTP 200 over HTTPS."
else
  tls_status="fail"
  tls_evidence="$SITE_URL did not return HTTP 200 over HTTPS."
fi

auditd_status="$(systemctl is-active auditd 2>/dev/null || echo unknown)"
if [ "$auditd_status" = "active" ]; then
  security_logging_status="pass"
  security_logging_evidence="auditd is active; application logs are written under /var/log/craft-fusion."
else
  security_logging_status="fail"
  security_logging_evidence="auditd status is $auditd_status."
fi

if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  firewall_status="pass"
  firewall_evidence="firewalld is running."
elif command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -qi "Status: active"; then
  firewall_status="pass"
  firewall_evidence="ufw is active."
else
  firewall_status="warning"
  firewall_evidence="No active firewalld or ufw state detected by collector."
fi

if command -v ss >/dev/null 2>&1; then
  listeners="$(ss -tulnH 2>/dev/null | awk '{print $5}' | sed -E 's/.*:([0-9]+)$/\1/' | sort -n | uniq | tr '\n' ',' | sed 's/,$//')"
else
  listeners="unknown"
fi

if printf '%s' "$listeners" | grep -Eq '(^|,)(80|443)(,|$)'; then
  network_exposure_status="pass"
  network_exposure_evidence="Listening ports detected: $listeners."
else
  network_exposure_status="warning"
  network_exposure_evidence="Could not confirm HTTP/HTTPS listener set. Listening ports: $listeners."
fi

network_segmentation_status="notchecked"
network_segmentation_evidence="Single-host collector cannot prove VPC/VLAN/micro-segmentation. Attach cloud firewall/VPC evidence for this control."

if pnpm audit --json > "$OUT_DIR/pnpm-audit.json" 2>/dev/null; then
  dependency_status="pass"
  dependency_evidence="pnpm audit completed with no reported failing vulnerabilities."
else
  dependency_status="fail"
  dependency_evidence="pnpm audit reported vulnerabilities or failed. See security-evidence/pnpm-audit.json when available."
fi

cat > "$OUT_FILE" <<JSON
{
  "generatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "source": "scripts/security/collect-security-evidence.sh",
  "checks": {
$(status_json "app_health" "$app_health_status" "$app_health_evidence"),
$(status_json "app_security_headers" "$app_headers_status" "$app_headers_evidence"),
$(status_json "tls_enabled" "$tls_status" "$tls_evidence"),
$(status_json "security_logging" "$security_logging_status" "$security_logging_evidence"),
$(status_json "firewall_configured" "$firewall_status" "$firewall_evidence"),
$(status_json "network_exposure_restricted" "$network_exposure_status" "$network_exposure_evidence"),
$(status_json "network_segmentation" "$network_segmentation_status" "$network_segmentation_evidence"),
$(status_json "dependency_audit" "$dependency_status" "$dependency_evidence"),
$(status_json "admin_access_reviewed" "notchecked" "Administrative access review requires human attestation or PAM evidence."),
$(status_json "auth_session_controls" "notchecked" "Session lifetime and account lockout evidence is not collected by this host script yet."),
$(status_json "cookie_security" "notchecked" "Cookie flags require an authenticated response capture; collector does not store credentials."),
$(status_json "cors_restricted" "notchecked" "CORS policy requires origin-specific probes; collector has not run those probes yet."),
$(status_json "data_encryption_at_rest" "notchecked" "Disk/database encryption requires cloud or database provider evidence."),
$(status_json "input_validation" "notchecked" "Input validation evidence should come from backend test results."),
$(status_json "rate_limiting" "notchecked" "Rate limiting evidence should come from controlled auth endpoint probes."),
$(status_json "system_hardened" "notchecked" "System hardening baseline evidence has not been attached.")
  }
}
JSON

echo "Wrote $OUT_FILE"
