# Admin Dashboard UI Specification

This document defines the visual direction and component rules for the admin dashboard. The goal is a bold, animated, patriotic MD3 expressive experience with clear card separation and real-time tiles.

## Goals

- High-contrast, vibrant UI that is readable at a glance.
- Every admin tab uses visible cards or tiles (no white-on-white panels).
- Motion communicates state and recency without feeling chaotic.
- Components are reusable and consistent across tabs.

## Layout and structure

- Use a 12-column grid on desktop, 8 on tablet, 4 on mobile.
- Top row: admin hero (summary tiles + key alerts) - **persistent across all admin tabs**.
- Middle: data grids (cards + charts).
- Bottom: detailed tables or logs inside distinct cards.

## Admin hero area (persistent KPI bar)

The hero area is a **top-level summary bar** that appears above all admin tabs, providing at-a-glance system health regardless of which tab is active.

### Hero KPI tiles (minimum viable set)

1. **Active services** - `X/Y services online`
   - Icon: `cloud_done` or `dns`
   - Status: ok (all online), warning (partial), critical (<50%)
   - Source: `ServicesDashboardService.getRegisteredServices()`
   - Animation: Count-up from previous value
   - Delta: Show change from last refresh

2. **Success rate** - `XX%` aggregate
   - Icon: `thumb_up` or `done_all`
   - Status: ok (≥95%), warning (85-94%), critical (<85%)
   - Source: Average of all service success rates from `ServiceMetricsSummary`
   - Animation: Percentage counter with delta badge
   - Delta: `+X.X%` vs prior measurement

3. **Errors/Warnings** - `X errors, Y warnings`
   - Icon: `error_outline` or `warning`
   - Status: critical (errors>0), warning (warnings>0), ok (clean)
   - Source: `LoggerService.getLogs()` filtered by `LogLevel.ERROR` and `LogLevel.WARN`
   - Animation: Pulse on new error/warning
   - Detail: Show most recent error timestamp

4. **System health** - `Live data` or `Offline`
   - Icon: `wifi` or `wifi_off`
   - Status: ok (navigator.onLine), warning (offline)
   - Source: `navigator.onLine` + WebSocket connection state
   - Animation: Connection pulse when live

5. **Response time** - `XXms avg`
   - Icon: `speed` or `timeline`
   - Status: ok (<200ms), warning (200-500ms), critical (>500ms)
   - Source: Average duration from recent `ServiceCallMetric[]`
   - Animation: Real-time spark line (optional)

6. **Active alerts** - `X critical, Y warnings`
   - Icon: `notifications_active` or `campaign`
   - Status: critical (critical alerts>0), warning (warnings>0), ok (none)
   - Source: Security findings + system alerts aggregate
   - Animation: Badge pulse on new alert
   - Click action: Jump to security findings or logs tab

### Hero area layout options

**Option A: Sticky top bar** (recommended)

- Fixed position bar above tab navigation
- Always visible when scrolling
- 4-6 tiles in horizontal row
- Compact height (80-100px)
- Responsive: Stack to 2x3 grid on mobile

### Option B: Collapsible banner

- Expandable/collapsible summary bar
- Default expanded, user can collapse
- Shows compact badges when collapsed
- Full tiles when expanded

**Option C: Overview tab enhancement** (current implementation)

- Hero tiles only in Overview tab
- Not persistent across other tabs
- Simpler to implement but less PM-friendly

### Data sources and refresh strategy

```typescript
// Aggregate from existing services
interface HeroMetrics {
  activeServices: { current: number; total: number; };
  successRate: { value: number; delta: number; };
  errors: { count: number; warnings: number; lastError?: Date; };
  health: { online: boolean; wsConnected: boolean; };
  responseTime: { avg: number; p95: number; };
  alerts: { critical: number; warnings: number; };
}

// Hero service (new)
@Injectable({ providedIn: 'root' })
export class AdminHeroService {
  private heroMetrics$ = new BehaviorSubject<HeroMetrics>(initialState);
  
  // Subscribe to all data sources
  constructor(
    private servicesDashboard: ServicesDashboardService,
    private logger: LoggerService,
    private securityService: SecurityService,
  ) {
    // Combine metrics from all sources
    // Throttle to ~2-3 second refresh
    // Emit consolidated HeroMetrics
  }
}
```

### Animation and visual specs

- **Tile entrance**: Stagger by 60-80ms on page load
- **Value updates**:
  - Count-up animation: 600-900ms ease-out
  - Delta badges: Slide in from right, 300ms
  - Status changes: Color transition 400ms
- **Alert pulses**:
  - New error: 2-second red pulse on error tile
  - New warning: 1.5-second gold pulse on warning tile
  - Critical alert: Continuous subtle pulse until acknowledged
- **Connection status**:
  - Online: Gentle green pulse every 3s
  - Offline: Static orange/red indicator

### Status color mapping

- **OK**: Navy gradient (`--admin-gradient-navy`)
- **Warning**: Gold gradient (`--admin-gradient-gold`)
- **Critical**: Red gradient (`--admin-gradient-red`)

### Accessibility requirements

- Each tile must have `aria-label` with full context
- Status changes must announce via `aria-live="polite"`
- Color + icon + text (never color alone)
- Keyboard navigable
- Reduced motion: Disable animations, use static color changes

### Implementation phases

**Phase 1**: Current state (Overview tab only) ✓ Complete

- ✓ Hero tiles in `admin-landing.component.ts`
- ✓ Basic metrics from `ServicesDashboardService` and `LoggerService`
- ✓ Status-based styling

**Phase 2**: Persistent hero bar (recommended next) ✓ Complete (2026-01-08)

- ✓ Moved hero tiles to `admin.component.ts` (parent level)
- ✓ Created sticky header above tab navigation
- ✓ Created `AdminHeroService` to consolidate data sources
- ✓ Implemented count-up animations and delta badges
- ✓ Added 6 KPI tiles with real data sources
- ✓ Implemented click navigation (errors → Logs, alerts → Security)
- ✓ WCAG AA compliance with reduced-motion support

**Phase 3**: Advanced features (future)

- Add response time spark line visualization
- Integrate security service for dedicated alerts tile
- Implement alert acknowledgment flow
- Add WebSocket connection state indicator

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
