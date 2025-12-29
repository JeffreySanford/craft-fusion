# API Architecture

## Overview

The API architecture in Craft Fusion follows enterprise-level design patterns for reliability, performance, and maintainability. The core of this architecture is the `ApiService`, which serves as the central communication layer between the front-end application and backend services.

## Design Principles

1. **Single Responsibility:** Each service and component has a clearly defined purpose
2. **Observability:** All components provide ways to monitor their state and operations
3. **Resilience:** Services incorporate error handling and recovery strategies
4. **Type Safety:** Strong TypeScript typing throughout the system
5. **Centralization:** All API communication is routed through dedicated services
6. **Testability:** Components are designed to be easily tested in isolation

## Core Components

### ApiService

The `ApiService` is the foundation of the API architecture, providing:

- **Standardized HTTP Operations:** GET, POST, PUT, DELETE with consistent interfaces
- **Request Formatting:** Headers, authentication tokens, and payload processing
- **Response Processing:** Type conversion and error classification
- **Error Handling:** Centralized error management and logging
- **Resilience:** Retries, timeouts, and circuit breaking patterns

### ApiDiagnosticsService

This service monitors API connectivity and provides diagnostics:

- **Health Monitoring:** Automatic health checks with exponential backoff
- **Connectivity Broadcasting:** Observable for API online/offline status
- **WebSocket Monitoring:** Tracks WebSocket connection health
- **API Performance Metrics:** Response time tracking for each endpoint

### ApiLoggerService

Dedicated to comprehensive logging of API operations:

- **Request Logging:** Details of outgoing requests
- **Response Logging:** Results and status codes
- **Error Logging:** Detailed error information
- **Performance Metrics:** Response times and statistics

### ApiInterceptor

HTTP interceptor that handles cross-cutting concerns:

- **Authentication:** Adding auth tokens to requests
- **Headers:** Standard HTTP headers for all requests
- **Request Transformation:** Pre-processing requests
- **Response Transformation:** Post-processing responses
- **Error Handling:** Converting HTTP errors to application-specific formats

## Request Pipeline

### Request Lifecycle

1. **Component/Service Initiates Request**
   - Calls appropriate ApiService method
   - Provides typed request data and expected response type

2. **Request Preparation**
   - Authentication headers added
   - Request tracing ID generated
   - Body formatted if needed

3. **Request Interception**
   - ApiInterceptor processes request
   - Caching checked if applicable
   - Circuit breaker pattern applied

4. **HTTP Request Execution**
   - Angular HttpClient sends request
   - Timeout applied
   - Response awaited

5. **Response Processing**
   - Status code checked
   - Response body parsed and typed
   - Errors handled

6. **Result Delivery**
   - Observable returned to caller
   - Type safety preserved
   - Response cached if applicable

### Error Handling Strategy

The architecture implements a sophisticated error handling strategy:

1. **Error Classification**
   - Network errors (status 0)
   - Authentication errors (401)
   - Authorization errors (403)
   - Not found errors (404)
   - Server errors (5xx)
   - Timeout errors (408, 504)

2. **Error Recovery**
   - Automatic retry for transient errors
   - Exponential backoff to prevent flooding
   - Circuit breaking for persistent errors
   - Fallback mechanisms where applicable

3. **Error Reporting**
   - Structured error objects
   - Consistent error format across application
   - Developer-friendly error messages
   - User-friendly error displays

## Advanced Patterns

### Circuit Breaker Pattern

Prevents cascading failures when services are degraded:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 30000
  ) {}
  
  execute<T>(request: () => Observable<T>): Observable<T> {
    if (this.state === 'OPEN') {
      // Check if timeout has elapsed to move to half-open
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        return throwError(() => new Error('Circuit breaker is OPEN'));
      }
    }
    
    return request().pipe(
      tap(() => {
        // Success - reset circuit breaker if in HALF_OPEN
        if (this.state === 'HALF_OPEN') {
          this.reset();
        }
      }),
      catchError(err => {
        this.recordFailure();
        return throwError(() => err);
      })
    );
  }
  
  // Other implementation details...
}
```

### Service Registry Pattern

The service dynamically routes requests to microservices:

```typescript
private initializeServiceRegistry(): void {
  this.serviceRegistry.set('default', this.apiUrl);
  this.serviceRegistry.set('users', `${environment.userServiceUrl ?? this.apiUrl}/users`);
  this.serviceRegistry.set('auth', `${environment.authServiceUrl ?? this.apiUrl}/auth`);
  this.serviceRegistry.set('files', `${environment.fileServiceUrl ?? this.apiUrl}/files`);
}
```

### Hybrid REST + WebSocket Pattern

Combines REST and WebSocket for efficient real-time updates:

```typescript
/**
 * Initializes resource with REST then subscribes to WebSocket updates
 */
