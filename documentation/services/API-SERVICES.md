# API Services

This document details the core API services in the Craft Fusion platform that handle communication with backend APIs.

## Core API Services

| Service | Purpose | Location |
|---------|---------|----------|
| ApiService | Core HTTP communication | `/apps/craft-web/src/app/common/services/api.service.ts` |
| ApiDiagnosticsService | API connectivity monitoring | `/apps/craft-web/src/app/common/services/api-diagnostics.service.ts` |
| ApiLoggerService | API request logging | `/apps/craft-web/src/app/common/services/api-logger.service.ts` |
| ApiInterceptor | HTTP request interception | `/apps/craft-web/src/app/common/services/api-interceptor.ts` |

## ApiService

The foundation service for all backend communication.

### Features

* **Standardized HTTP Operations:** GET, POST, PUT, DELETE methods with consistent interfaces
* **Request Formatting:** Handling headers, authentication tokens, and request payloads
* **Response Processing:** Parsing and transforming responses with proper typing
* **Error Handling:** Centralized error management with logging
* **Resilience:** Retries, timeouts, and circuit breaking patterns
* **Authentication:** Secure token handling for protected endpoints

### Key Methods

```typescript
// Basic HTTP methods with strong typing
get<T>(endpoint: string, options?: any): Observable<T>
post<T, R = T>(endpoint: string, data: T, options?: any): Observable<R>
put<T, R = T>(endpoint: string, data: T, options?: any): Observable<R>
delete<T>(endpoint: string, options?: any): Observable<T>

// Advanced methods
cachedGet<T>(endpoint: string, options?: CacheOptions): Observable<T>
batchRequests<T>(requests: BatchRequest[]): Observable<T[]>
generateRecords<T>(count: number, options?: GenerateOptions): Observable<T[]>
loadChunked<T>(endpoint: string, options: ChunkOptions): Observable<T[]>

// Hybrid REST+WebSocket pattern
liveResource<T>(resourceEndpoint: string, topic: string, websocketService: any): Observable<T>

// Configuration methods
setApiUrl(apiType: 'Nest' | 'Go'): void
setRetryStrategy(retries: number, backoffStrategy?: BackoffStrategy): void
setRequestTimeout(timeout: number): void
```

### Usage Example

```typescript
@Injectable()
export class UserService {
  constructor(private api: ApiService) {}

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('users');
  }

  createUser(user: User): Observable<User> {
    return this.api.post<User>('users', user);
  }

  // With advanced caching
  getCachedUsers(): Observable<User[]> {
    return this.api.cachedGet<User[]>('users', { ttl: 300000 }); // 5 minute cache
  }

  // With live updates via WebSocket
  getUsersWithLiveUpdates(): Observable<User[]> {
    return this.api.liveResource<User[]>(
      'users',
      'users:updates',
      this.socketService
    );
  }
}
```

## ApiDiagnosticsService

Monitors API connectivity and provides diagnostics for troubleshooting connection issues.

### Features

* **Health Monitoring:** Regular checks of API availability
* **Socket Connection Tracking:** WebSocket connection status monitoring
* **Network Diagnostics:** Tools to troubleshoot connectivity issues
* **Latency Measurement:** API response time tracking

### Key Interfaces

```typescript
interface ConnectionDiagnostics {
  isConnected: boolean;
  status: 'healthy' | 'degraded' | 'unavailable';
  lastChecked: Date;
  error?: string;
  serverBinding?: string;
  portStatus?: string;
  responseTimes?: number[];
}

interface SocketDiagnostics {
  isConnected: boolean;
  connectionId?: string;
  pingTime?: number;
  reconnectAttempts: number;
  lastError?: string;
  socketUrl?: string;
}

interface NamespacedSocketStatus {
  namespace: string;
  isConnected: boolean;
  connectionId?: string;
  lastError?: string;
  lastConnectedTime?: Date;
  lastDisconnectedTime?: Date;
}
```

### Key Methods

