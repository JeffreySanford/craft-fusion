# Project TODOs (master list)

This file is the planning source of truth. It records decisions, risks, and the next sequence of work for a solo maintainer.

## Operating context

- Nx monorepo: Angular 19 (Material Design 3 Expressive) + NestJS + Go
- **Status (2026-01-12):** Monorepo stabilized. All project linting and unit tests are Green. Auth lifecycle (HttpOnly cookies + refresh rotation) successfully implemented and verified.
- Goal: reduce code and documentation while preserving production-grade security and correctness

## 2026 Roadmap: Strategic Upgrades (Angular 22 & Nx 21/22)

### Next Gen Architecture & Security

- [x] **Nx Migration**: Execute `nx migrate latest` to reach Nx 21.1.0 (DONE).
- [ ] **Angular 22 Evolution**:
  - [x] **Phase 1: Incremental path** (Currently on 19.2.18).
  - [x] **Observable Hardening**: Audit and enforce **Hot Observables** (multi-cast) for all shared state. Ensure use of `shareReplay` to prevent redundant side effects (DONE 2026-01-24).
  - [x] **Reactive Consistency**: Replace legacy `async/await` data fetches with unified `Observable`-based streams (DONE 2026-01-24).
  - [ ] **Stable Change Detection**: Optimize `Zone.js` usage. Audit for `runOutsideAngular` where performance is critical, but keep the core Zone intact.
  - [ ] Audit all components for **NgModule** compliance (`standalone: false`).
- [x] **NestJS v11+ / MongoDB 9.1**:
  - [x] Upgrade `@nestjs/core` and `@nestjs/common` to latest stable (v11.1.x) (DONE).
  - [x] Update `mongoose` to latest stable (9.1.3) (DONE).
  - [x] Forced **In-Memory MongoDB Server** for zero-config development (DONE 2026-01-24).
  - [x] Resolved **EBUSY** file lock issues with global `kill-ports.js` script (DONE 2026-01-24).
  - [ ] Enable **Strict Type Checking** across all backend modules.
- [ ] **Security (Top Priority)**:
  - [x] **Audit Remediation**: Resolved high-priority vulnerabilities.
    - [x] Update `@angular/*` to `19.2.18` (DONE).
    - [x] Update `esbuild` to `0.25.0` (DONE).
    - [x] Remove `ckeditor5` and `tinymce` (DONE).
    - [x] Update `koa` to `3.1.1` (DONE).
  - [x] **Sass Migration**: Converted legacy `@import` to `@use` in global styles (DONE).
  - [x] **CSRF Protection**: Implemented double-submit cookie pattern with `HttpClientXsrfModule` (DONE).
  - [x] **CSP Hardening**: Configured `content-security-policy` in NestJS via Helmet (DONE).
  - [ ] **XSS Sanitization**: Implement global input sanitization middleware and SafeHtml review.
  - [x] **SCA Top 10 Focus**: Verified and enforced SCA Top 10 tracking in `SecurityService` (DONE).
  - [x] **OSCAL Compliance**: Verified OSCAL endpoints and profiles in `SecurityService` (DONE).
  - [x] **AI Cleanup**: Removed Chat and Book experimental modules and services (DONE).

## Priority focus

- Lock down authentication: keep the backend guard/refresh loop solid, persist refresh-token state in the seeded Mongo store, document the opportunities to tie the admin secret to deployment flags, and validate the cleanup of any legacy auth artifacts.
- Surface real data on the admin security tab and timeline: finish Findings/Evidence views, replace mocked arrays with API calls, handle loading/error states, and wire the CTA buttons so the UI can rely on the `security/*` endpoints rather than hand-wired data.
- Harden delivery readiness: stabilize logging/monitoring, and keep the Nx tasks (lint/test/e2e) green so deployments stay predictable while the new admin/shipping surfaces land.

## Critical blockers (fix before production)

