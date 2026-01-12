# Craft Fusion Services Index

## Overview

This document serves as the canonical index of all services within the Craft Fusion ecosystem, organized by category for easy reference. For detailed documentation, see the linked service category files below.

## Core API Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| ApiService | Core HTTP communication | `/apps/craft-web/src/app/common/services/api.service.ts` |
| ApiDiagnosticsService | API connectivity monitor | `/apps/craft-web/src/app/common/services/api-diagnostics.service.ts` |
| ApiLoggerService | API request logging | `/apps/craft-web/src/app/common/services/api-logger.service.ts` |
| ApiInterceptor | HTTP request interception | `/apps/craft-web/src/app/common/services/api-interceptor.ts` |

## Authentication Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| AuthenticationService | User auth management | `/apps/craft-web/src/app/common/services/authentication.service.ts` |
| SessionService | User session management | `/apps/craft-web/src/app/common/services/session.service.ts` |
| AuthorizationService | Permission management | `/apps/craft-web/src/app/common/services/authorization.service.ts` |
| AuthService | Alternative auth service | `/apps/craft-web/src/app/common/services/auth.service.ts` |

## WebSocket Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| SocketClientService | WebSocket client | `/apps/craft-web/src/app/common/services/socket-client.service.ts` |
| SocketService (backend) | WebSocket server service | `/apps/craft-nest/src/app/socket/socket.service.ts` |
| SocketGateway | WebSocket entrypoint | `/apps/craft-nest/src/app/socket/socket.gateway.ts` |
| YahooGateway | Financial data WebSocket | `/apps/craft-nest/src/app/yahoo/yahoo.gateway.ts` |
| HealthGateway | Health monitoring WS | `/apps/craft-nest/src/app/health/health.gateway.ts` |
| UserStateGateway | User state WebSocket | `/apps/craft-nest/src/app/socket/user-state.gateway.ts` |

## State Management Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| UserStateService | User state management | `/apps/craft-web/src/app/common/services/user-state.service.ts` |
| AdminStateService | Admin UI state | `/apps/craft-web/src/app/common/services/admin-state.service.ts` |
| SidebarStateService | Sidebar state | `/apps/craft-web/src/app/common/services/sidebar-state.service.ts` |
| FooterStateService | Footer state | `/apps/craft-web/src/app/common/services/footer-state.service.ts` |
| ThemeService | Theme state management | `/apps/craft-web/src/app/common/services/theme.service.ts` |
| UserTrackingService | User tracking | `/apps/craft-web/src/app/common/services/user-tracking.service.ts` |

## File Handling Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| FileUploadService | File uploading | `/apps/craft-web/src/app/common/services/file-upload.service.ts` |

## UI & UX Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| NotificationService | Toast notifications | `/apps/craft-web/src/app/common/services/notification.service.ts` |
| BusyService | Loading state management | `/apps/craft-web/src/app/common/services/busy.service.ts` |
| ChartLayoutService | Chart arrangement logic | `/apps/craft-web/src/app/common/services/chart-layout.service.ts` |
| PerformanceConfigService | Performance settings | `/apps/craft-web/src/app/common/services/performance-config.service.ts` |
| UserActivityService | User activity tracking | `/apps/craft-web/src/app/common/services/user-activity.service.ts` |

## External API Integration Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| YahooService | Financial data | `/apps/craft-web/src/app/common/services/yahoo.service.ts` |
| AlphaVantageService | Stock & forex data | `/apps/craft-web/src/app/common/services/alpha-vantage.service.ts` |
| FlightRadarService | Flight data | `/apps/craft-web/src/app/common/services/flightradar.service.ts` |
| OpenSkiesService | Flight & airport | `/apps/craft-web/src/app/common/services/openskies.service.ts` |
| MapboxService | Map display | `/apps/craft-web/src/app/common/services/mapbox.service.ts` |

## Logging & Diagnostics Services

| Service | Purpose | Location |
| :--- | :--- | :--- |
| LoggerService | Application logging | `/apps/craft-web/src/app/common/services/logger.service.ts` |
| ApiLoggerService | API logging | `/apps/craft-web/src/app/common/services/api-logger.service.ts` |

## See Also

- [API Services](./services/API-SERVICES.md)
- [WebSocket Services](./services/SOCKET-SERVICES.md)
- [Utility Services](./services/UTILITY-SERVICES.md)
- [Third-Party Services](./services/THIRD-PARTY-SERVICES.md)

For architectural information:

- [API Architecture](./architecture/API-ARCHITECTURE.md)
- [WebSocket Architecture](./architecture/WEBSOCKET-ARCHITECTURE.md)
- [State Management](./architecture/STATE-MANAGEMENT.md)

> **Note:** This is the canonical service index. For details, see the linked category documentation. If you find duplicate or outdated service lists elsewhere, please update or remove them.
