# Socket.IO Services in Craft Fusion

## Overview

NestJS provides Socket.IO gateways for real-time features. Angular connects through `SocketClientService` (Socket.IO) and `ApiDiagnosticsService` (health/namespace monitoring). A legacy `WebsocketService` still exists for direct WebSocket usage.

## Backend gateways (NestJS)

| Gateway | Namespace | Purpose | Location |
| --------- | ----------- | --------- | ---------- |
| SocketGateway | default | Base socket events (guest/session) | `apps/craft-nest/src/app/socket/socket.gateway.ts` |
| UserStateGateway | `user-state` | User state updates | `apps/craft-nest/src/app/socket/user-state.gateway.ts` |
| HealthGateway | `health` | Health metrics streaming | `apps/craft-nest/src/app/health/health.gateway.ts` |
| YahooGateway | `yahoo` | Financial data updates | `apps/craft-nest/src/app/yahoo/yahoo.gateway.ts` |
| TimelineGateway | `timeline` | Timeline event broadcasts | `apps/craft-nest/src/app/family/timeline/timeline.gateway.ts` |

## Backend helpers

- `SocketService` emits server-side events: `apps/craft-nest/src/app/socket/socket.service.ts`.

## Frontend clients

| Client | Purpose | Location |
| -------- | --------- | ---------- |
| SocketClientService | Primary Socket.IO client | `apps/craft-web/src/app/common/services/socket-client.service.ts` |
| ApiDiagnosticsService | Socket diagnostics and namespace health | `apps/craft-web/src/app/common/services/api-diagnostics.service.ts` |
| WebsocketService | Legacy direct WebSocket wrapper | `apps/craft-web/src/app/common/services/websocket.service.ts` |

## Notes

- Gateways currently allow `origin: '*'` CORS. Tighten this for production.
- `SocketClientService` uses `environment.socket.url` and the default `/socket.io` path.
- `WebsocketService` uses the `/socket` path in dev; keep proxy rules in sync if still used.

## References

- [WebSocket Behavior](./WEBSOCKET-BEHAVIOR.md)
- [Proxy Configuration](../../guides/PROXY-CONFIGURATION.md)

Last Updated: 2025-12-30
