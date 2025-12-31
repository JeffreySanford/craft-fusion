# API Services

This document describes the API-facing services used by the Angular frontend. It is intentionally limited to what exists in the codebase today.

## Core API services

| Service | Purpose | Location |
|---------|---------|----------|
| ApiService | Core HTTP communication | `apps/craft-web/src/app/common/services/api.service.ts` |
| ApiDiagnosticsService | API and socket diagnostics | `apps/craft-web/src/app/common/services/api-diagnostics.service.ts` |
| ApiLoggerService | API request/response log store | `apps/craft-web/src/app/common/services/api-logger.service.ts` |

## ApiService

The primary HTTP wrapper for the Angular app.

- Uses relative `/api` and `/api-go` paths for proxy compatibility.
- Adds trace headers and basic security headers on requests.
- Provides request throttling and a server availability check.
- Uses localStorage `auth_token` when building headers (separate from the auth interceptor).

Key methods (current):

- `get`, `post`, `put`, `delete`
- `authRequest` (auth-specific wrapper)
- `setApiUrl`, `getApiUrl`, `setRecordSize`

## ApiDiagnosticsService

Monitors API connectivity and Socket.IO health.

- Periodic health checks against `environment.apiUrl`.
- Socket monitoring for default and named namespaces.
- Exposes diagnostics streams for UI panels.

## ApiLoggerService

Stores recent API request logs for the admin/security dashboards.

- In-memory log buffer with filtering helpers.
- Streams logs via RxJS for UI consumption.

## HTTP interceptors

Interceptors live in `apps/craft-web/src/app/common/interceptors/`.

- `AuthHttpInterceptor` adds `Authorization` headers for non-auth endpoints.
- `LoggingHttpInterceptor` logs request/response metadata.
- `BusyHttpInterceptor` toggles busy state around requests.
- `MetricsInterceptor` tracks request timing.
- `ReadOnlyInterceptor` and `UserStateInterceptor` enforce UI-specific rules.

## Known gaps

- No cache layer, batch requests, or circuit breaker logic is implemented today.

## References

- [API Architecture](../architecture/API-ARCHITECTURE.md)
- [WebSocket Services](../architecture/websocket/SOCKET-SERVICES.md)
- [Authentication](../AUTHENTICATION.md)

Last Updated: 2025-12-30
