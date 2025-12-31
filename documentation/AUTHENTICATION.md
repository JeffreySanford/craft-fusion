# Authentication and Authorization

This document describes the current auth structure and known limitations. It is a structural overview; risk details are in `documentation/AUTHENTICATION-SECURITY-ASSESSMENT.md`.

## Frontend (Angular)

### AuthenticationService (canonical)

- File: `apps/craft-web/src/app/common/services/authentication.service.ts`
- Responsibilities:
  - Login/logout, token storage, and auth state (BehaviorSubject)
  - Session storage of `auth_token`, `auth_refresh_token`, and expiry
  - Offline/dev fallback login paths (demo-only)
  - Token refresh scheduling
  - Auth WebSocket channel for session events

### Auth HTTP interceptor

- File: `apps/craft-web/src/app/common/interceptors/auth.interceptor.ts`
- Adds `Authorization: Bearer <token>` to non-auth endpoints.

### SessionService

- File: `apps/craft-web/src/app/common/services/session.service.ts`
- Stores the username in sessionStorage.
- `validateToken` is a placeholder and not a real token validation strategy.

### AuthorizationService (two versions)

- Canonical: `apps/craft-web/src/app/common/services/authorization.service.ts`
- Placeholder: `apps/craft-web/src/app/common/services/auth/authorization.service.ts`

The placeholder service returns `resource !== 'admin'` and should not be used for real access control.

### AuthService facade

- File: `apps/craft-web/src/app/common/services/auth/auth.service.ts`
- Facade over `AuthenticationService` and a placeholder `AuthorizationService`.
- Uses guest access logic and does not enforce real permissions.

## Backend (NestJS)

### AuthService

- File: `apps/craft-nest/src/app/auth/auth.service.ts`
- Uses hard-coded users (admin/user/test) with mock credentials.
- JWTs are signed and verified but not tied to a real user store.

## Known limitations (current)

- Offline/dev login is available and bypasses real auth.
- Tokens live in `sessionStorage` (still exposed to XSS).
- Duplicate AuthorizationService implementations create inconsistent behavior.

## Next steps

- Consolidate to one AuthorizationService and remove placeholder paths.
- Remove offline/dev login paths from production builds.
- Move tokens to HttpOnly cookies with refresh rotation.