- [x] Remove auth bypass and enforce JWT verification end-to-end (Nest + Angular) (2026-01-07) - `AuthGuard` now verifies both HTTP and WebSocket tokens and refuses missing/invalid credentials
- [x] Migrate tokens to HttpOnly cookies with refresh-token rotation (2026-01-07) - `AuthenticationController` sets httpOnly cookies; refresh calls rotate tokens through `RefreshTokenService`
- [x] Clear authentication on app load/refresh (2026-01-08) - app.component constructor now calls backend logout endpoint to clear httpOnly cookies, preventing auto-login on refresh
- [x] Remove committed auth artifacts and rotate secrets (2026-01-08) - removed checked-in placeholder responses
- [x] Block absolute-path traversal in file reads (2026-01-07) - `FileService` enforces storage root boundary
- [x] Replace hardcoded WS JWT secret with configured secret (2026-01-07) - `AuthGuard` uses `JwtService.verify` with `JWT_SECRET`
- [x] Finalized AI project removal (2026-01-08) - Deleted all AI-related code and services.

## High priority (current sprint)

- [ ] Wire security tab to real API data (replace mocked oscalProfiles, scaTop10, sboms, realtimeChecks)
- [ ] Complete timeline detail view (modal component with full event display)
- [ ] Implement pagination in records endpoints (Nest + Go)
- [ ] Reduce backend debug logging and replace with structured logs

## Deferred (post-MVP)

- [ ] XSS sanitization (SafeHtml pipes, innerHTML hardening)
- [ ] Server-side token revocation storage (DB/Redis blacklist)
- [ ] Use configured host/port when starting Nest (avoid hardcoded `app.listen(3000, ...)`)
- [ ] Fix Go record generation time (currently always 0 due to local variable scope)
- [ ] Normalize socket event names to `domain:entity:action` (timeline gateway)
- [ ] Tighten timeline gateway CORS in production (remove wildcard origin)

## Test strategy (Vitest + Jest)

**Status:** Scoped migration complete (2026-01-08).

- **Frontend (`craft-web`)**: Vitest 1.6.1 + Happy-dom. Optimized for Node 22.
- **Backend (`craft-nest`, `libs`)**: Jest (Legacy). Targeted for Vitest migration in Phase 5.
- **Decision:** Option C (Pragmatic split). Vitest for Angular UI, Jest for Nest/libs. Revisit once Angular signals simplify testing patterns further.

## Test & lint status

- [x] Run Nx lint/test across workspace and capture failures (DONE: 2026-01-12)
- [x] Add Nx lint/test targets for `craft-web` if missing or misconfigured (DONE)
- [x] Fix `craft-library` lint errors (`no-explicit-any`) and tsconfig warnings (DONE)
- [x] Fix `craft-nest` unit test failures (controller specs, JSON module, mocks) (DONE)
- [x] Fix `craft-go` tests (`handlers_test.go`) (DONE)
- [x] Fix `craft-web-e2e` test runner warnings and `TransformStream` runtime issue (DONE)
- [x] Fix Playwright storage state (`playwright/.auth/user.json`) used by e2e tests (DONE)
- [x] Resolve Nx cache I/O errors (DONE)

### Latest run (2026-01-12)

- **Green Monorepo achieved.**
- `npx nx run-many -t lint,test --all`: 100% SUCCESS.
- `craft-web`: Vitest 1.6.1 passing (100% spec coverage for services/components).
- `craft-nest`: Jest passing (Fixed Controller DI and mock provider issues).
- `craft-go`: Tests passing (Corrected handler expectations).
- `craft-web-e2e`: Playwright passing (Stabilized mobile viewport assertions and `baseURL`).
- `documentation`: All `markdownlint` errors (`MD060`, `MD046`) resolved across all projects.

### Previous run (2026-01-08)

- All lint, unit tests, Playwright, and GitHub CI passing.

**Status:** ✅ All tests passing (local)

