<!-- filepath: c:\repos\craft-fusion\documentation\services\third-party-services.md -->
# Third-Party Service Integrations

## Overview

This document outlines services responsible for interacting with external APIs and libraries. This is the canonical documentation for third-party integrations. If you find duplicate or outdated third-party service docs elsewhere, please update or remove them.

## Financial Data

### YahooService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\yahoo.service.ts`)

*   **Purpose:** Fetches financial historical data.
*   **Integration:** Calls backend proxy endpoints under `/api/financial/yahoo` (historical data, quotes, market summary) using `environment.apiUrl`.
*   **Features:** Uses `LoggerService` for request timing and error reporting.

## Flight Data

### OpenSkiesService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\openskies.service.ts`)

*   **Purpose:** Fetches flight and airport data.
*   **Integration:** Calls backend proxy endpoints under `/api/opensky` using `environment.apiUrl`.
*   **Methods:** `fetchFlightData`, `fetchAirportData`, `fetchFlightDataByAirline`, `fetchFlightDataByAircraft`.
*   **Error Handling:** Standard error handling and logging via backend.

## Fire & Hazard Data

### NasaFirmsService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\nasa-firms.service.ts`)

*   **Purpose:** Fetches active fire detections from NASA FIRMS for map overlays.
*   **Integration:** Calls backend endpoints under `/api/firms/active` using `environment.apiUrl`.
*   **Methods:** `getActiveFires` (lat/lng + radius + days).
