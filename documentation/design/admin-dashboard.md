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