```typescript
checkApiConnection(): Observable<boolean>
initializeSocketMonitoring(socketUrl?: string): void
monitorNamespaceSocket(namespace: string, socketUrl?: string): void
reconnectSocket(): Observable<boolean>
getSocketDiagnostics(): Observable<SocketDiagnostics>
getApiDiagnostics(): Observable<ConnectionDiagnostics>
measureApiLatency(): void
measureSocketLatency(): void
```

## ApiLoggerService

Dedicated to logging API request and response details for debugging and monitoring.

### Features

* **Request Logging:** Detailed information about outgoing requests
* **Response Logging:** Capture of response data, status codes, and timing
* **Error Logging:** Comprehensive error information for troubleshooting
* **Log Storage:** In-memory storage of recent API logs
* **Log Streaming:** Observable stream of API log entries

### Key Interface

```typescript
interface ApiLogEntry {
  id: string;
  timestamp: Date;
  duration: number;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: any;
  };
  error?: any;
}
```

### Key Methods

```typescript
logRequest(request: HttpRequest<any>): string // Returns log ID
logResponse(id: string, response: HttpResponse<any>, duration: number): void
logError(id: string, error: HttpErrorResponse, duration: number): void
getLogs(): ApiLogEntry[]
getLogStream(): Observable<ApiLogEntry>
getLogsForEndpoint(endpoint: string): ApiLogEntry[]
clearLogs(): void
```

## ApiInterceptor

HTTP interceptor that handles cross-cutting concerns for all API requests.

### Features

* **Authentication:** Adding auth tokens to requests
* **Request Tracing:** Adding correlation IDs
* **Error Handling:** Converting HTTP errors to application formats
* **Logging:** Automatic request/response logging
* **Retry Logic:** Implementing retry strategies for failed requests

### Implementation

```typescript
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthenticationService,
    private apiLogger: ApiLoggerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip interceptor for non-API requests
    if (!req.url.includes(environment.apiUrl)) {
      return next.handle(req);
    }

    // Log the request
    const logId = this.apiLogger.logRequest(req);
    const startTime = Date.now();

    // Add auth token if available
    const authToken = this.authService.getAuthToken();
    let authReq = req;
    
    if (authToken) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
    }

    // Add request ID for tracing
    authReq = authReq.clone({
      setHeaders: {
        'X-Request-ID': uuid()
      }
    });

    // Process the request and handle response/error
    return next.handle(authReq).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;
            this.apiLogger.logResponse(logId, event, duration);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.apiLogger.logError(logId, error, duration);
          
          // Handle authentication errors
          if (error.status === 401) {
            this.authService.logout();
          }
        }
      })
    );
  }
}
```

## Implementation Best Practices

1. **Always use typed interfaces** for requests and responses
2. **Subscribe to the ApiDiagnosticsService** for connectivity awareness
3. **Implement proper error handling** at service and component levels
4. **Use appropriate caching strategies** based on data volatility
5. **Consider using the liveResource pattern** for real-time data
6. **Implement retry strategies** for transient errors
7. **Configure proper timeouts** to prevent hanging requests
8. **Handle offline scenarios gracefully** with appropriate UI feedback

## Integration with Other Services

### Authentication Integration

The API services integrate with the authentication system:
- ApiInterceptor adds authentication tokens to requests
- ApiService provides methods for token management
- Unauthorized responses (401) trigger authentication workflows

### WebSocket Integration

The ApiService provides a hybrid approach for REST+WebSocket data:
- Initial data loading via REST API
- Real-time updates via WebSockets
- Seamless combination into a single Observable stream

### Logging Integration

API services provide comprehensive logging:
- Request/response logging in ApiLoggerService
- Integration with the main LoggerService for consolidated logs
- Performance metrics tracking for monitoring

## References

- [API Architecture](../architecture/API-ARCHITECTURE.md) - Detailed architecture information
- [API Integration](./API-INTEGRATION.md) - Integration patterns and techniques
- [WebSocket Services](./SOCKET-SERVICES.md) - WebSocket integration details
- [Authentication](../AUTHENTICATION.md) - Authentication system details

Last Updated: 2025-03-28
