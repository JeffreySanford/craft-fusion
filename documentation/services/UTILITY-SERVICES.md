<!-- filepath: c:\repos\craft-fusion\documentation\services\UTILITY-SERVICES.md -->
# Utility Services

## Overview

This document describes various utility services providing common functionalities within the application. This is the canonical documentation for utility services. If you find duplicate or outdated utility service docs elsewhere, please update or remove them.

## File Handling Services

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

## UI & User Experience Services

### NotificationService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\notification.service.ts`)

* **Purpose:** Displays toast notifications to the user.
* **Library:** Wrapper around the `ngx-toastr` library.
* **Methods:** `showSuccess`, `showError`, `showHTMLMessage` (configures position and HTML enablement), `clear`.

### ThemeService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\theme.service.ts`)

* **Purpose:** Manages the application's visual theme (light/dark). See also [State Management](../architecture/STATE-MANAGEMENT.md).
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

## Performance & Tracking Services

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

## Logging Services

### LoggerService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\logger.service.ts`)

* **Purpose:** Provides structured and categorized logging throughout the application.
* **Log Levels:** Supports standard log levels (`DEBUG`, `INFO`, `WARN`, `ERROR`) controlled by `setLevel()` and `getLevel()`.
* **Log Entries (`LogEntry`):** Logs are stored as structured objects containing timestamp, level, message, component name, and optional details.
* **Log Storage:** Stores a configurable number of recent logs in memory (`logLimit`).
* **Log Stream:** Exposes an RxJS `Subject` (`logAdded$`, `logStream$`) for real-time log updates.
* **Console Output:** Logs are output to the browser console with enhanced color-coding and component prefixes.
* **Log Sanitization:** Automatically redacts sensitive fields (like 'password', 'token', 'secret', 'key').
* **Categorization:** Automatically categorizes logs based on keywords and component names.
* **Service Call Tracking:** Tracks the duration and status of service calls initiated via `startServiceCall()` and `endServiceCall()`.

### ApiLoggerService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\api-logger.service.ts`)

* **Purpose:** Logs detailed information about API requests and responses.
* **Detailed API Logs (`ApiLogEntry`):** Captures request (URL, method, headers, body) and response (status, body, headers) details, along with response time.
* **Log Storage:** Stores a configurable number of recent API logs (`maxLogs`).
* **Log Stream:** Provides an RxJS `Subject` for real-time API log monitoring.
* **Filtering:** Allows retrieving logs for a specific endpoint path.
* **Integration with `LoggerService`:** Logs summarized API call information to the main `LoggerService`.

## State Management Services

### StateService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\state.service.ts`)

* **Purpose:** Base class for implementing state management in various parts of the application.
* **Features:** Provides pattern for creating BehaviorSubject-based state containers with typed state management.
* **Methods:** `getState()`, `setState()`, `updateState()`, `resetState()`.
* **Integration:** Used by various specialized state services like `UserStateService`, `AdminStateService`, etc.

### UserStateService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\user-state.service.ts`)

* **Purpose:** Manages state specific to the logged-in user's session and preferences.
* **State Properties:** `openedDocuments`, `loginDateTime`, `visitLength`, `visitedPages`.
* **Persistence:** Interacts with backend API to save and load user state.
* **WebSocket Integration:** Can use WebSockets for real-time state updates in multi-device scenarios.

### AdminStateService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\admin-state.service.ts`)

* **Purpose:** Manages state related to administrative functions and table performance monitoring.
* **State Properties:** `isAdmin$`, `tableLoadingState$`, `tableMemoryUsage$`.
* **Methods:** `setAdminStatus()`, `updateTableLoadingState()`, `updateTableMemoryUsage()`.
* **Features:** Tracks progress and memory usage of large table operations.

## Usage Examples

### Using LoggerService

```typescript
@Component({
  selector: 'app-example',
  template: '...'
})
export class ExampleComponent implements OnInit {
  constructor(private logger: LoggerService) {
    this.logger.registerService('ExampleComponent');
  }

  ngOnInit() {
    this.logger.info('Component initialized');
    
    const callId = this.logger.startServiceCall('ExampleComponent', 'GET', '/api/data');
    
    this.apiService.getData().subscribe({
      next: (data) => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug('Data loaded', { count: data.length });
      },
      error: (err) => {
        this.logger.endServiceCall(callId, err.status || 500);
        this.logger.error('Failed to load data', err);
      }
    });
  }
}
```

### Using ThemeService

```typescript
@Component({
  selector: 'app-theme-toggle',
  template: `
    <button (click)="toggleTheme()">
      <i class="fa" [ngClass]="(isDarkTheme$ | async) ? 'fa-sun' : 'fa-moon'"></i>
      {{ (isDarkTheme$ | async) ? 'Light Mode' : 'Dark Mode' }}
    </button>
  `
})
export class ThemeToggleComponent {
  isDarkTheme$: Observable<boolean>;
  
  constructor(private themeService: ThemeService) {
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
```

### Using NotificationService

```typescript
@Component({
  selector: 'app-form',
  template: '...'
})
export class FormComponent {
  constructor(private notificationService: NotificationService) {}
  
  saveForm(formData: any): void {
    this.apiService.saveData(formData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Data saved successfully!');
      },
      error: (err) => {
        this.notificationService.showError('Failed to save data. Please try again.');
      }
    });
  }
}
```

## Best Practices

1. **Log Responsibly:** Use appropriate log levels and avoid logging sensitive information
2. **State Management:** Follow the established patterns for state management
3. **Service Registration:** Register components with LoggerService for better log context
4. **Performance Awareness:** Use PerformanceConfigService to adapt to device capabilities
5. **File Processing:** Handle large file uploads and parsing operations with proper error handling

## References

* [State Management](../architecture/STATE-MANAGEMENT.md) - Details on state management approach
* [Logging](../LOGGING.md) - Comprehensive logging system documentation
* [API Services](./API-SERVICES.md) - API-related services documentation
* [Coding Standards](../development/CODING-STANDARDS.md) - Code style and standards

Last Updated: 2025-03-28