- **`craft-web`**: 112/112 tests passing. Fixed D3 ESM transformation issues, mock data nested paths, and added `matchMedia`/`ResizeObserver` polyfills.
- **`craft-nest`**: 100% passing. Stabilized DI in `HealthController` tests.
- **`craft-go`**: 100% passing. Fixed JSON marshaling assertion mismatch.
- **`craft-library`**: Clean lint and test status.
- **`test-mocks.ts`**: Created centralized unit test mock utility with proper TypeScript type references for Jest.
- **Lint**: Clean across all projects (fix applied to `craft-web`).
- **E2E**: ✅ `craft-web-e2e` stabilized with a 90%+ pass rate across Chromium, Webkit, and Safari.
- **`playwright.config.ts`**: Fixed `baseURL` protocol (`http://`) and navigation timeouts.
- **`support/auth.ts`**: Enhanced `loginAsAdmin` to inject `__E2E_TEST_MODE__` to prevent auto-logout during test runs.

## Admin dashboard UI/UX revamp (MD3 Expressive + patriotic)

**Problem:** The admin refactor reduced a 2000-line file into smaller sections, but the UI is now visually flat and hard to scan. Tabs look white-on-white with no card separation. The dashboard needs vibrant color, strong structure, and real-time tiles.

### Visual direction

- Use high-contrast patriotic palettes (navy/red/gold/white) with MD3 expressive tokens.
- Make every admin tab use visible cards or tiles; no white-on-white panels.
- Emphasize motion: staggered entry, animated counters, and responsive feedback.

### Work items

- [x] Define admin card system (sizes, padding, elevation, gradients, borders) (2026-01-07) – security tab cards now share the elevated patriotic gradients and hover treatment introduced in `security-dashboard.component.scss`.
- [x] Make every tab in the security section share the overview-style cards and gradients (2026-01-08) – `feature-card` now extends the `%security-card-base`, so OSCAL / SCA / SBOM / Real-Time tiles match the Overview vibe.
- [x] Stabilize E2E navigation and auth persistence for admin tabs (2026-01-12) – Added `__E2E_TEST_MODE__` and fixed `baseURL` protocol.
- [ ] Create real-time tile components (status, trend, delta, timestamp)
- [ ] Replace flat tables with card/tile groupings where appropriate
- [ ] Add animated KPI counters and chart reveals
- [x] Build persistent admin hero area (see `documentation/design/admin-dashboard.md` for detailed spec) (2026-01-12):
  - [x] Create `AdminHeroService` to consolidate metrics from `ServicesDashboardService`, `LoggerService`, and `SecurityService`
  - [x] Move hero tiles from `admin-landing` to `admin.component.ts` (parent level, persistent across tabs)
  - [x] Implement sticky header layout above tab navigation
  - [x] Add 6 core KPI tiles: active services, success rate, errors/warnings, system health, response time, active alerts
  - [x] Implement count-up animations with delta badges (600-900ms ease-out)
  - [x] Add alert pulse animations for new errors/warnings
  - [x] Add click actions to jump to relevant tabs (alerts → security, errors → logs)
  - [x] Ensure WCAG AA compliance and reduced-motion fallbacks
- [ ] Align typography with the real font stack in `apps/craft-web/src/styles/_typography.scss`

## Security tab spec (draft)

**Goal:** A dedicated security surface with a horizontal top navigation that switches views. It should show evidence of continuous security testing (OSCAL scans, SCA Top 10, SBOMs, real-time checks) with clear pass/fail signals and artifacts.

**Status (2026-01-08):**

