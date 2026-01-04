# Admin Dashboard UI Specification

This document defines the visual direction and component rules for the admin dashboard. The goal is a bold, animated, patriotic MD3 expressive experience with clear card separation and real-time tiles.

## Goals

- High-contrast, vibrant UI that is readable at a glance.
- Every admin tab uses visible cards or tiles (no white-on-white panels).
- Motion communicates state and recency without feeling chaotic.
- Components are reusable and consistent across tabs.

## Layout and structure

- Use a 12-column grid on desktop, 8 on tablet, 4 on mobile.
- Top row: admin hero (summary tiles + key alerts).
- Middle: data grids (cards + charts).
- Bottom: detailed tables or logs inside distinct cards.

## Tab roadmap

- **Overview** – Summary hero tiles that surface active services, aggregate success rate deltas, recent error counts, and connection health so the admin can scan the entire system at-a-glance.
- **Performance** – Headline KPIs tied to the performance dashboard, including resource load, memory, and CPU mix, with animated count-ups and subtle update pulses (this tab is the place that contains the performance helper charts).
- **Service Monitoring** – Temporarily removed from the UI to avoid browser lockups caused by high-volume telemetry. When reintroduced, it should continue to ride on `ServiceMetricsBridgeService` and stay throttled/worker-safe while surfacing endpoint performance, call volumes, flagged services, and SBOM/SCA tiles.
- **Security & Access** – Cards that expose permission health, security events, and access-control posture; each card should animate attention on state changes and highlight warnings in gold/red.
- **Logs** – High-contrast logger view with auto-scroll controls, level filters, and permanence hints so the admin can follow events without being overwhelmed.

> **Note:** The earlier System Performance tab has been deferred until we can reintroduce it in a lighter-weight form; the current suite leans on Performance + Service Monitoring for live telemetry (and the new Performance dashboard component now fronts the resource KPIs that used to live in System Performance).

## Current status

- Overview: Animated hero tiles remain the welcome view, with live success/delta badges plus a status badge that updates any time the log stream or service metrics change.
- Performance: The dedicated performance tab now hosts the KPI cards (memory, CPU, uptime, network) alongside the helper chart, providing gentle pulses whenever the telemetry service emits.
- Service Monitoring: The live workhorse handles endpoint tables, service cards, and the Chart.js bar chart; it is the tab that toggles the monitoring streams on/off so the rest of the dashboard stays lightweight.
- Security & Access and Logs: These modules keep their gold/warning animations and auto-scroll helpers, ensuring audibility without the System Performance load.

## Card system

### Card types

- Summary card: small, high-contrast, KPI focused.
- Detail card: medium/large, holds charts or tables.
- Action card: contains primary CTA and a short explanation.

### Card styling

- Rounded corners (12-16px) with MD3 elevation.
- Subtle gradient backgrounds using patriotic palette.
- Visible borders when the background is light.

Example tokens:

```css
:root {
  --admin-card-radius: 14px;
  --admin-card-padding: 20px;
  --admin-card-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  --admin-card-border: 1px solid rgba(0, 0, 0, 0.08);
  --admin-gradient-navy: linear-gradient(135deg, #001a3a, #002868);
  --admin-gradient-red: linear-gradient(135deg, #7a0f22, #bf0a30);
  --admin-gradient-gold: linear-gradient(135deg, #b38b00, #ffd700);
}
```

## Real-time tiles

### Tile anatomy

- Title
- Primary metric (animated count-up)
- Delta indicator (up/down)
- Timestamp (Last updated)
- Status chip (ok, warning, critical)

### Status colors

- OK: navy + white text
- Warning: gold + black text
- Critical: red + white text

### Motion

- Page load: stagger tiles by 60-80ms.
- Count-up animation for KPIs (600-900ms).
- Live refresh pulse on data update (subtle scale or glow).

## Tabs and content rules

- Every tab needs a visible card boundary and a clear hierarchy.
- Use a consistent card grid pattern for each tab.
- If a tab contains a table, wrap it in a filled or outlined card with a colored header.

## Accessibility

- Maintain WCAG AA contrast for all text.
- Provide reduced motion fallbacks.
- Avoid color-only indicators; add labels or icons.

## Implementation notes

- Centralize card styles in shared SCSS (token-based).
- Prefer CSS variables for theme adjustments.
- Avoid inline styles; use shared mixins.

## Monitoring infrastructure guidance

- The Service Monitoring and Performance tabs now source telemetry through `ServiceMetricsBridgeService` (`apps/craft-web/src/app/pages/admin/services-dashboard/service-metrics-bridge.service.ts`), which debounces `LoggerService.serviceCalls$` outside Angular and exposes a digestible `metrics$` stream so the browser never subsumes the metric volume directly.
- Keep the bridge’s audit interval (~600 ms) and cache cap (~200 entries) under review; these knobs balance responsiveness against the freezes linked to the prior circular dependency between `LoggerService` and the tab components.
- Any new telemetry tile should avoid re-subscribing to `LoggerService.serviceCalls$`; instead consume `ServiceMetricsBridgeService.metrics$` and rely on `getLatestMetrics()` to populate tables or KPIs so monitoring logic remains centralized and can be disabled when a tab is inactive.
- Document that the dashboard intentionally trades absolute realtime fidelity for stability; if future roadmaps demand tighter accuracy, look to server-side aggregation or Web Worker enrichment rather than reintroducing a direct logger dependency on the main thread.
- Log-heavy views consume their own bridge as well: the Logs tab now subscribes to `LogBridgeService` (`apps/craft-web/src/app/pages/admin/logs/log-bridge.service.ts`) so `app-logs` only touches the debounced `logs$` snapshot, keeping filtering and auto-refresh cheap.
- The performance KPIs rely on `PerformanceMetricsBridgeService` (`apps/craft-web/src/app/pages/admin/performance-dashboard/performance-metrics-bridge.service.ts`), which sits on top of `ServicesDashboardService.metrics$` and feeds the KPI chart without repeatedly touching the raw logger stream, preventing another class of browser lockups.
- Service Monitoring reuses `ServiceMetricsBridgeService` in the same way: the bridge keeps listening to `LoggerService.serviceCalls$` outside Angular, throttles (auditTime) the updates, and publishes a safe `metrics$` stream that the tab can subscribe to without restarting change detection or blocking the main thread. That same pattern is the foundation for upcoming SBOM/SCA tiles—those future cards should pull from the bridge or from derived analytics rather than reintroducing another raw logger subscription.

### Service Monitoring roadmap

- **SBOM & SCA events**: plan cards that surface software composition metrics (license risk, vulnerable packages, top-10 dependencies). Feed them from a normalized telemetry service that pushes to the existing bridge so the tab still toggles monitoring on/off cleanly.
- **Document the bridge contract**: outline in this doc (and the adjacent architecture notes) that every telemetry tile must consume `metrics$`/`getLatestMetrics()` and that disabling the tab should stop the bridge subscription; this keeps the browser from hitting the `LoggerService` stream with multiple listeners.