liveResource<T>(resourceEndpoint: string, topic: string, websocketService: any): Observable<T> {
  // First get initial state via REST
  return this.get<T>(resourceEndpoint).pipe(
    // Then merge with WebSocket stream of updates
    mergeMap(initialData => {
      // Subscribe to WebSocket topic for updates
      const wsUpdates = websocketService.subscribe<Partial<T>>(topic).pipe(
        scan((acc, update) => ({...acc, ...update}), initialData)
      );
      
      // Combine initial REST data with WebSocket updates
      return merge(
        of(initialData),
        wsUpdates
      );
    })
  );
}
```

## Performance Optimizations

### Request Batching

For high-volume environments:

```typescript
/**
 * Batches multiple requests into a single HTTP call
 */
batchRequests<T>(requests: Array<{endpoint: string, method: string, body?: any}>): Observable<T[]> {
  const batchBody = requests.map(req => ({
    url: this.getFullUrl(req.endpoint),
    method: req.method,
    body: req.body
  }));
  
  return this.post<any[], T[]>('batch', batchBody);
  // Further implementation details...
}
```

### Response Caching

Intelligent caching system:

```typescript
/**
 * Caches GET requests for improved performance
 */
cachedGet<T>(endpoint: string, options: {ttl?: number, refresh?: boolean} = {}): Observable<T> {
  const cacheKey = `api_cache:${endpoint}`;
  const cachedData = options.refresh ? null : this.cacheService.get<T>(cacheKey);
  
  if (cachedData) {
    return of(cachedData);
  }
  
  return this.get<T>(endpoint).pipe(
    tap(response => {
      this.cacheService.set(cacheKey, response, options.ttl || 300000); // Default 5min TTL
    })
  );
}
```

### Chunked Loading

For large datasets:

```typescript
/**
 * Loads large datasets in manageable chunks
 */
loadChunked<T>(endpoint: string, options: ChunkOptions): Observable<T[]> {
  // Implementation for progressive loading
  // Chunk size, offset tracking, and result concatenation
}
```

## Security Considerations

### Token Management

Secure handling of authentication tokens:

```typescript
/**
 * Securely gets authentication headers with token refresh capability
 */
private getSecureHeaders(): Observable<HttpHeaders> {
  return this.tokenManager.getAccessToken().pipe(
    map(token => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
      
      return headers;
    })
  );
}
```

### Request Tracing

Distributed tracing for request debugging:

```typescript
/**
 * Adds tracing headers for request correlation
 */
private addTracingHeaders(headers: HttpHeaders): HttpHeaders {
  const requestId = uuid();
  return headers.set('X-Request-ID', requestId);
}
```

## Backend Integration

The API architecture integrates with two backend options:

1. **NestJS Backend**
   - RESTful API endpoints
   - WebSocket gateways
   - TypeScript type sharing
   - Port 3000 by default

2. **Go Backend**
   - High-performance REST API
   - WebSocket support
   - Better suited for large datasets
   - Port 4000 by default

## API Documentation

API endpoints are documented using:

1. **Swagger/OpenAPI** for RESTful endpoints
2. **Typescript interfaces** for type definitions
3. **JSDoc comments** for method documentation

## Best Practices

1. **Always use typed interfaces** for request/response objects
2. **Handle errors at appropriate levels** - don't swallow them
3. **Implement retry strategies** for transient failures
4. **Monitor API connectivity** and react to offline status
5. **Use circuit breakers** to prevent cascading failures
6. **Cache appropriately** but know when not to cache
7. **Handle offline scenarios** gracefully
8. **Consider WebSockets** for real-time data requirements
9. **Implement proper authentication** for all API calls
10. **Log meaningful information** without exposing sensitive data

## References

- [API Integration Services](../services/API-SERVICES.md)
- [WebSocket Architecture](./WEBSOCKET-ARCHITECTURE.md)
- [Authentication Architecture](./AUTH-ARCHITECTURE.md)
- [Third-Party Services](../services/THIRD-PARTY-SERVICES.md)

Last Updated: 2025-03-28
