# Security Tab UI Specification

This document defines the admin Security tab experience. It is a top-level admin view with a horizontal sub-navigation and evidence-driven content.

## Goals

- Show security posture at a glance.
- Provide evidence artifacts (reports, SBOMs, scan results).
- Support manual and scheduled scans with clear status.
- Keep the UI transparent about what is real vs mocked.

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

## Backend/API expectations (initial)

- `GET /api/security/overview`
- `GET /api/security/oscal` / `POST /api/security/oscal:run`
- `GET /api/security/sca` / `POST /api/security/sca:run`
- `GET /api/security/sbom` / `POST /api/security/sbom:generate`
- `GET /api/security/tests` / `POST /api/security/tests:run`
- `GET /api/security/findings`
- `GET /api/security/evidence`
