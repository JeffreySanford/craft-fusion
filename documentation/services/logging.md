# Logging

Logging is handled primarily by the `LoggerService` (`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\logger.service.ts`), providing structured and categorized logging throughout the application.

## LoggerService

### Features

*   **Log Levels:** Supports standard log levels (`DEBUG`, `INFO`, `WARN`, `ERROR`) controlled by `setLevel()` and `getLevel()`. The current level filters which messages are processed and stored. Level is persisted in `localStorage`.
*   **Log Entries (`LogEntry`):** Logs are stored as structured objects containing timestamp, level, message, component name, and optional details.
*   **Log Storage:** Stores a configurable number of recent logs in memory (`logLimit`). Provides `getLogs()` and `clearLogs()`.
*   **Log Stream:** Exposes an RxJS `Subject` (`logAdded$`, `logStream$`) for components to subscribe to real-time log updates.
*   **Console Output:** Logs are also output to the browser console (`outputToConsole`) with enhanced color-coding and component prefixes for development visibility. Uses CSS styling for different log levels and categories.
*   **Automatic Component Detection:** Attempts to automatically determine the calling component/service name using stack trace analysis (`getCallerComponent`). Includes fallbacks.
*   **Log Sanitization:** Automatically redacts sensitive fields (like 'password', 'token', 'secret', 'key', 'authorization', 'auth') in the `details` object before logging (`sanitizeLogDetails`).
*   **Categorization:** Automatically categorizes logs based on keywords and component names for enhanced console styling (`isSecurityRelated`, `isAuthRelated`, `isPerformanceRelated`, `isUserRelated`, `isApiRelated`, `isNavigationRelated`, `isDataRelated`, `isStorageRelated`, `isRenderingRelated`, `isInitializationRelated`, `isLifecycleRelated`, `isUSARelated`, `isSystemRelated`). Includes patriotic color themes.
*   **Service Call Tracking:**
    *   Services register themselves using `registerService()`.
    *   Tracks the duration and status of service calls initiated via `startServiceCall()` and `endServiceCall()`. Uses a unique `callId`.
    *   Stores metrics (`ServiceCallMetric`) for recent service calls (`serviceMetrics`, `serviceMetricsLimit`).
    *   Exposes service call metrics via an RxJS `BehaviorSubject` (`serviceCalls$`). Provides `getServiceMetrics()` and `clearMetrics()`.
*   **Specialized Logging:** Includes methods for specific contexts like `highlight`, `logNavigation`, and table-related events (`logTableEvent`, `logTablePerformance`, `logTableDataLoading`, `logTableMemoryUsage`).

### Usage

Inject `LoggerService` and use methods like `debug()`, `info()`, `warn()`, `error()`.

```typescript
constructor(private logger: LoggerService) {
  this.logger.registerService('MyComponent'); // Optional: Register component/service
}

loadData() {
  const callId = this.logger.startServiceCall('MyComponent', 'GET', '/api/data');
  this.api.get('/data').subscribe({
    next: (data) => {
      this.logger.endServiceCall(callId, 200);
      this.logger.info('Data loaded successfully', { count: data.length });
    },
    error: (err) => {
      this.logger.endServiceCall(callId, err.status || 500, err); // Pass error object to endServiceCall
      this.logger.error('Failed to load data', err);
    }
  });
}
```

## ApiLoggerService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\api-logger.service.ts`)

This service specifically logs detailed information about API requests and responses made through the application. It's intended to be integrated with `ApiService` or an HTTP interceptor.

### Features

*   **Detailed API Logs (`ApiLogEntry`):** Captures request (URL, method, headers, body) and response (status, body, headers) details, along with response time.
*   **Log Storage:** Stores a configurable number of recent API logs (`maxLogs`). Provides `getLogs()` and `clearLogs()`.
*   **Log Stream:** Provides an RxJS `Subject` (`logSubject`, exposed via `getLogStream()`) for real-time API log monitoring.
*   **Filtering:** Allows retrieving logs for a specific endpoint path (`getLogsForEndpoint`).
*   **Integration with `LoggerService`:** Logs summarized API call information (status, method, URL, time) to the main `LoggerService`.
*   **Mock Log Generation:** Includes a utility (`generateMockLog`) for testing purposes.