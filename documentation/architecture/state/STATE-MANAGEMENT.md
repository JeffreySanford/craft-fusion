# State Management

## Overview

Craft Web stores client state in Angular services using RxJS `BehaviorSubject`s. Services expose read-only `Observable` streams and provide explicit setters to mutate state.

## Core patterns

- Keep state inside a dedicated service.
- Expose `Observable` streams for components.
- Update state through service methods, not direct mutation.
- Persist state through the API when required (user state endpoints).

## State services (current)

| Service | Purpose | Location |
| --------- | --------- | ---------- |
| UserStateService | User session state and persistence | `apps/craft-web/src/app/common/services/user-state.service.ts` |
| AdminStateService | Admin UI state and table metrics | `apps/craft-web/src/app/common/services/admin-state.service.ts` |
| SidebarStateService | Sidebar collapse state | `apps/craft-web/src/app/common/services/sidebar-state.service.ts` |
| FooterStateService | Footer expand state | `apps/craft-web/src/app/common/services/footer-state.service.ts` |
| ThemeService | Light/dark theme state | `apps/craft-web/src/app/common/services/theme.service.ts` |
| UserTrackingService | In-app user tracking state | `apps/craft-web/src/app/common/services/user-tracking.service.ts` |

## Notes

- User state persistence uses backend endpoints under `/api/user` and `/api/files`.
- Socket.IO is used for specific real-time updates; see `documentation/architecture/websocket/SOCKET-SERVICES.md`.

Last Updated: 2025-12-30
