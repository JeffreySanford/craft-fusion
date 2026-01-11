# Project TODOs (master list)

This file is the planning source of truth. It records decisions, risks, and the next sequence of work for a solo maintainer.

## Operating context

- Nx monorepo: Angular 19 (Material Design 3 Expressive) + NestJS + Go
- Current blockers: finalizing the cookie-based JWT lifecycle (refresh rotation, HttpOnly placement, revocation hooks) while cleaning up committed auth artifacts, and wiring the security tab/timeline surfaces to real backend traffic; Angular 19 test stability (Jest/Vitest) and CI fragility remain under watch but are not the sprint bottleneck today.
- Goal: reduce code and documentation while preserving production-grade security and correctness

## Priority focus

- Lock down authentication: keep the backend guard/refresh loop solid, persist refresh-token state in the seeded Mongo store, document the opportunities to tie the admin secret to deployment flags, and validate the cleanup of any legacy auth artifacts.
- Surface real data on the admin security tab and timeline: finish Findings/Evidence views, replace mocked arrays with API calls, handle loading/error states, and wire the CTA buttons so the UI can rely on the `security/*` endpoints rather than hand-wired data.
- Harden delivery readiness: unblock file uploads/pagination, stabilize logging/monitoring, and keep the Nx tasks (lint/test/e2e) green so deployments stay predictable while the new admin/shipping surfaces land.

## Critical blockers (fix before production)

- [x] Remove auth bypass and enforce JWT verification end-to-end (Nest + Angular) (2026-01-07) - `AuthGuard` now verifies both HTTP and WebSocket tokens and refuses missing/invalid credentials
- [x] Migrate tokens to HttpOnly cookies with refresh-token rotation (2026-01-07) - `AuthenticationController` sets httpOnly cookies; refresh calls rotate tokens through `RefreshTokenService`
- [x] Clear authentication on app load/refresh (2026-01-08) - app.component constructor now calls backend logout endpoint to clear httpOnly cookies, preventing auto-login on refresh
- [x] Remove committed auth artifacts and rotate secrets (2026-01-08) - removed checked-in placeholder responses
- [x] Block absolute-path traversal in file reads (2026-01-07) - `FileService` enforces storage root boundary
- [x] Replace hardcoded WS JWT secret with configured secret (2026-01-07) - `AuthGuard` uses `JwtService.verify` with `JWT_SECRET`
- [x] Remove client-side OpenAI key usage (2026-01-07) - all AI requests proxied through `/api/internal/ai/generate`

## High priority (current sprint)

- [ ] Wire security tab to real API data (replace mocked oscalProfiles, scaTop10, sboms, realtimeChecks)
- [ ] Complete timeline detail view (modal component with full event display)
- [ ] Implement pagination in records endpoints (Nest + Go)
- [ ] Reduce backend debug logging and replace with structured logs

## Deferred (post-MVP)

- [ ] Fix file upload pipeline end-to-end (FormData in UI, Multer/`@UploadedFile` in Nest, storage + serving)
- [ ] XSS sanitization (SafeHtml pipes, innerHTML hardening)
- [ ] Server-side token revocation storage (DB/Redis blacklist)
- [ ] CSRF protection for cookie-based authentication
- [ ] Use configured host/port when starting Nest (avoid hardcoded `app.listen(3000, ...)`)
- [ ] Fix Go record generation time (currently always 0 due to local variable scope)
- [ ] Normalize socket event names to `domain:entity:action` (timeline gateway)
- [ ] Tighten timeline gateway CORS in production (remove wildcard origin)

## Test strategy decision (Jest vs Vitest vs both)

**Context:** Angular 19 upgrade is blocked by Jest instability. Vitest experiments were unstable. We previously had Jest working, then lost the config.

### Option A: Jest only (status quo)

- Pros: Lowest surface area, keep existing Nest/lib tests.
- Cons: Angular 19 + Jest remains fragile and slow.

### Option B: Vitest only (modern)

- Pros: Fast, Vite-aligned, Angular-friendly.
- Cons: Requires migration for Nest/libs or leaving them untested.

### Option C: Run both (scoped, recommended)

