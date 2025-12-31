# Project TODOs (master list)

This file is the planning source of truth. It records decisions, risks, and the next sequence of work for a solo maintainer.

## Status legend

- [x] Done
- [ ] Not started / open

## Operating context

- Nx monorepo: Angular 19 (Material Design 3 Expressive) + NestJS + Go
- Current blocker: Angular 19 test stability (Jest/Vitest) and CI fragility
- Goal: reduce code and documentation while preserving production-grade security and correctness

## Critical blockers (fix before production)

- [ ] Remove auth bypass and enforce JWT verification end-to-end (Nest + Angular)
- [ ] Migrate tokens to HttpOnly cookies with refresh-token rotation and server-side revocation
- [ ] Remove committed auth artifacts and rotate secrets (`auth_resp.json`, `login_resp.json`)
- [ ] Block absolute-path traversal in file reads (enforce storage root boundary)
- [ ] Remove unsafe HTML rendering or sanitize aggressively (SafeHtml pipes, Markdown rendering, `innerHTML`)
- [ ] Replace hardcoded WS JWT secret with configured secret and verify expiration/claims
- [ ] Remove client-side OpenAI key usage and proxy all AI requests through the backend

## High priority (stability and correctness)

- [ ] Fix file upload pipeline end-to-end (FormData in UI, Multer/`@UploadedFile` in Nest, storage + serving)
- [ ] Align auth token storage plan (sessionStorage now, HttpOnly next) and document it clearly
- [ ] Use configured host/port when starting Nest (avoid hardcoded `app.listen(3000, ...)`)
- [ ] Implement dataset-size gating + pagination in records endpoints (Nest + Go)
- [ ] Fix Go record generation time (currently always 0 due to local variable scope)
- [ ] Normalize socket event names to `domain:entity:action` (timeline gateway)
- [ ] Tighten timeline gateway CORS in production (remove wildcard origin)
- [ ] Reduce backend debug logging and replace with structured logs

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

- [x] Run Nx lint/test across workspace and capture failures (see latest run below)
- [ ] Add Nx lint/test targets for `craft-web` if missing or misconfigured
- [ ] Fix `craft-library` lint errors (`no-explicit-any`) and tsconfig warnings
- [ ] Fix `craft-nest` unit test failures (controller specs, JSON module, mocks)
- [ ] Fix `craft-go` tests (`handlers_test.go`)
- [ ] Fix `craft-web-e2e` test runner warnings and `TransformStream` runtime issue
- [ ] Fix Playwright storage state (`playwright/.auth/user.json`) used by e2e tests
- [ ] Resolve Nx cache I/O errors (disable Nx Cloud or fix cache path)

### Latest run (2025-12-30)

- `pnpm dlx nx run-many -t lint` failed: `craft-library` has 3 `no-explicit-any` errors and a tsconfig input warning; `craft-nest` reports 226 warnings (no errors).
- `pnpm dlx nx run-many -t test` failed: `craft-go` fails `handlers_test.go`; `craft-nest` fails `UsersController` DI, `getData` assertions, and JSON module import; `craft-web-e2e` fails with Jest config warnings and `TransformStream` not defined.
- `craft-web` has no lint/test targets in run-many output (needs confirmation or target setup).

## Admin dashboard UI/UX revamp (MD3 Expressive + patriotic)

**Problem:** The admin refactor reduced a 2000-line file into smaller sections, but the UI is now visually flat and hard to scan. Tabs look white-on-white with no card separation. The dashboard needs vibrant color, strong structure, and real-time tiles.

### Visual direction

- Use high-contrast patriotic palettes (navy/red/gold/white) with MD3 expressive tokens.
- Make every admin tab use visible cards or tiles; no white-on-white panels.
- Emphasize motion: staggered entry, animated counters, and responsive feedback.

### Work items

- [ ] Define admin card system (sizes, padding, elevation, gradients, borders)
- [ ] Create real-time tile components (status, trend, delta, timestamp)
- [ ] Replace flat tables with card/tile groupings where appropriate
- [ ] Add animated KPI counters and chart reveals (prefers-reduced-motion compliant)
- [ ] Add top-level admin hero area with summary metrics and alerts
- [ ] Align typography with the real font stack in `apps/craft-web/src/styles/_typography.scss`

## Security tab spec (draft)

**Goal:** A dedicated security surface with a horizontal top navigation that switches views. It should show evidence of continuous security testing (OSCAL scans, SCA Top 10, SBOMs, real-time checks) with clear pass/fail signals and artifacts.

### Top nav views (horizontal)

