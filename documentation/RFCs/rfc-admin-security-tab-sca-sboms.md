# RFC: Admin Security Tab — SCA Top 10 & SBOMs 🔒📦

- **Status:** In progress (MVP: scaffolding + UI component + tests)
- **Author:** GitHub Copilot (updated)
- **Last Updated:** 2025-12-27
- **Related TODO:** `TODO.md` (Feature: Admin Security Tab — SCA Top 10 & SBOMs)

---

## Summary

Add a safe, opinionated **Admin Security** section that enables on-demand SCA (software composition analysis) scans (Top‑10 findings) and SBOM generation/scanning. The feature is manual-first (admin triggers scans); results are stored and discoverable from the Security tab and downloadable as SBOM artifacts.

## Implementation status (2025-12-27)

- Frontend: **`AdminSecurityComponent`** implemented and wired into the Admin tab (moved ~2k lines of security markup out of `admin.component.html`). ✅
- Metrics: `AdminMetricsService` created on frontend to fetch `/api/admin/metrics` (backend endpoint pending). ✅ (frontend)
- Scanning: `SecurityScanService` exists and integrates with the backend API (`/api/security/*`). ✅
- Tests: Unit tests added for `AdminSecurityComponent` (rendering, startScan, job progress). Spec present but global Jest ESM setup prevents running the full test suite today — new spec will run once test environment is fixed. ⚠️
- Build: `npx nx build craft-web` succeeds with these changes. ✅

Files changed (key):

- `apps/craft-web/src/app/pages/admin/admin.component.html` — replaced large Security markup with `<app-admin-security>` placeholder.
- `apps/craft-web/src/app/pages/admin/security/security.component.{ts,html,scss}` — implemented UI and styles.
- `apps/craft-web/src/app/pages/admin/security/security.component.spec.ts` — unit tests added.
- `apps/craft-web/src/app/common/services/admin-metrics.service.ts` — frontend metrics service.

Notes: The core idea is validated and considered feasible; remaining work focuses on backend metrics endpoint, containerized runner, queue persistence in production, and test environment fixes.

## Current tasks / Next steps

- Implement backend `/api/admin/metrics` endpoint and wire to real data (active users, permission requests, connection). **High priority**.
- Add containerized scanner runner (syft/grype) with sandboxing, resource limits, and artifact storage. **High priority**.
- Replace in-memory queue with persistent queue (Redis + BullMQ) for production use. **Medium priority**.
- Fix Jest test environment (ESM parsing issue) so new and existing tests run in CI; ensure the new spec executes successfully. **High priority**.
- Add integration / e2e tests (Playwright) using a deterministic fake-scanner or short local run. **Medium priority**.

## Motivation

- Give maintainers fast, actionable visibility into dependency risk and SBOMs without continuous scanning overhead.
- Support pre-deploy/manual checks and on-demand audits for portfolio environments.
- Provide a platform for later automation (scheduled scans, CI integrations) while keeping MVP minimal and safe.

## Goals

- Provide manual actions: "Run SCA Scan", "Generate SBOM", and "Scan SBOM".
- Present Top‑10 findings and severity counts, show SBOM list and allow downloads, and provide a job console with progress/status.
- Deliver secure server-side scanning (no browser-side tooling), with strict allowlist of supported scan types/commands and admin-only access.

## Non-Goals (MVP)

- No continuous scanning by default.
- No public exposure of raw SBOMs or results.
- No complex scheduling/orchestration (keep a simple queue for MVP).

## High-level Architecture

- Backend (NestJS): `SecurityScanModule` with Controller, Service (job runner), optional Gateway (WebSocket) for progress streaming, and storage adapter for JSON/SBOMs.
- UI (Angular): Add a "Manual Checks" panel to Admin → Security tab using Angular Material components and a small `SecurityScanService` for API + streaming.

## API (proposal)

### Start scan (enqueue)

- POST /api/security/scans
  - Body: `{ type: 'sbom'|'sca'|'sbom-scan', scope: 'repo'|'container' }`
  - Response: `{ jobId: string }`

