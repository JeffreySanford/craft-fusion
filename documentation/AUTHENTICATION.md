# Authentication and Authorization

This document describes the current auth architecture, the integration points between Angular and Nest, and the most obvious gaps we are tracking.

## Frontend (Angular)

### AuthenticationService (canonical)

- Manages login/logout, user state, refresh scheduling, and the auth WebSocket channel. It publishes the `authState`, `isLoggedIn$`, and `isAdmin$` streams that drive the rest of the UI.
- Calls `ApiService.authRequest('POST', 'auth/login', …)` for credentials, reschedules refreshes, and validates the session via `/api/auth/user`. All authentication state is derived from the HttpOnly cookies the backend sets; no tokens are persisted in `sessionStorage` or `localStorage`.
- Offline/guest/Playwright overrides have been removed so every session must go through the backend authentication endpoints.

### Logout on refresh behavior (2026-01-08)

- **App initialization clears authentication:** When the Angular app loads (including on page refresh), `AppComponent.constructor()` immediately calls `this.authService.logout()` to ensure all authentication state is cleared.
- **Backend logout endpoint called:** The `logout()` method now makes a POST request to `/api/auth/logout` to clear the httpOnly cookies on the server before clearing local state. This ensures that subsequent authentication checks via `/api/auth/user` will return 401.
- **User must re-authenticate after refresh:** Every page refresh or fresh browser session requires the user to log in again. There is no persistent session across refreshes.
- **Expected 401 errors:** During app initialization, the frontend calls `/api/auth/user` to check for an existing session. Since cookies are cleared on load, this request returns 401 (logged at debug level, not as an error).
- **Rationale:** This design prevents session hijacking and ensures clean authentication state on every app load. Future iterations may introduce opt-in persistent sessions with explicit user consent and additional security measures.

### Interceptors and request plumbing

- There is no dedicated `auth.interceptor.ts`; authentication happens via cookies or tokens issued by the backend. `ApiService` already adds tracing headers, timeouts, and retries before delegating to `HttpClient`.
- The active interceptors are logging, busy, metrics, readonly, and user-state interceptors—they instrument requests, surface busy states, and emit visit telemetry.

### SessionService

- Stores only the username in `sessionStorage` today to power the telemetry hooks and simple UX (not tokens).
- `validateToken` is currently a placeholder that compares the stored username to a provided string; it will be replaced once the token storage strategy is hardened.

### AuthorizationService(s) and AuthService facade

- The main `AuthorizationService` under `common/services/authorization.service.ts` enforces the current role/access rules, while a legacy placeholder lives under `common/services/auth/authorization.service.ts`. The facade now simply delegates to `AuthenticationService` for login/logout and exposes the relevant observables for downstream consumers.

## Backend (NestJS)

### Authentication Service and controller

- `apps/craft-nest/src/app/auth/authentication/authentication.service.ts` now derives every session from the credentials defined in `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, and the optional `AUTH_EMAIL_DOMAIN`). Admin elevation only occurs when those secrets match (or via the legacy `test/test` shortcut), so be careful with those values in local/dev environments.
  - `AuthenticationController` wires login/refresh/logout/user requests to the service, sets HttpOnly `AccessToken`/`RefreshToken` cookies, and exposes the decoded payload so the guards and clients can consume the `sub`, `username`, and `roles` claims.
  - The Postgre/Mongo seeding pipeline now reads `VALUED_MEMBER_TOKEN` (and optional `VALUED_MEMBER_USERNAME`/`VALUED_MEMBER_ROLES`) directly from `.env` to populate `api_tokens`. The auto-login flow consumes that token, verifies it with `JWT_SECRET`, and returns the `valued-member` profile, so rotating the secret still invalidates the stored session until the environment variable is updated.

### AuthGuard

- `apps/craft-nest/src/app/auth/auth.guard.ts` now verifies every HTTP and WebSocket connection using `JwtService` and `JWT_SECRET`.
- The guard rejects missing or invalid tokens and attaches the decoded payload to `request.user` (or `socket.data.user`), so downstream services can rely on the token claims instead of a hard-coded “authenticated-user”.
- The guard supports WebSocket sessions by extracting cookies from the handshake and validating them before emitting events.

### Admin secret mode

- If `ADMIN_SECRET` is defined in `.env`, the backend treats every login as an admin session and issues tokens/roles that include `'admin'`. The secret never leaves the server, and removing it drops the admin privileges until a real user store is implemented.

## Known limitations and risks

- Auth is still backed by the handful of `.env`-seeded credentials and the in-memory Mongo seeding process; there is no fully-featured user directory yet, so guard the admin secrets when running in trusted environments.
- The frontend relies entirely on the HttpOnly cookies issued by the backend; refresh/rotation logic now persists refresh tokens via `RefreshTokenService` into the Mongo `refresh_tokens` collection so they survive restarts, with TTL indexing keeping expiry clean.
- `SessionService.validateToken` is a placeholder and the backend now tracks refresh token revocations through the same Mongo collection, so the next step is hooking alerts/metrics around that collection.

## Next steps

- Harden the refresh-token rotation by monitoring the Mongo `refresh_tokens` collection (seeded via `mongodb-memory-server` for portfolio) and ensure the Angular `AuthenticationService` never stores cookies locally while it relies on the server-set HttpOnly tokens.
- Consolidate the AuthorizationService implementations and ensure the single facade remains the canonical access policy surface.
