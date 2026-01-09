# Authentication Security Assessment and Roadmap

Report date: 2026-01-08
Scope: UI and API authentication/authorization
Security rating: 2/10 (development-only, not production safe)

## Executive summary

Authentication currently works for demos, but it is still backed by placeholder credentials and lacks hardened token handling. The Nest backend signs and verifies JWTs with `JwtService`/`JWT_SECRET`, and `AuthGuard` now rejects missing or invalid tokens, but the system still relies on a hard-coded user map and legacy tokens (the Playwright/guest overrides have been removed) while the cookie/refresh story is unfinished.

## Critical findings

1. **Hard-coded user map (demo credentials).**
   - File: `apps/craft-nest/src/app/auth/auth.service.ts`
   - Behavior: `validateUser` only recognizes the in-memory `admin/user/test` records and returns JWTs based on those roles.
   - Impact: There is no real user store, no bcrypt hashing, and every successful login returns one of the demo identities.

2. **Frontend guest/override helpers bypass real auth flows (resolved 2026-01-08).**
   - Files: `apps/craft-web/src/app/common/services/auth/auth.service.ts`, `apps/craft-web/src/app/common/services/authentication.service.ts`
   - Status: All `loginAsGuest()` and Playwright override logic has been removed. Every session now comes through the backend authentication endpoints.
   - Current behavior: App initialization calls `authService.logout()` to clear httpOnly cookies, ensuring no auto-login on refresh.
   - Impact: Risk eliminated; only backend login flow exists.

3. **Duplicate AuthorizationService implementations.**
   - Files:
     - `apps/craft-web/src/app/common/services/authorization.service.ts`
     - `apps/craft-web/src/app/common/services/auth/authorization.service.ts`
   - Impact: Two different permission engines exist and can diverge, making it hard to guarantee consistent role checks.

## High-risk findings

- Token storage and refresh are unprotected (no HttpOnly cookies, no refresh/revocation infrastructure).
- The backend still issues only bearer tokens without additional CSRF guards.
- Dev-only admin secret (`ADMIN_SECRET`) elevates every login to admin, so the UI must ensure that secret is only populated in trusted environments.

## Medium-risk findings

- `SessionService.validateToken` is a placeholder that compares a stored username rather than the JWT.
- The auth WebSocket does not yet implement a refresh lifecycle; it trusts the same JWT that the HTTP guard verifies.
- The frontend still expects the backend to surface roles via the `roles` array instead of a richer permission set.

## Roadmap

### Phase 1: Eliminate bypass paths

- Guard every HTTP and WebSocket route with JWT verification (implemented via `AuthGuard`).
- Guest helpers and Playwright overrides have been removed; continue to verify that only the backend login flow exists.
- Consolidate the AuthorizationService implementations.

### Phase 2: Real authentication

- Back auth with a real user store (database, hashed passwords).
- Enforce role/permission claims in the JWT payload.
- Surface richer user metadata (`permissions`, `status`, `lastLoginAt`) in the response so the UI can turn RBAC into visuals.

### Phase 3: Token hardening

- Move to HttpOnly cookies with refresh-token rotation and server-side revocation.
- Tie refresh tokens to sessions and add CSRF protections around the cookie-based auth flow.
- Replace manual `AuthGuard` checks with shared interceptors/middleware that read the secured cookie automatically.

### Phase 4: Audit and monitoring

- Add auth event audit logs.
- Add rate limiting on auth endpoints.
- Add security testing for bypass attempts.

## Status alignment with TODO (2026-01-08)

- **Remove auth bypass and enforce JWT verification end-to-end** – completed 2026-01-08: backend guards reject missing/invalid tokens (`AuthGuard` + `AuthenticationService.getUserFromToken`), and frontend guest helpers (`AuthService.loginAsGuest`, Playwright override) have been removed. Every session now requires valid JWT from backend login flow.
- **Admin secret for role elevation** – `ADMIN_SECRET` in `.env` still forces every login to include `roles: ['admin']`. Remove this secret or gate the environment so only trusted deployments see admin privileges.
- **Migrate tokens to HttpOnly cookies with refresh-token rotation and server-side revocation** – completed 2026-01-07: `AuthenticationController.login`/`refresh-token` rotate tokens in the Mongo `refresh_tokens` collection, `RefreshTokenService` consumes and revokes the entries, and the guard reads the cookies.
- **Clear authentication on app load/refresh** – completed 2026-01-08: `app.component.ts` constructor calls backend logout endpoint (`POST /api/auth/logout`) to clear httpOnly cookies on every app initialization, preventing auto-login on refresh. See `documentation/AUTHENTICATION.md` for details.
- **Remove committed auth artifacts and rotate secrets** – completed; the placeholder `auth_resp.json` and `login_resp.json` were removed, so sensitive auth samples should live only in secret stores.
- **Block absolute-path traversal in file reads** – completed on 2026-01-07: the file services now normalize paths under `apps/craft-nest/storage` before reading.
- **Remove unsafe HTML rendering or sanitize aggressively** – still open; `SafeHtmlPipe` (`apps/craft-web/src/app/common/pipes/safe-html.pipe.ts`) still calls `bypassSecurityTrustHtml`, leaving Markdown rendering risky.
- **Replace hardcoded WS JWT secret with configured secret and verify expiration/claims** – completed on 2026-01-07: `AuthGuard` verifies every HTTP and WebSocket token using `JwtService`/`JWT_SECRET`, so the legacy literal secret guard is retired.
- **Remove client-side OpenAI key usage and proxy all AI requests through the backend** – completed on 2026-01-07: `OpenAIService` posts to `/api/internal/ai/generate`, and the backend reads `OPENAI_API_KEY` from the server config.

## Required tests

- Auth guard rejects unauthenticated access on both HTTP and WebSocket flows.
- Admin-only UI greys out or hides when no admin token is present.
- Refresh-token rotation and revocation logic (now backed by the Mongo `refresh_tokens` collection) must be exercised end-to-end.
- Guest/Playwright overrides must be disabled in production/test builds so they cannot bypass these protections.

Last updated: 2026-01-08

Verification status: Reviewed after recent refactor crash; findings still apply.
