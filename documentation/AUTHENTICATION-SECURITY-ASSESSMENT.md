# Authentication Security Assessment and Roadmap

Report date: 2025-12-30
Scope: UI and API authentication/authorization
Security rating: 2/10 (development-only, not production safe)

## Executive summary

Authentication works for demos but is not secure enough for production. There are multiple bypass paths and placeholder implementations. Tokens are stored in sessionStorage and remain exposed to XSS. Backend auth relies on hard-coded users and returns a generic authenticated user when the token is missing or invalid.

## Critical findings

1. Backend auth bypass via generic user fallback
   - File: `apps/craft-nest/src/app/auth/authentication/authentication.service.ts`
   - Behavior: returns a generic authenticated user if no Authorization header is provided or JWT verification fails.
   - Impact: any request can look authenticated.

2. Offline/dev login paths in frontend
   - File: `apps/craft-web/src/app/common/services/authentication.service.ts`
   - Behavior: allows offline and dev credential bypasses.
   - Impact: bypass of real authentication in production builds if not gated.

3. Duplicate AuthorizationService implementations
   - Files:
     - `apps/craft-web/src/app/common/services/authorization.service.ts`
     - `apps/craft-web/src/app/common/services/auth/authorization.service.ts`
   - Impact: inconsistent permission enforcement (one is placeholder).

## High-risk findings

- Tokens stored in sessionStorage (XSS-accessible).
- No server-side refresh token rotation or revocation store.
- Hard-coded users in Nest auth service (`admin/admin`, `user/user`, `test/test`).

## Medium-risk findings

- SessionService token validation is a placeholder.
- Auth WebSocket uses raw tokens without standard JWT refresh lifecycle.

## Roadmap

### Phase 1: Eliminate bypass paths

- Remove generic authenticated-user fallback in backend.
- Remove offline/dev login paths from production builds.
- Consolidate AuthorizationService to a single implementation.

### Phase 2: Real authentication

- Back user auth with a real user store.
- Hash and validate passwords with bcrypt (no plain text).
- Enforce JWT verification across all routes.

### Phase 3: Token hardening

- Move to HttpOnly cookies with refresh-token rotation.
- Add server-side revocation and session tracking.
- Add CSRF protection for cookie-based auth.

### Phase 4: Audit and monitoring

- Add auth event audit logs.
- Add rate limiting on auth endpoints.
- Add security testing for bypass attempts.

## Required tests

- Auth interceptor attaches tokens correctly.
- Unauthorized requests are rejected (backend guards).
- Refresh token rotation works end-to-end.
- Offline/dev login is gated to non-production builds.

Last updated: 2025-12-30

Verification status: Reviewed after recent refactor crash; findings still apply.
