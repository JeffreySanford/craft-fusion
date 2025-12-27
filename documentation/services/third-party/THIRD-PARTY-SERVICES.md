<!-- filepath: c:\repos\craft-fusion\documentation\THIRD-PARTY-SERVICES.md -->
# Third-Party Service Integrations (Deprecated)

> **Note:** This file is deprecated. Please refer to [services/third-party-services.md](services/third-party-services.md) for the canonical and up-to-date documentation of third-party integrations in Craft Fusion.

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

* **Purpose:** Fetches flight and airport data, likely from the OpenSky Network via a backend proxy.
* **Integration:** Interacts with a custom backend proxy (`/openskies` endpoint, hardcoded base URL `http://localhost:3000`). Uses `HttpClient` directly.
* **Methods:** `fetchFlightData`, `fetchAirportData`, `fetchFlightDataByAirline`, `fetchFlightDataByAircraft`.

## Mapping

### MapboxService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\mapbox.service.ts`)

* **Purpose:** Integrates with Mapbox GL JS for displaying maps.
* **Integration:** Uses the `mapbox-gl` library and an access token from environment variables (`environment.mapbox.accessToken`).
* **Methods:** `initializeMap`, `addMarker` (with popup), `addPolyline` (removes existing layer/source first), `resizeMap`, `destroyMap` (removes map instance).

## AI / Language Models

### OpenAIService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\openai.service.ts`)

* **Purpose:** Sends prompts to an OpenAI model (specifically configured for `v1/engines/davinci-codex/completions`).
* **Integration:** Directly calls the OpenAI API (`api.openai.com`). Uses `HttpClient`.
* **Configuration:** Requires an API key (`apiKey` - currently hardcoded placeholder `YOUR_OPENAI_API_KEY`).
* **Method:** `sendMessage`. Extracts text from the first choice in the response. Includes basic error handling.

### DeepSeekService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\deepseek-local.service.ts`)

* **Purpose:** Sends prompts to a locally running DeepSeek model via its API.
* **Integration:** Makes POST requests to a configurable API URL passed into `sendMessage`. Uses `HttpClient`. Configured for model `deepseek-r1:1.5b`.
* **Method:** `sendMessage`. Handles chunked/streamed JSON responses (splits by newline, parses each JSON, joins `response` fields). Includes basic error handling.