### Job status

- GET /api/security/scans/:jobId
  - Response: `ScanJobStatusDto` (see DTOs)

### Latest summary

- GET /api/security/latest
  - Response: `{ lastScanAt, scannerVersions, summary, topFindings, sboms[] }`

### Download SBOM

- GET /api/security/sboms/:id
  - Response: `application/json` (CycloneDX/SPDX) or redirect to file download

> All endpoints protected with Admin auth guard + rate limiting.

## DTOs / Types (example)

```ts
export type ScanType = 'sbom' | 'sca' | 'sbom-scan';
export type ScanScope = 'repo' | 'container';

export interface StartScanDto { type: ScanType; scope: ScanScope; }

export interface ScanJobStatusDto {
  jobId: string;
  type: ScanType;
  scope: ScanScope;
  state: 'queued'|'running'|'done'|'failed';
  startedAt?: string;
  finishedAt?: string;
  progress?: number; // 0..100
  message?: string;
}

export interface TopFinding { package: string; version: string; id: string; severity: string; fix?: string; path?: string[] }
```

## Job Runner (MVP behaviour)

- In-memory FIFO queue (single worker) that serially runs scans to avoid resource contention.
- Strict allowlist maps `type+scope` to a preconfigured command container or binary call (e.g., `syft cyclonedx . -o json`, `grype sbom.json -o json`).
- Capture stdout/stderr and write result JSON + SBOM files to a storage location (e.g., `storage/security/` or DB for long-term retention).
- Update job status and stream progress via WebSocket messages (or polling endpoints as fallback).

## Storage

- Store artifacts as JSON + SBOM JSON files with metadata (timestamp, git sha, scanner versions, summary) in a secured storage folder or DB.
- Keep a configurable retention (e.g., last N results) and provide a "latest" endpoint for UI.

## UI (Admin Security tab additions)

- "Manual Checks" card with buttons: Run SCA Scan, Generate SBOM, Scan SBOM
- Job console: job status, progress bar, last log line, start/finish times
- Top 10 findings: table with package, version, vuln ID, severity, fix, direct/transitive
- SBOM panel: latest SBOM metadata, download link, history list, diff summary (packages added/removed/updated)

UX notes:

- The UI should disable the run buttons if a job is already queued/running to avoid overload.
- Use Angular Material components, RxJS for streaming updates, and integrate into existing Admin routing.

## Security & Safety

- No CLI args from client — only allow predefined enums.
- Rate-limit manual scan endpoints (global & per-admin) to avoid abuse.
- Require Admin-level authentication & audit logs for scan actions.
- Treat SBOMs as sensitive data; do not expose publicly.
- Prefer running scans inside a contained environment (dedicated container or jailed process) to reduce host risk.

## Tests

- Unit tests for `SecurityScanService` (job logic, allowlist enforcement).
- Integration tests for controller endpoints + auth guard.
- Playwright e2e test: simulate "Run SCA Scan" → stream progress → verify Top 10 results appear (mocked runner or short local scan).

## Rollout plan

1. Implement backend module + queue with a dry-run command option (simulate runs) and simple JSON outputs.
2. Add UI with mocked backend to get UX feedback.
3. Wire to the real runner (containerized syft/grype) behind feature flag.
4. Add e2e tests and retention policy; open PR and run CI.

## Estimate & Owner

- Owner: Security / Backend / Frontend (collaborative)
- Priority: Medium
- Estimate (MVP): 3–6 developer days

## Future directions

- Add scheduled scans + CI artifact ingestion.
- Add historical trend charts and notifications (email/Slack) for new critical items.
- Consider RBAC additions and multi-environment support (staging/production)

## References & Tools

- Syft (SBOM generation): <https://github.com/anchore/syft>
- Grype (vulnerability scanning from SBOM): <https://github.com/anchore/grype>
- CycloneDX / SPDX standards for SBOMs
- OSV / osv-scanner

---

If you want, I can now scaffold the `SecurityScanModule` plus a small Angular `SecurityScanService` and component with the basic UI; tell me which piece to scaffold first (backend or UI) and I will create a draft PR with tests and a README for the module.