- Pros: Pragmatic split: Vitest for Angular UI, Jest for Nest/libs.
- Cons: Higher maintenance and higher cognitive load.
- Guardrails to keep it sane:
  - Scope by project: `craft-web` uses Vitest only; `craft-nest` + libs keep Jest.
  - Do not run Jest and Vitest inside the same Angular project.
  - Enforce naming: `*.vitest.spec.ts` vs `*.jest.spec.ts`.
  - Separate Nx targets and CI lanes.
  - Add a migration checklist to remove Angular/Jest once Vitest stabilizes.

**Decision (current):** Option C with strict scoping and clear naming (Vitest only for Angular, Jest for Nest/libs). Revisit once Angular 19 + Vitest is stable.

## Test & lint status

- [x] Run Nx lint/test across workspace and capture failures (latest: all lint, unit tests, Playwright, and CI are passing)
- [x] Add Nx lint/test targets for `craft-web` if missing or misconfigured
- [x] Fix `craft-library` lint errors (`no-explicit-any`) and tsconfig warnings
- [x] Fix `craft-nest` unit test failures (controller specs, JSON module, mocks)
- [x] Fix `craft-go` tests (`handlers_test.go`)
- [x] Fix `craft-web-e2e` test runner warnings and `TransformStream` runtime issue
- [x] Fix Playwright storage state (`playwright/.auth/user.json`) used by e2e tests
- [x] Resolve Nx cache I/O errors (disable Nx Cloud or fix cache path)

### Latest run (2025-12-30)

- `pnpm dlx nx run-many -t lint` failed: `craft-library` has 3 `no-explicit-any` errors and a tsconfig input warning; `craft-nest` reports 226 warnings (no errors).
- `pnpm dlx nx run-many -t test` failed: `craft-go` fails `handlers_test.go`; `craft-nest` fails `UsersController` DI, `getData` assertions, and JSON module import; `craft-web-e2e` fails with Jest config warnings and `TransformStream` not defined.
- `craft-web` has no lint/test targets in run-many output (needs confirmation or target setup).

### Current run (2026-01-06)

- All lint, unit tests, Playwright, and GitHub CI passing.

### Latest run (2026-01-08)

**Status:** ✅ All tests passing (local and CI)

- Build: ✅ craft-web builds successfully (23s local, CI passing)
- CI: ✅ Full pipeline passing in 6m 36s (commit 2779f828)
- Login: Working correctly - users can login as admin
- Refresh: Now properly clears authentication on page refresh (backend logout endpoint called)
- E2E: ✅ craft-nest-e2e passing with MongoDB service container
- Lint: `craft-web` passes with one `security/detect-object-injection` warning in `services-dashboard.service.ts`
- Unit Tests: `craft-web` passes with some console logs but no failures
- Playwright: Global setup/teardown ensures `craft-nest` runs before tests

**Known Issues:**

- Expected 401 errors logged during unauthenticated state (reduced to debug level)
- Firefox e2e tests fail on admin dashboard and timeline components

## Admin dashboard UI/UX revamp (MD3 Expressive + patriotic)

**Problem:** The admin refactor reduced a 2000-line file into smaller sections, but the UI is now visually flat and hard to scan. Tabs look white-on-white with no card separation. The dashboard needs vibrant color, strong structure, and real-time tiles.

### Visual direction

- Use high-contrast patriotic palettes (navy/red/gold/white) with MD3 expressive tokens.
- Make every admin tab use visible cards or tiles; no white-on-white panels.
- Emphasize motion: staggered entry, animated counters, and responsive feedback.

### Work items

- [x] Define admin card system (sizes, padding, elevation, gradients, borders) (2026-01-07) – security tab cards now share the elevated patriotic gradients and hover treatment introduced in `security-dashboard.component.scss`.
- [x] Make every tab in the security section share the overview-style cards and gradients (2026-01-08) – `feature-card` now extends the `%security-card-base`, so OSCAL / SCA / SBOM / Real-Time tiles match the Overview vibe.
- [ ] Create real-time tile components (status, trend, delta, timestamp)
- [ ] Replace flat tables with card/tile groupings where appropriate
- [ ] Add animated KPI counters and chart reveals
- [x] Build persistent admin hero area (see `documentation/design/admin-dashboard.md` for detailed spec) (2026-01-08):
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
