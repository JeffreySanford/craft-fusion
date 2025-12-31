# WebSocket Connection Behavior

## Connection flow (current)

- `SocketClientService` initializes a Socket.IO connection on startup.
- It uses `environment.socket.url` (defaults to `ws://localhost:3000`) with the `/socket.io` path.
- `ApiDiagnosticsService` can monitor the default socket and named namespaces.
- `WebsocketService` is a legacy wrapper that connects via `/socket` using raw WebSocket APIs.

## Backend behavior

- Gateways log `connect`/`disconnect` events in NestJS.
- Namespaces in use: `health`, `yahoo`, `user-state`, and `timeline`.

## Production notes

- Gateway CORS is currently `origin: '*'`. Tighten before exposing to the public internet.
- Ensure Apache reverse proxy rules exist for `/socket.io` (and `/socket` only if `WebsocketService` is still used).

## Quick checks

- Verify NestJS is running on port 3000.
- Confirm the proxy config and environment socket URL match the deployed host.

Last Updated: 2025-12-30