- Overview
- OSCAL Scans
- SCA Top 10
- SBOMs
- Real-Time Tests
- Findings
- Evidence

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

## Documentation consolidation

**Goal:** TODO.md is the main planning doc. The rest of the docs should be canonical, non-duplicative, and consistent with coding standards.

- [x] Create a documentation index with canonical sources
- [x] Fix broken docs and duplicate content (deployment, security monitoring, auth)
- [x] Update auth documentation to reflect current implementation and risks
- [x] Remove emoji-heavy/placeholder text from docs to keep them direct and accurate
- [x] Align testing docs with Nx-only commands
- [x] Add new docs for admin dashboard UI and security tab spec

## Verification status (post-refactor crash)

- [x] Re-verified TODO.md for accuracy and completion status
- [x] Re-verified security docs for current-state accuracy (see `documentation/SECURITY-MONITORING.md` and `documentation/AUTHENTICATION-SECURITY-ASSESSMENT.md`)
- [ ] Re-verify auth flow end-to-end after lint/test fixes

## Remediation plan (proposed sequence)

- [ ] Phase 0: Stabilize CI (restore Nx targets, fix lint/test failures, fix Playwright auth state)
- [ ] Phase 1: Security (real auth, JWT strategy, WS auth, XSS sanitization, secret hygiene)
- [ ] Phase 2: Data and IO (file upload/storage, path validation, pagination)
- [ ] Phase 3: Standards and quality (remove standalone usage, event naming, logging hygiene)
- [ ] Phase 4: Admin UI overhaul + security tab build

## Completed (recent)

- [x] Add Playwright smoke test workflow for service monitoring
- [x] Add CI secret scanning workflow and local TruffleHog script
- [x] Wire `mongodb-memory-server` for local development and add graceful shutdown handling
- [x] Add `supertest` dev-dependency and fix e2e import errors
- [x] Remove inline styles from memorial-timeline components and add component SCSS rules
- [x] Fix markdown table spacing in websocket docs
- [x] Implement server-side AI proxy and remove client-side API key usage (placeholder `.env.example` added)
- [x] Commit local changes (held push per request)

## Notes

- Temporary relaxations in `apps/craft-web/tsconfig.json` and `apps/craft-web/tsconfig.app.json` tracked in `TODO_reenable_strict.md`.

### Recent runtime / router log excerpts (dev)

- Auth guard: User is authorized to access route {url: '/family'}
- logger.service.ts:353 [OperatorSubscriber] Admin guard: User has admin permissions {url: '/family'}
- app.module.ts:72 Router event: ChildActivationStart {snapshot: ActivatedRouteSnapshot, type: 11}
- app.module.ts:72 Router event: ActivationStart {snapshot: ActivatedRouteSnapshot, type: 13}
- app.module.ts:72 Router event: GuardsCheckEnd {id: 3, url: '/family', urlAfterRedirects: '/family', state: RouterStateSnapshot, shouldActivate: true, …}
- app.module.ts:72 Router event: ResolveStart {id: 3, url: '/family', urlAfterRedirects: '/family', state: RouterStateSnapshot, type: 5}
- app.module.ts:72 Router event: ResolveEnd {id: 3, url: '/family', urlAfterRedirects: '/family', state: RouterStateSnapshot, type: 6}
- app.component.ts:313 debug-router: router-outlet deactivated AdminComponent {authService: AuthService, logger: LoggerService, paginator: undefined, serviceMetricsChartRef: undefined, systemMetricsChartRef: undefined, …}
- app.component.ts:307 debug-router: router-outlet activated TimelinePageComponent {loading: true, timelineEvents$: Observable, **ngContext**: 881}
- app.module.ts:72 Router event: ActivationEnd {snapshot: ActivatedRouteSnapshot, type: 14}
- app.module.ts:72 Router event: ChildActivationEnd {snapshot: ActivatedRouteSnapshot, type: 12}
- app.module.ts:72 Router event: ActivationEnd {snapshot: ActivatedRouteSnapshot, type: 14}
- app.module.ts:72 Router event: ChildActivationEnd {snapshot: ActivatedRouteSnapshot, type: 12}
- app.module.ts:72 Router event: NavigationEnd {id: 3, url: '/family', urlAfterRedirects: '/family', type: 1}
- logger.service.ts:356 [Object] Navigation ended {id: 3, url: '/family', urlAfterRedirects: '/family', type: 1}
- logger.service.ts:356 [Object] User navigated to /family
- app.module.ts:72 Router event: Scroll {routerEvent: Na
