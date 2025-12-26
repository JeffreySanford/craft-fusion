# Project TODOs (master list)

This file collects current action items discovered across the repository and recommended follow-ups based on recent Service Monitoring and security work.

## Status legend

- [x] Done
- [ ] Not started / open

## High priority

- [x] Integrate `scripts/test-service-monitoring.js` as a Playwright e2e test in CI (run on PRs) — owner: SRE / frontend, effort: low ✅
  - Workflow created: `.github/workflows/playwright-smoke.yml`
    - Installs Playwright browsers and dependencies
    - Runs `node ./scripts/test-service-monitoring.js` headless, captures output to `smoke-test-output.txt`
    - Retries once on initial failure
    - Uploads artifacts: `smoke-test-output.txt`, `playwright-report/**`
    - Nightly run added to detect flakiness and stability regressions
- [x] Add a CI secret-scan job (gitleaks or GitHub Secret Scanning) and schedule a repo-wide historical scan — owner: DevOps, effort: low ✅
  - Workflow added: `.github/workflows/secret-scan.yml` (runs on PRs, pushes to `main`, and weekly schedule)
  - Added TruffleHog scanning step to `.github/workflows/secret-scan.yml` and npm script `scan:secrets:trufflehog` to run locally.
- [ ] Design & implement refresh-token migration to HttpOnly cookies with server-side rotation and revocation store — owner: backend, effort: medium-high

## Medium priority

- [ ] Add the Playwright smoke test to the official e2e suite and gating on merges — owner: frontend/test, effort: low
- [ ] Add flaky-test detection and timeouts to prevent CI hangs — owner: test infra, effort: medium
- [ ] Clean up tracked build artifacts and ensure `.gitignore` excludes `dist/`, `.angular/cache`, and other generated files — owner: repo maintainers, effort: low

## Low priority / Nice to have

- [ ] Add a scheduled job to run secret-scan weekly and report to SEC team — owner: DevOps, effort: low
- [ ] Add monitoring/alerting for abnormal API call rates from UI endpoints (detect UI polling spikes) — owner: monitoring, effort: medium

## TODOs discovered in source (actionable)

- apps/craft-web/src/app/pages/header/header.component.ts
  - TODO: show notification or UI feedback — Suggestion: display a toast when certain network errors or auth events occur.

- apps/craft-web/src/app/common/services/auth/authentication.service.ts
  - TODO: Implement token validation logic — Suggestion: validate token shape and expiry client-side and add unit tests.

- apps/craft-web/src/app/common/services/logger.service.ts
  - TODO: Implement actual health check logic
  - TODO: Implement actual log fetching logic — Suggestion: complete health-check APIs and backfill logger endpoints.

## How to proceed

1. Prioritize CI secret scanning and Playwright CI integration (blocks future regressions).
2. Open small PRs:
   - Add Playwright test to CI
   - Add `.github/workflows/secret-scan.yml`
   - Add `.gitignore` cleanup PR removing tracked dist files and ensure they are ignored going forward
3. Plan the longer refresh-token migration as a design RFC with tests and rollback plan.

---

If you'd like, I can open the PRs for the CI changes and `.gitignore` cleanup next. Let me know which to do first.
