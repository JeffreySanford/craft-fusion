# Logging System

Craft Fusion implements a comprehensive logging system across both frontend and backend services that provides structured, consistent, and detailed logs for monitoring, debugging, and auditing purposes.

## Architecture Overview

The logging system consists of several complementary components:

1. **Frontend Logging**:
   - `LoggerService` for Angular application logging
   - `ApiLoggerService` for API request/response logging

2. **Backend Logging**:
   - `LoggingService` for NestJS application logging
   - Centralized logging interceptors and middleware

3. **WebSocket Logging**:
   - Specialized logging for real-time communication

## Backend Logging (NestJS)

### LoggingService

Located at `c:\repos\craft-fusion\apps\craft-nest\src\app\logging\logging.service.ts`

#### Features

- **Standard Log Levels**: `debug`, `info`, `warn`, `error` methods with consistent API
- **Structured Logging**: All logs include metadata as objects rather than string interpolation
- **Log Storage**: Logs are stored in memory with configurable retention limits
- **Console Interception**: Intercepts and enhances console methods to ensure all output is captured
- **Query Capability**: Retrieve logs filtered by level, timestamp, and other criteria
- **Performance Tracking**: Special annotations for slow operations and performance bottlenecks
- **Context Preservation**: Maintains context across asynchronous operations

#### Usage

```typescript
// Inject LoggingService
constructor(private logger: LoggingService) {}

// Basic logging with metadata
this.logger.info('User profile updated', { userId: '123', changes: ['email'] });

// Error logging with error object
try {
  // operation
} catch (error) {
  this.logger.error('Failed to update profile', { error, userId: '123' });
}

// Performance tracking
this.logger.debug('Query completed', { duration: queryTime, resultCount: results.length });
```

#### Migration from NestJS Logger

The custom `LoggingService` replaces the built-in NestJS `Logger` to provide:

1. **Consistent structured format** across all services and gateways
2. **Enhanced metadata** instead of string interpolation
3. **Centralized log storage** for later retrieval
4. **Standardized timestamp format** for easier correlation
5. **Performance metrics** for monitoring slow operations

**Before:**

```typescript
private readonly logger = new Logger(ServiceName);

this.logger.log(`Creating record with ID: ${id}`);
this.logger.error(`Failed to create record: ${error.message}`);
```

**After:**

```typescript
constructor(private logger: LoggingService) {}

this.logger.info('Creating record', { id: record.id });
this.logger.error('Failed to create record', { error, id: record.id });
```

#### Gateway Integration

All gateways use the `LoggingService` to provide consistent, structured logging for WebSocket events:

```typescript
// In gateway constructors
constructor(private logger: LoggingService) {}

// Connection events
handleConnection(client: Socket): void {
  this.logger.info('Client connected', { 
    clientId: client.id,
    transport: client.conn.transport.name
  });
}

// Message events
@SubscribeMessage('eventName')
handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
  this.logger.debug('Message received', { 
    event: 'eventName',
    clientId: client.id,
    data
  });
}
```

### Log Retrieval

Logs can be retrieved through the `LoggingService` via Observable streams:

```typescript
// Get recent logs with optional filtering
this.loggingService.getLogs('error', 100).subscribe({
  next: (logs) => {
    // Handle logs data
    this.displayLogs(logs);
  },
  error: (err) => {
    console.error('Error retrieving logs', err);
  }
});

// Clear logs with subscription
this.loggingService.clearLogs().subscribe({
  next: () => {
    console.log('Logs cleared successfully');
    this.refreshLogDisplay();
  },
  error: (err) => {
    console.error('Error clearing logs', err);
  }
});

// Using async pipe in templates
// In component class:
logs$: Observable<LogEntry[]> = this.loggingService.getLogs('error', 100);

// In template:
// <div *ngFor="let log of logs$ | async">{{ log.message }}</div>
```

## Frontend Logging (Angular)

### LoggerService

Located at `c:\repos\craft-fusion\apps\craft-web\src\app\common\services\logger.service.ts`

#### Features
- **Log Levels**: Supports standard log levels (`DEBUG`, `INFO`, `WARN`, `ERROR`)
- **Structured Logs**: Stores logs as objects with timestamp, level, message, component, and details
- **Real-time Streams**: Exposes RxJS Observables for log monitoring
- **Console Enhancement**: Enhanced console output with color coding and categorization
- **Service Call Tracking**: Measures API call performance
- **Log Sanitization**: Automatically redacts sensitive information
- **Automatic Context Detection**: Determines the calling component automatically

#### Usage

```typescript
constructor(private logger: LoggerService) {
  this.logger.registerService('MyComponent');
}

// Starting a service call
const callId = this.logger.startServiceCall('DataService', 'GET', '/api/data');

// Basic logging with metadata
this.logger.info('Data loaded', { count: data.length, type: 'users' });

// Ending service call with status
this.logger.endServiceCall(callId, 200); // Success
this.logger.endServiceCall(callId, 500, error); // Error
```

### ApiLoggerService

Located at `c:\repos\craft-web\src\app\common\services\api-logger.service.ts`

Specializes in detailed logging of HTTP requests and responses, providing:
- Complete request/response details including headers and body
- Response time measurement
- Filtering capabilities by endpoint
- Integration with the main LoggerService

## Best Practices

### 1. Use Structured Logging

Always use objects for metadata instead of string interpolation:

```typescript
// BAD
this.logger.info(`User ${userId} updated profile with values: ${JSON.stringify(values)}`);

// GOOD
this.logger.info('User updated profile', { userId, values });
```

### 2. Appropriate Log Levels

- **DEBUG**: Detailed information useful during development and troubleshooting
- **INFO**: General application events that document normal operation
- **WARN**: Unexpected situations that don't prevent operation but may indicate problems
- **ERROR**: Failures that prevent normal operation or feature functionality

### 3. Include Relevant Context

Always include relevant identifiers and context information:
- Record IDs
- User IDs (never PII)
- Request IDs for correlation
- Operation timing for performance monitoring

### 4. Performance Monitoring

For operations that may impact performance:
- Log start and completion with duration
- Identify slow operations explicitly
- Include resource metrics where relevant (memory, record count, etc.)

### 5. Error Logging

When logging errors:
- Include the error object directly in metadata
- Provide context about the operation that failed
- Include relevant IDs and parameters (sanitized)

## Implementation Guidelines

### Backend Services

All NestJS services and controllers should:

1. Inject `LoggingService` instead of using NestJS `Logger`
2. Use structured logging with message + metadata object
3. Log all significant operations (creation, updates, deletions, errors)
4. Include relevant IDs and metrics in metadata

### Frontend Services

All Angular services should:

1. Inject `LoggerService` for general logging
2. Use `ApiLoggerService` for detailed API logging when needed
3. Register services via `registerService()` method
4. Use service call tracking for API operations
5. Follow appropriate log level guidelines

## Evolution and Future Improvements

The logging system has evolved from:

1. Basic console logging
2. Built-in framework loggers (NestJS Logger)
3. Custom structured logging services
4. Integration with monitoring and alerting systems

Planned improvements include:

1. Centralized log storage in database
2. Log rotation and archiving policies
3. Enhanced log visualization in admin dashboard
4. Log-based alerting for critical errors
5. Request tracing across services