---

### Expanded research & implementation details

Great question — the RFC is a solid MVP-level plan, but it benefits from more concrete implementation detail, research notes, and operational guidance. Below are practical choices, command examples, messaging schemas, storage/DB models, testing and rollout details, security hardening, and an actionable task breakdown you can use to implement it.

## Summary / Assessment ✅

- The original RFC defines the right scope and safety constraints (manual scans, job queue, server-side scanning, admin-only access).
- The expansion below provides concrete tech choices, sample commands (Syft/Grype/CycloneDX), queue options, storage schemas, WebSocket payloads, retention, RBAC, testing and CI guidance, and an implementation task list with estimates.

## Tooling & Commands (recommended) 🔧

- SBOM generation (Syft):
  - syft (image/filesystem): `syft dir:. -o cyclonedx-json --file sbom-cyclonedx.json`
  - CLI reference: <https://github.com/anchore/syft>
- Scan SBOM (Grype):
  - `grype sbom:sbom-cyclonedx.json -o json > grype-results.json`
  - Grype and syft compatibility notes: use matching versions to avoid unsupported SBOM fields.
- OSV scanning:
  - `osv-scanner -s sbom.json -f json > osv-results.json` (if using OSV)
- CycloneDX / SPDX as SBOM format; CycloneDX JSON is widely supported for grype and other scanner intake.

## Backend choices & queue design ⚙️

- MVP queue: in-memory FIFO (easy to implement, simple concurrency control).
  - Pros: zero infra, quick to test. Con: restarts lose queued jobs.
- Production / recommended: Redis + BullMQ (or Bull) for persistent queue, retries, concurrency limits, delayed jobs.
  - BullMQ patterns: job progress reporting, retries, job events.
- Runner sandbox:
  - Preferred: run scanner inside a minimal container (docker run anchored CLI image) with:
    - read-only mounts of target path
    - CPU/memory limits
    - user without root
  - Alternative: install binaries on host (less secure).
- Mapping of allowed commands:
  - Map (type, scope) -> container image + CLI args (no user-provided args).

## Storage, metadata & retention 🗄️

- Storage approaches:
  - File storage: `storage/security/{jobId}/{sbom.json,results.json,meta.json}` — simple, local; can be S3 later.
  - DB rows for metadata, file references for artifacts. Example tables:
    - scans: id, type, scope, state, startedAt, finishedAt, jobId, summary (JSON), storagePath
    - sboms: id, jobId, format, filePath, generatedAt, gitSha, metadata
- Retention policy:
  - Default: keep last N (e.g., 10) per environment; archive older to S3 or delete after 90 days.
- Artifact indexing:
  - Index by git sha, build id, or container digest to avoid duplicate scans.

## API design & WebSocket/SSE payloads 📡

- POST /api/security/scans → { jobId }
- GET /api/security/scans/:jobId → ScanJobStatusDto
- GET /api/security/latest → summary (Top 10, lastScanAt, versions)
- GET /api/security/sboms/:id → file download
- WebSocket event messages (sample):
  - job.started: { jobId, type, startedAt }
  - job.progress: { jobId, progress, message }
  - job.log: { jobId, line }
  - job.finished: { jobId, status: 'done'|'failed', summary: {...}, artifacts: [ {type, path} ] }
  - Use small JSON envelope like: { type: 'job.progress', payload: {...} }
- Polling fallback: GET /api/security/scans/:jobId for UI that can’t use WebSocket.

## Data models & Top‑10 computation 📊

- For SCA Top 10: compute Top 10 vulnerabilities by severity → weight by (severity, exploitability, reachability).
- Normalize scanner outputs (grype / osv / OSV) into canonical schema:
  - { id, package, version, severity, cvss, fixedVersion, direct (bool), path (array), url, description }
- SBOM diff:
  - Parse CycloneDX JSON, compare {name, version, purl} lists between current and previous.
  - Diff output: { added: [], removed: [], updated: [{from,to}] }.

