# Security Tab UI Specification

This document defines the admin Security tab experience. It is a top-level admin view with a horizontal sub-navigation and evidence-driven content.

## Goals

- Show security posture at a glance.
- Provide evidence artifacts (reports, SBOMs, scan results).
- Support manual and scheduled scans with clear status.
- Keep the UI transparent about what is real vs mocked.

## Current implementation status (2026-01-08)

- Overview, OSCAL Scans, SCA Top 10, SBOM, and Real-Time Tests tabs are implemented in `security-dashboard.component.html` and styled with the patriotic cards/gradients defined in `security-dashboard.component.scss`.
- Findings and Evidence views now exist with API-driven panels, loading/empty states, and badge styling; they still depend on `/api/security/findings` and `/api/security/evidence` returning real data.
- All tab content outside the API log stream consumes static arrays (`oscalProfiles`, `scaTop10`, `sboms`, `realtimeChecks`) defined in the component, so it is still mocked.
- `ApiLoggerService` is the only live data source right now; only the endpoint timeline details reflect actual API traffic.
- Primary CTA buttons (run scan, download, compare, etc.) are stubs and do not call backend endpoints yet, and loading/error/empty states are missing.

## Navigation

Horizontal top navigation (within the Security tab):

- Overview
- OSCAL Scans
- SCA Top 10
- SBOMs
- Real-Time Tests
- Findings
- Evidence

## Overview view

- Status summary tiles (pass/fail, last run, next scheduled run).
- Top risks list (Top 3 findings, severity color chips).
- Recent activity timeline (scan started, scan finished, artifact uploaded).

## OSCAL Scans view

- Scan profiles list (standard, ospp, pci-dss, cusp).
- Latest results per profile (timestamp, pass/fail counts, duration).
- Primary actions: Run scan, View report, Download XML/HTML.
- Evidence attachments: store hash, location, and retention period.

## SCA Top 10 view

- Coverage checklist aligned with OWASP Top 10.
- Real-time checks (dependency health, known CVEs, outdated packages).
- Severity distribution chart with filters.
- Primary actions: Run SCA scan, Export findings.

## SBOMs view

- SBOM inventory list (format, generator, created time).
- Primary actions: Generate SBOM, Download SBOM, Compare SBOM.
- Status tile: last SBOM delta, packages added/removed.

## Real-Time Tests view

- Live status tiles (auth checks, rate-limit checks, CSP/XSS tests).
- Execution log (most recent tests, duration, status).
- Primary action: Run full real-time test suite.

## Findings view

- Table of findings with severity, source, component, and remediation.
- Filters: severity, source, date range, status (open/closed).
- Inline remediation links.

## Evidence view

- Artifact list (OSCAL report, SBOM, SCA report, test logs).
- Metadata: hash, created by, retention window.
- Primary actions: Download, archive, purge.

## Data model (draft)

```typescript
export interface SecurityArtifact {
  id: string;
  type: 'oscal' | 'sca' | 'sbom' | 'realtime';
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  createdAt: string;
  durationMs?: number;
  hash?: string;
  downloadUrl?: string;
}

export interface SecurityFinding {
  id: string;
  source: 'oscal' | 'sca' | 'realtime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  component?: string;
  status: 'open' | 'closed';
  createdAt: string;
}
```

## Visual style

- Use patriotic gradients (navy/red/gold) for headers and tiles.
- Keep primary actions bold and obvious.
- Ensure cards are clearly separated from background.

## Accessibility and motion

- Provide reduced motion for live tiles.
- Keep contrast AA or higher.

## Backend/API expectations

**Status (2026-01-08):** Backend stubs in place for findings and evidence; other endpoints not yet implemented.

- `GET /api/security/overview` (planned)
- `GET /api/security/oscal` / `POST /api/security/oscal:run` (planned)
- `GET /api/security/sca` / `POST /api/security/sca:run` (planned)
- `GET /api/security/sbom` / `POST /api/security/sbom:generate` (planned)
- `GET /api/security/tests` / `POST /api/security/tests:run` (planned)
- `GET /api/security/findings` (stub implemented)
- `GET /api/security/evidence` (stub implemented)

## Next steps

- Build the Findings and Evidence tabs (findings table, evidence artifacts list, metadata, hash/verifications).
- Replace the static arrays with service-driven data from `/api/security/{oscal,sca,sbom,tests}` and show loading/error placeholders until the payload arrives.
- Wire every primary CTA (`Run scan`, `Generate SBOM`, `Download evidence`, `Export findings`) to backend handlers or gate the buttons until the capability lands.
- Surface artifact metadata (hash, created-by, retention window, size) alongside each download link, so the UI can highlight what is real vs mocked.
- Define and implement the backend contract that the dashboard expects (overview tiles, OSCAL/SCA/SBOM result sets, real-time checks, findings, evidence) so the UI can safely retire the mocked data and show a “live” indicator when the payload is real.