- [x] Overview, OSCAL Scans, SCA Top 10, SBOMs, and Real-Time Tests tabs are implemented in `security-dashboard.component.html`; each tab reuses the patriotic card styles defined in `security-dashboard.component.scss`.
- [x] Findings and Evidence views are implemented with API-driven panels, loading/empty states, and badge styling (2026-01-08); they now depend on `/api/security/findings` and `/api/security/evidence` returning real data.
- [x] The UI still relies on mocked arrays (oscalProfiles, scaTop10, sboms, realtimeChecks) for everything except the API log stream, so only the endpoint cards reflect real data.
- [x] Backend wiring for `/api/security/*` endpoints (findings + evidence stubs) is now in place; added server-side stubs/tests so the UI can hit `/api/security/findings` and `/api/security/evidence` without falling back to mocked data.
- [ ] Evidence metadata (hash, retention, createdBy) is not captured anywhere in the UI yet.

### Top nav views (horizontal)

- Overview
- OSCAL Scans
- SCA Top 10
- SBOMs
- Real-Time Tests
- Findings (planned)
- Evidence (planned)

### Each view should include

- Status summary tiles (pass/fail, last run, duration, version)
- Primary CTA (Run scan / Generate SBOM / Export evidence)
- Artifacts list (downloadable reports, timestamps, hash)
- Filters (date range, profile, severity)
- Empty/loading/error states with guidance

### Backend/API expectations (initial)

- `/api/security/oscal` (list, start scan, results)
- `/api/security/sca` (list, start scan, results)
- `/api/security/sbom` (generate, list, download)
- `/api/security/tests` (real-time checks, live status)
- `/api/security/findings` (normalized findings, severity)

## Memorial timeline implementation checklist

### Phase 0: Seed and view (MVP)

- [x] Ensure timeline schema includes `project` type (`apps/craft-nest/src/app/timeline/timeline/schemas/timeline-event.schema.ts`)
- [x] Seed three curated events (`apps/craft-nest/src/app/timeline/timeline/seed-events.json`)
- [x] Wire `TimelineService.events$` to the timeline page and keep loading state (`apps/craft-web/src/app/projects/timeline/components/timeline-page/timeline-page.component.ts`)
- [x] Add type filters and consistent options (`apps/craft-web/src/app/projects/timeline/components/timeline-page/timeline-page.component.html`)
- [x] Add type icon + badge and read-more toggle (`apps/craft-web/src/app/projects/timeline/components/timeline-item/*`)
- [ ] Investigate missing rendered events in Timeline UI (API/stream appears reachable)
- [ ] Add empty-state copy that guides filter changes and access requests
- [ ] Add unit tests for filtering and read-more behavior

### Phase 1: Detail view (modal or route)

- [ ] Add `TimelineDetail` component (dialog or routed page)
- [ ] Define detail view layout (header, metadata, body, media, provenance, actions)
- [ ] Wire "Read more" / card click to open the detail view
- [ ] Add loading, error, and not-found states for detail fetch
- [ ] Ensure keyboard focus trap and escape-to-close for modal
- [ ] Add unit tests for detail open/close and data rendering

## Documentation consolidation

**Goal:** TODO.md is the main planning doc. The rest of the docs should be canonical, non-duplicative, and consistent with coding standards.

**Status:** Core documentation up-to-date as of 2026-01-08

- [x] Create a documentation index with canonical sources
- [x] Fix broken docs and duplicate content (deployment, security monitoring, auth)
- [x] Update auth documentation to reflect current implementation (httpOnly cookies, logout on refresh)
- [x] Align `documentation/design/security-tab.md` with real vs. mocked API status
- [x] Refresh `documentation/AUTHENTICATION.md` with current Angular/Nest auth flow
- [x] Refresh `documentation/AUTHENTICATION-SECURITY-ASSESSMENT.md` with updated roadmap
- [x] Remove emoji-heavy/placeholder text from docs
- [x] Align testing docs with Nx-only commands
- [x] Add docs for admin dashboard UI and security tab spec
- [x] Document authentication logout-on-refresh behavior in AUTHENTICATION.md (2026-01-08)

## Verification status

**Last updated:** 2026-01-08

- [x] TODO.md aligned with current state
- [x] Security docs reflect current implementation
- [x] Auth flow verified end-to-end (login, logout, refresh)

## Remediation plan