## Security hardening & policy 🔐

- Authentication: Admin-only guard on all endpoints. Log every manual scan action (user, timestamp).
- Rate limiting: per-admin and global (e.g., limit 1 manual scan per env per 10 minutes).
- Sandbox scanning: run scanners in an isolated container with minimal filesystem visibility and no secrets.
- No CLI args from user: only accept a small enum for type & scope.
- Access control for SBOMs: admin-only; consider Signed URLs or time-limited download tokens when exposing to other systems.
- Audit logs: record job start, completion, user, and an artifact checksum (sha256) for traceability.

## Observability & operations 📈

- Metrics:
  - Histogram for scan durations
  - Counters: scans started, succeeded, failed by type
  - Gauge: queue length
- Logs:
  - Persist job logs (stdout/stderr) to file or centralized log store, redact any sensitive info.
- Alerts:
  - Alert on repeated failures, long-running scans, or queue backlog > threshold.
- Runbook:
  - How to cancel a job
  - How to re-run a prior job
  - How to rebuild SBOMs after package manager changes

## Testing strategy ✅

- Unit tests:
  - job queue logic, allowlist restrictions, metadata storage
- Integration tests:
  - mock runner or use a lightweight "fake-scanner" container that returns deterministic JSON
- E2E tests:
  - Playwright: simulate user pressing "Run SCA Scan", observe progress events (use mocked backend or test runner)
- CI:
  - Add simple GitHub Action to run a sample SBOM generation on a small fixture for regression detection.

## Implementation roadmap & task breakdown (concrete) 🗂️

1. Draft API + DTOs + unit tests (1 day) — create `security-scan` Nest module and controller skeleton.
2. Implement in-memory queue + job runner with fake runner (1–2 days) — adds start/poll endpoints and job history persistence to disk.
3. Add WebSocket gateway for progress streaming (0.5 day).
4. Add UI components (Angular): Manual Checks card, Job console, Top 10 table, SBOM list (1–2 days).
5. Replace fake runner with containerized syft/grype execution and artifact storage (1–2 days).
6. Add tests + Playwright e2e with mocked runner (1 day).
7. Add retention policy, rate limiting, RBAC audits (0.5–1 day).
8. Harden and document (0.5–1 day).

- Total MVP estimate: ~6–9 dev days (realistically 1–2 weeks with reviews and CI).

## Edge cases & failure modes ⚠️

- Long-running scans: add a hard timeout (e.g., 30m) and retry/backoff strategy.
- Disk space: monitor storage usage and prune old artifacts automatically.
- Scanner incompatibility: pin syft/grype versions in CI or container images and validate SBOM format.
- Multi-env: support scoping by `environment` string (staging/prod) to separate results.

## Integration with CI & automation 🔁

- Recommended: CI (GitHub Actions) runs syft/grype on merges and stores artifacts; UI can surface CI-generated results per commit.
- CI artifacts: publish SBOM & scan JSON to an artifacts bucket or GitHub release for traceability.

## Compliance & privacy notes 📋

- SBOMs can reveal software and versions that may enable fingerprinting; ensure only privileged users can access them.
- Consider whether SBOM details should be redacted for public deployments.

## Is the RFC "well planned"? Short answer

- Yes: it captures the right MVP constraints, safety rules, and UX.
- The expansion above adds the operational and engineering detail necessary to proceed to implementation with low risk and clear deliverables.

## Next steps (pick one) ▶️

- I can update the RFC file with the expanded content above (draft the additional sections into rfc-admin-security-tab-sca-sboms.md) and open a PR.  
- Or I can scaffold the **backend module** (Nest) with in-memory queue + WebSocket + tests, or scaffold the **Angular UI** with mocked backend.  
Which should I do next?

**Status note:** Backend + frontend scaffolding created (MVP fake runner + socket events + UI component). Frontend wiring, metrics service, and unit tests are in place; build is green. Next recommended actions: implement `/api/admin/metrics` in Nest, add containerized runner (syft/grype), and fix Jest config so unit tests run in CI. Which would you like me to prioritize?
