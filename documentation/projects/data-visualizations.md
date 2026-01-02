# Data Visualizations

## Overview

The Data Visualizations view is a sandbox for interactive, high-impact charts that show off D3, mapping, and real-time data workflows. The page is designed as a flexible tile grid where users can enable or disable visualizations, switch between tile and full-screen modes, and drag to reorder.

Primary goals:

- Demonstrate D3 quality and motion with clear storytelling.
- Provide at-a-glance tiles with optional deep dives (full-screen).
- Mix static demo data and live API data to show integration breadth.
- Support future admin logging and observability of data services.

Route: `/data-visualizations`

## Current visualizations

### Line Chart (D3)

- Component: `apps/craft-web/src/app/projects/data-visualizations/line/line.component.ts`
- Theme: American Space Achievements (three series).
- Data: Static dataset in `DataVisualizationsComponent` (`lineChartData`).
- Interaction: Animated lines, point tooltips, responsive layout.
- Intended use: D3 line chart baseline for layout, tooltips, and animation patterns.

### Bar Chart (D3)

- Component: `apps/craft-web/src/app/projects/data-visualizations/bar/bar.component.ts`
- Theme: US progress metrics (GDP, life expectancy, internet usage).
- Data: Static datasets inside the component.
- Interaction: Metric toggles, hover tooltips, animated bars.
- Intended use: Quick comparative snapshot with a simple D3 bar layout.

### Financial Technologies (D3)

- Component: `apps/craft-web/src/app/projects/data-visualizations/financial/finance.component.ts`
- Data: Stock time series from backend Yahoo Finance endpoints.
- UI: Multi-stock line chart, legend with hover highlights, optional market phase view.
- Intended use: Showcase dynamic D3 with real data, interactivity, and overlays.
- Data flow:
  - Frontend calls `GET /api/financial/yahoo/historical` via `YahooService`.
  - Also listens for `yahoo:data` websocket events for updates.
  - Alpha Vantage has been removed; Yahoo is the current financial source.

### Fire Alert Chart (Map + overlays)

- Component: `apps/craft-web/src/app/projects/data-visualizations/alert/fire-alert.component.ts`
- Data: NASA FIRMS active fire detections (backend proxy) + OpenSky flight data.
- Map: Mapbox map with markers and click-to-add alerts.
- Intended use: Fire season awareness with geospatial context, aircraft overlays, and alert lists.

## Layout and display model

The chart list is defined in `apps/craft-web/src/app/projects/data-visualizations/data-visualizations.component.ts` and drives what is available. Each chart has:

- `size`: small, medium, large
- `displayMode`: `tile` or `fullscreen` (Fire Alert defaults to full-screen)
- `component`: the Angular selector to render

Layout rules live in:

- `apps/craft-web/src/app/projects/data-visualizations/services/chart-layout.service.ts`

Users can:

- Toggle charts from the selector (list or tile grid).
- Drag tiles to reorder.
- Expand tiles to full-screen and restore.

## Fire Alert vision (intended)

Goal: Highlight fire risk and active alerts for high-risk areas during fire season, with actionable context.

Planned behavior:

- Allow user search by zip code or city name.
- Show alerts for the selected area and nearby regions.
- Highlight pre-defined high-risk areas (LA, Colorado, etc.).
- Overlay rescue aircraft locations and response activity.
- Link to public agency alerts and fire perimeters.

## Current gaps and likely blockers

Fire Alert currently shows a map container but can appear blank for these reasons:

- Missing or demo Mapbox token (`MAPBOX_ACCESS_TOKEN`); Mapbox will not render without a valid token.
- The map container height can be too small if the tile is compact or the layout is still resizing.
- NASA FIRMS data requires a valid API key and can return large payloads if the query window is too wide.
- OpenSky data is rate-limited and should be filtered by bounding box.

## Improvements (short term)

- Fire Alert:
  - Add zip/city search with a geocoder and update the map center accordingly.
  - Use real fire datasets (NASA FIRMS, NIFC, Cal Fire) with a backend proxy.
  - Render fire perimeters, smoke layers, and alert severity heatmaps.
  - Normalize alert schema (title, severity, timestamp, source).
  - Add a map instance manager so each tab can swap or reuse a map cleanly.
- Financial chart:
  - Provide symbol search and a preset watchlist.
  - Add daily/weekly/monthly range toggles and data density controls.
- Line/Bar charts:
  - Replace static data with a "demo data switch" to show real data when available.
  - Add a unified tooltip format and snapshot export option (PNG/SVG).

## Improvements (medium term)

- Central data layer:
  - Normalize D3 data into a shared shape and use adapters per chart.
  - Cache and throttle remote data sources.
  - Record data fetch logs for the admin logging view.
- Tile experience:
  - Introduce a "tile summary" mode with compact stats and a one-click expand.
  - Save user layout preferences in local storage or profile settings.

## Current status

- Yahoo Finance is the active source for financial data.
- NASA FIRMS data is now available via the backend proxy (requires API key).
- OpenSky is the preferred flight data source for development (rate-limited).
- Tile limit dialog has been removed; tile additions auto-trim the layout when needed.

## New visualization ideas (D3 showcase)

- Choropleth risk map of wildfire danger by county with time slider.
- Arc diagram or flow map showing aircraft dispatch paths.
- Interactive timeline with brush/zoom for fire season peaks.
- Small multiples grid for state-by-state alerts.
- Sankey diagram for resource allocation (aircraft, crews, budget).
- Radial heatmap for seasonal fire intensity by region.
- Network graph for incident dependencies (weather, terrain, fuel, staffing).
- Storytelling scrollytelling view that ties charts into a narrative.

## References

- UI and layout: `apps/craft-web/src/app/projects/data-visualizations/`
- Chart layout logic: `apps/craft-web/src/app/projects/data-visualizations/services/chart-layout.service.ts`
- Design system guidance: `documentation/design/design-system.md`

Last Updated: 2026-01-01
