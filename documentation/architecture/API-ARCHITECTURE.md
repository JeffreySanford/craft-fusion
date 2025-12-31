# API Architecture

## Overview

Craft Fusion uses a single HTTP entrypoint on the frontend (`ApiService`) that routes requests to the NestJS and Go backends. The service uses relative `/api` and `/api-go` paths so the Angular dev server proxy and production reverse proxy can handle routing.

## Frontend components

- `ApiService` (`apps/craft-web/src/app/common/services/api.service.ts`)
  - GET/POST/PUT/DELETE with shared headers, tracing ID, and basic request throttling.
  - Switches between `/api` and `/api-go` via `setApiUrl`.
  - Uses localStorage `auth_token` in headers (this is separate from the auth interceptor).
- `ApiDiagnosticsService` (`apps/craft-web/src/app/common/services/api-diagnostics.service.ts`)
  - Periodic health checks and socket diagnostics (default and namespaced sockets).
  - Exposes diagnostics streams for the admin dashboard.
- `ApiLoggerService` (`apps/craft-web/src/app/common/services/api-logger.service.ts`)
  - Stores recent request/response logs for UI consumption.
- HTTP interceptors (`apps/craft-web/src/app/common/interceptors/`)
  - `AuthHttpInterceptor`, `LoggingHttpInterceptor`, `BusyHttpInterceptor`, `MetricsInterceptor`, `ReadOnlyInterceptor`, `UserStateInterceptor`.

## Backend integration

- NestJS API runs on port 3000 by default and exposes `/api/*` plus Socket.IO at `/socket.io`.
- Go API runs on port 4000 by default and is exposed through `/api-go/*`.

## Current constraints

- There is no circuit breaker, batch API, or cache layer implemented in the current codebase.
- Angular environment files are generated from `.env` via `apps/craft-web/generate-env.js`.

## References

- [API Services](../services/API-SERVICES.md)
- [WebSocket Services](./websocket/SOCKET-SERVICES.md)
- [Authentication](../AUTHENTICATION.md)

Last Updated: 2025-12-30