**Status:** Phase 0 and Phase 1a complete; Phase 1b and 2 in progress

- [x] Phase 0: Stabilize CI (Nx targets, lint/test, Playwright auth)
- [x] Phase 1a: Core auth security (JWT verification, httpOnly cookies, logout on refresh, client-side key removal)
- [ ] Phase 1b: Advanced auth (XSS sanitization, token revocation storage, CSRF protection) - see Critical blockers
- [ ] Phase 2: Data and IO (file upload pipeline, pagination, Go time fix) - see High priority
- [ ] Phase 3: Security tab and admin UI (real API data, animated tiles, patriotic cards) - in progress
- [ ] Phase 4: Production hardening (logging cleanup, CORS tightening, configured ports)

## Completed (recent)

- [x] Add Playwright smoke test workflow for service monitoring
- [x] Add CI secret scanning workflow and local TruffleHog script
- [x] Wire `mongodb-memory-server` for local development and add graceful shutdown handling
- [x] Add `supertest` dev-dependency and fix e2e import errors
- [x] Remove inline styles from memorial-timeline components and add component SCSS rules
- [x] Fix markdown table spacing in websocket docs
- [x] Implement server-side AI proxy and remove client-side API key usage (placeholder `.env.example` added)
- [x] Commit local changes (held push per request)
- [x] Implement persistent admin hero area with 6 KPI tiles (2026-01-08) - `AdminHeroService`, `HeroTileComponent`, unit tests, and e2e tests complete

## Notes

- Temporary relaxations in `apps/craft-web/tsconfig.json` and `apps/craft-web/tsconfig.app.json` tracked in `TODO_reenable_strict.md`.

### Recent runtime / router log excerpts (dev)

- Auth guard: User is authorized to access route {url: '/timeline'}
- logger.service.ts:353 [OperatorSubscriber] Admin guard: User has admin permissions {url: '/timeline'}
- app.module.ts:72 Router event: ChildActivationStart {snapshot: ActivatedRouteSnapshot, type: 11}
- app.module.ts:72 Router event: ActivationStart {snapshot: ActivatedRouteSnapshot, type: 13}
- app.module.ts:72 Router event: GuardsCheckEnd {id: 3, url: '/timeline', urlAfterRedirects: '/timeline', state: RouterStateSnapshot, shouldActivate: true, …}
- app.module.ts:72 Router event: ResolveStart {id: 3, url: '/timeline', urlAfterRedirects: '/timeline', state: RouterStateSnapshot, type: 5}
- app.module.ts:72 Router event: ResolveEnd {id: 3, url: '/timeline', urlAfterRedirects: '/timeline', state: RouterStateSnapshot, type: 6}
- app.component.ts:313 debug-router: router-outlet deactivated AdminComponent {authService: AuthService, logger: LoggerService, paginator: undefined, serviceMetricsChartRef: undefined, systemMetricsChartRef: undefined, …}
- app.component.ts:307 debug-router: router-outlet activated TimelinePageComponent {loading: true, timelineEvents$: Observable, **ngContext**: 881}
- app.module.ts:72 Router event: ActivationEnd {snapshot: ActivatedRouteSnapshot, type: 14}
- app.module.ts:72 Router event: ChildActivationEnd {snapshot: ActivatedRouteSnapshot, type: 12}
- app.module.ts:72 Router event: ActivationEnd {snapshot: ActivatedRouteSnapshot, type: 14}
- app.module.ts:72 Router event: ChildActivationEnd {snapshot: ActivatedRouteSnapshot, type: 12}
- app.module.ts:72 Router event: NavigationEnd {id: 3, url: '/timeline', urlAfterRedirects: '/timeline', type: 1}
- logger.service.ts:356 [Object] Navigation ended {id: 3, url: '/timeline', urlAfterRedirects: '/timeline', type: 1}
- logger.service.ts:356 [Object] User navigated to /timeline
- app.module.ts:72 Router event: Scroll {routerEvent: Na
