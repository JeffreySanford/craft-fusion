# Service Monitoring Fixes and Security Improvements ✅

## Summary

This page documents the Service Monitoring bug, the fixes implemented, testing added, and recommended follow-ups to prevent regressions and harden the system.

## Background

- Problem: Clicking the **Service Monitoring** tab caused continuous polling/updates and chart/UI churn, often combined with a logout bug that left an `isAdmin` flag persisted in localStorage and could lock the browser session.
- Impact: UI instability, heavy API/JS churn, and a stale-admin state after logout.

## What was fixed 🔧

- Frontend
  - Stopped infinite monitoring updates by making monitoring polling deterministic and pausing when the tab is inactive or on logout.
  - Fixed logout to remove persisted `isAdmin` and clear auth tokens from localStorage in `authentication.service.ts` (ensures monitoring stops and admin state is revoked).
  - Added RxJS lifecycle improvements (takeUntil/unsubscribe) to avoid lingering subscriptions that cause repeated polls.
  - Logger back-pressure / rate limiting to reduce log spam and console churn.

- Backend / Dev tools
  - Added runtime checks to fail early if critical secrets are missing (e.g., `JWT_SECRET`, `MONGO_URI`) during production startup.
  - Created cross-platform helper scripts: `scripts/start-craft-go.js` (picks proper binary on Windows) and `scripts/check-dist-lock.js` (detect locked dist dirs and provides SKIP_DIST_LOCK bypass for local debugging).

- Tests
  - Added a Playwright headless smoke test: `scripts/test-service-monitoring.js`. It exercises login → Admin → Service Monitoring, observes network calls and console output, then performs logout and verifies monitoring stops and tokens/state are cleared.

## How to run the smoke test locally 🧪

1. Install Playwright browsers (required once):
   - npx playwright install --with-deps
2. Run the test (headless):
   - node ./scripts/test-service-monitoring.js
3. Expected result: API call count during monitoring > 0, and after logout: API calls stop and localStorage `auth_token` / `isAdmin` are null.

## Files to review (recent changes) 📁

- scripts/test-service-monitoring.js — Playwright smoke test (new)
- scripts/check-dist-lock.js — dist lock detection and SKIP_DIST_LOCK support
- scripts/start-craft-go.js — cross-platform Go launcher
- apps/craft-web/src/app/common/services/auth/authentication.service.ts — logout clears `isAdmin`
- apps/craft-web/src/app/pages/admin/ — monitoring UI updates (polling lifecycle improvements)
- apps/craft-nest/src/main.ts and auth guards — startup checks for JWT_SECRET/MONGO_URI

## Recommended follow-ups (prioritized) 📋

1. Integrate the Playwright smoke test into CI (run on PRs) — **High priority / Low effort** ✅
   - **Done:** `.github/workflows/playwright-smoke.yml` added and runs on PRs, pushes to `main`, and nightly schedule to detect flakiness.
   - What the workflow does:
     - Installs Node dependencies and Playwright browsers (`npx playwright install --with-deps`).
     - Runs `node ./scripts/test-service-monitoring.js` headless and captures stdout/stderr to `smoke-test-output.txt`.
     - Implements a single retry when the smoke test fails once.
     - Uploads artifacts: `smoke-test-output.txt` and `playwright-report/**` for debugging.
   - Acceptance criteria: Smoke test runs in PR CI, artifacts are uploaded on failure, failing tests block merges, and nightly runs detect intermittent flakes.

2. Add a CI secret-scan job (e.g., gitleaks or GitHub secret scanning) — **High priority / Low effort** ✅
   - **Done:** `.github/workflows/secret-scan.yml` added; it runs on PRs, pushes to `main`, and on a weekly schedule.
   - **Added:** TruffleHog is now included as a step in the secret scan workflow, producing `trufflehog-report.json` as an artifact.
   - Next: tune gitleaks/trufflehog rules, add an allowlist or repository baseline if necessary, and schedule a historical scan.

3. Add a scheduled repository secret history scan and remediation plan — **Medium**
4. Move refresh-token storage to HttpOnly cookies and add server-side refresh token rotation + revocation store — **High priority / Medium–High effort** (design + staged rollout needed)
5. Add e2e test guard rails (flaky test detection, test timeouts) and run the smoke test on merge to main — **Medium**
   - Suggestion: Add a nightly stability job that runs the smoke test and reports flakiness rates.
6. Cleanup tracked build artifacts and update `.gitignore` to avoid committed dist/cache files — **Low**

---

**Implementation note:** I can create `.github/workflows/playwright-smoke.yml` to implement the CI job next (it will install browsers, run the smoke test, collect artifacts, and optionally retry once on failure). Let me know if I should open a PR to add that workflow now.

## Acceptance Criteria for CI changes ✅

- Playwright smoke test must run and pass on PRs targeting the web UI or backend changes that may affect auth or monitoring.

- Secret-scan job fails the PR if new high-confidence secrets are introduced.

- The refresh-token migration must include tests for cookie-based refresh and server revocation endpoints.

## Notes & Links 💡

- Local reproduction and validated fix have been executed and verified by the smoke test.
- For the refresh token design, see: `documentation/AUTHENTICATION.md` and consider adding a design doc before implementation.

---

If you want, I can add the Playwright smoke test to CI and create the secret-scan job in a follow-up PR. 🔒
