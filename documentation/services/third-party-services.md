<!-- filepath: c:\repos\craft-fusion\documentation\services\third-party-services.md -->
# Third-Party Service Integrations

## Overview

This document outlines services responsible for interacting with external APIs and libraries. This is the canonical documentation for third-party integrations. If you find duplicate or outdated third-party service docs elsewhere, please update or remove them.

## Financial Data

### YahooService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\yahoo.service.ts`)

* **Purpose:** Fetches financial historical data.
* **Integration:** Interacts with a custom backend proxy (`/yahoo/historical`) rather than directly with Yahoo Finance. Uses `environment.apiUrl`.
* **Features:**
  * In-memory caching (`cache`) based on request parameters.
  * Mock data generation (`generateMockFinancialData`) and fallback mode (`setMockDataMode`, `isMockDataMode`). Automatically falls back to mock data if the backend is unavailable (`backendAvailable` flag).
  * Chunking for large symbol lists (`getHistoricalDataChunked`).
  * Basic data processing/sampling (`processFinancialData`).
  * Cache management (`clearCache`, `optimizeCacheMemory`).
  * Uses `LoggerService`.

### AlphaVantageService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\alpha-vantage.service.ts`)

* **Purpose:** Fetches stock and forex data from Alpha Vantage.
* **Integration:** Directly calls the Alpha Vantage API (`alphavantage.co`) using an API key from environment variables (`environment.alphaVantageApiKey`).
* **Methods:** `getStockData` (TIME\_SERIES\_DAILY), `getForexData` (CURRENCY\_EXCHANGE\_RATE).
* **Error Handling:** Basic error handling (`handleError`) logging to console and returning `Observable<never>`.

## Flight Data

### FlightRadarService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\flightradar.service.ts`)

* **Purpose:** Fetches live flight data.
* **Integration:** Configured to use the FlightRadar24 API (`environment.flightRadar24.endpoint`) with an API key (`environment.flightRadar24.apiKey`). Uses `HttpClient` directly.
* **Current State:** Currently uses **mock data** for `getFlightsByBoundingBox` and `getFlightById`. The actual API calls are commented out but include basic error handling. `getAirportsByIcao` appears to use a live call.
* **Methods:** `getFlightsByBoundingBox`, `getFlightById`, `getAirportsByIcao`. Includes `Flight` interface.

### OpenSkiesService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\openskies.service.ts`)

* **Purpose:** Fetches flight and airport data.
* **Integration:** Uses the OpenSkies API with an API key from environment variables.
* **Methods:** `getFlights`, `getAirports`.
* **Error Handling:** Standard error handling and logging.
