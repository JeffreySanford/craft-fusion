<!-- filepath: c:\repos\craft-fusion\documentation\UTILITIES.md -->
# Utility Services (Deprecated)

> **Note:** This file is deprecated. Please refer to [services/UTILITY-SERVICES.md](services/UTILITY-SERVICES.md) for the canonical and up-to-date documentation of utility services in Craft Fusion.

## File Handling

### FileUploadService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\file-upload.service.ts`)

* **Purpose:** Handles uploading files to the backend.
* **Integration:** Uses `ApiService.post` to send `FormData` to `/api/files/upload`.
* **Method:** `uploadFile(file: File)`.

### DocParseService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\doc-parse.service.ts`)

* **Purpose:** Parses `.docx` files, extracts content, converts it to Markdown, and attempts to structure specific "myth" content using complex patterns.
* **Libraries:** Uses `mammoth` for DOCX parsing and `turndown` for HTML-to-Markdown conversion.
* **Features:** Includes complex regular expressions (`mythPatterns`) with named capture groups to identify and structure specific content sections (verses, ranges, references, links) within the document. Uses `mammoth`'s `transformDocument` option and custom helper methods (`extractText`, `detectMythSection`, `createMythElement`, `processMythContent`). Includes debug logging (`debugMode`, `log`).
* **Method:** `parseDoc(file: File)`.

### PdfParseService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\pdf-parse.service.ts`)

* **Purpose:** Parses `.pdf` files, extracts text content, and converts it to Markdown.
* **Libraries:** Uses `pdfjs-dist` for PDF parsing and `turndown` for HTML-to-Markdown conversion (applied to the concatenated text content).
* **Method:** `parsePdf(file: File)`. Iterates through pages, extracts text items, joins them, and then uses Turndown.

## UI & User Experience

### NotificationService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\notification.service.ts`)

* **Purpose:** Displays toast notifications to the user.
* **Library:** Wrapper around the `ngx-toastr` library.
* **Methods:** `showSuccess`, `showError`, `showHTMLMessage` (configures position and HTML enablement), `clear`.

### ThemeService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\theme.service.ts`)

* **Purpose:** Manages the application's visual theme (light/dark). See also [State Management](./STATE-MANAGEMENT.md).
* **State:** Uses a `BehaviorSubject` (`isDarkTheme$`) to track the current theme.
* **Persistence:** Saves the theme preference to `localStorage`. Initializes based on saved preference or system settings.
* **Method:** `toggleTheme()`. Applies theme classes to `document.body`.

### BusyService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\busy.service.ts`)

* **Purpose:** Intended to indicate background activity or loading states.
* **Current State:** Placeholder implementation that only logs messages to the console (`increment`, `decrement`). Needs integration with a UI component (e.g., spinner, progress bar).

### ChartLayoutService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\chart-layout.service.ts`)

* **Purpose:** Provides logic for arranging and styling chart components, particularly within the data visualizations section. Uses `ExtendedChartData` interface.
* **Methods:**
  * `optimizeChartLayout`: Sorts and rearranges chart data objects based on their `size` property (`large`, `medium`, `small`) to create a visually balanced layout. Adds `position`, `specialLayout`, and `specialPosition` properties based on complex logic involving combinations of sizes.
  * `calculateChartClass`: Returns appropriate CSS classes (`fixed-chart-content`, `line-chart-content`, etc.) based on the chart component type for styling.

## Performance & Tracking

### PerformanceConfigService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\performance-config.service.ts`)

* **Purpose:** Manages application performance settings.
* **Configuration (`PerformanceConfig`):** Holds settings like animation enablement, render quality, data point limits, transition usage, and data fetch intervals.
* **Methods:** `getConfig`, `enableLiteMode`, `enableHighPerformanceMode`. Allows switching between predefined performance profiles by updating the internal `config` object.

### UserActivityService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\user-activity.service.ts`)

* **Purpose:** Tracks user interactions within the application.
* **Tracking:** Listens for router events (`NavigationEnd`) and DOM events (click, scroll, input) using `addEventListener` to record activities (`UserActivity` interface). Includes debouncing for scroll and input events.
* **Data:** Stores recent activities (`userActivities`, limited size), session start time (`sessionStartTime`), last activity time (`lastActivityTime`), and calculates page view durations (`pageViewDurations`).
* **Methods:** `trackActivity`, `getSessionDuration`, `getPageViewDurations`, `getActivities`, `getActivitySummary`. Includes helper `getElementDescription` to identify interaction targets. Uses `LoggerService`.
