# API Integration Services

This document provides detailed information about the services responsible for handling API communication in the Craft Fusion applications.

## Overview

The API integration layer provides a robust foundation for interacting with backend services. It handles common concerns such as:

* Health monitoring and offline detection
* Request tracking and unique request IDs
* Error handling and recovery strategies
* Connectivity state broadcasting
* Automatic retries with exponential backoff

## Core Services

### ApiService

The `ApiService` is the foundational service responsible for monitoring API health and managing connectivity.

#### Features

* **Health Monitoring:** Automatic checks with exponential backoff for failed attempts
* **Connectivity Broadcasting:** Observe API online/offline status
* **Error Handling:** Smart handling for different HTTP status codes
* **Request Tracing:** Uniquely identified requests for troubleshooting
* **Log Management:** Controlled logging that prevents flooding during outages

#### API Reference

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `isOffline$` | `Observable<boolean>` | Subscribe to monitor the API connectivity status |

**HTTP Context Tokens:**

| Token | Description |
|-------|-------------|
| `BYPASS_RETRY_TOKEN` | Used to bypass the retry logic for specific requests |
| `BYPASS_RETRY` | Preconfigured context that sets BYPASS_RETRY_TOKEN to true |

#### Usage Example

```typescript
@Component({
  selector: 'app-my-component',
  template: `
    <div *ngIf="isOffline" class="offline-banner">
      You are currently offline. Some features may be unavailable.
    </div>
    <div class="content">
      <!-- Component content -->
    </div>
  `
})
export class MyComponent implements OnInit, OnDestroy {
  public isOffline = false;
  private subscription: Subscription;
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit() {
    this.subscription = this.apiService.isOffline$.subscribe(offline => {
      this.isOffline = offline;
      
      if (offline) {
        // Take actions when API is offline
        // e.g., disable certain features, show notifications
      } else {
        // Resume normal operation
        // e.g., refresh data, enable features
      }
    });
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

#### Health Check Mechanism

The service automatically performs health checks with the following behavior:

* **Initial Delay:** Waits 5 seconds after initialization before first check
* **Normal Interval:** Checks every 30 seconds when API is available
* **Backoff Strategy:** Uses exponential backoff when API is unavailable
* **Maximum Backoff:** Caps at 5 minutes between checks during extended outages
* **Automatic Recovery:** Resets to normal interval when connectivity is restored

#### Error Handling

The service handles various error types:

* Network connectivity issues (status 0)
* Authentication failures (status 401)
* Authorization issues (status 403)
* Not found errors (status 404)
* Timeout errors (status 408, 504)

To prevent log flooding during API outages, the service suppresses additional logs after 5 consecutive failures until connectivity is restored.

### ApiInterceptor

The `ApiInterceptor` handles cross-cutting concerns for all HTTP requests:

* Adding standard headers
* Implementing retry logic
* Tracking request/response metrics
* Error transformation

[Detailed ApiInterceptor documentation](./services/api-interceptor.md)

## Configuration

API services can be configured in the environment files:

```typescript
// environment.ts
export const environment = {
  production: false,
  api: {
    baseUrl: 'https://api.dev.craft-fusion.com',
    timeout: 30000,
    retryAttempts: 3,
    healthCheckInterval: 30000
  }
};
```

## Best Practices

1. **Always subscribe to isOffline$** in components that rely on API data
2. **Use the BYPASS_RETRY context** for requests that implement their own retry logic
3. **Add request IDs to error reports** to facilitate troubleshooting
4. **Include timeouts** for all API requests to avoid hanging operations
5. **Handle offline scenarios gracefully** with appropriate UI feedback

## Related Services

* [CacheService](./services/cache-service.md) - Provides caching capabilities for API responses
* [SyncService](./services/sync-service.md) - Handles offline data synchronization
* [MockApiService](./services/mock-api-service.md) - Used for development and testing
