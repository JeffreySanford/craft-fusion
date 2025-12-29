# Socket.IO Services in Craft Fusion

## Overview

Craft Fusion implements real-time bidirectional communication using Socket.IO to deliver Observable data from the backend to frontend clients. This approach enables immediate updates without polling and improves application responsiveness.

## Current Socket-Enabled Services

The following services currently leverage Socket.IO for real-time data delivery:

| Service | Description | Data Type |
|---------|-------------|-----------|
| User Activity Dashboard | Real-time user activity metrics | User activity events, counts, and session data |
| Financial Data Stream | Live financial data updates | Stock prices, market indicators |
| Notification Service | Push notifications for system events | Alert objects with priority levels |
| Logging Console | Live streaming of application logs | LogEntry objects |

## Implementation Architecture

### Backend (NestJS)

The backend implements Socket.IO through the NestJS WebSockets gateway:

```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://admin.socket.io', 'http://localhost:4200'],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private clientCount = 0;

  constructor(private logger: LoggingService) {}

  afterInit(server: Server) {
    // Socket.IO Admin UI setup for diagnostics
    instrument(server, {
      auth: {
        type: 'basic',
        username: 'admin',
        password: '$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS', // "password" hashed
      },
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });

    this.logger.info('WebSocket Gateway initialized', { port: process.env.PORT || 3000 });
  }
}
```

### Socket Service

The `SocketService` provides a clean API for emitting events to clients:

```typescript
@Injectable()
@WebSocketGateway()
export class SocketService {
  @WebSocketServer() server: Server;
  private metrics: Record<string, any> = {};

  constructor(private logger: LoggingService) {}

  /**
   * Emit an event to all connected clients
   */
  emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Socket broadcast: ${event}`, { recipientCount: this.getClientCount() });
  }

  /**
   * Emit an event to a specific client
   */
  emitToClient(clientId: string, event: string, data: any): void {
    this.server.to(clientId).emit(event, data);
    this.logger.debug(`Socket message: ${event}`, { recipient: clientId });
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.server ? this.server.engine.clientsCount : 0;
  }
}
```

### Frontend Integration

The Angular frontend connects to the socket server and listens for events:

```typescript
@Injectable({
  providedIn: 'root'
})
export class SocketClientService {
  private socket: Socket;
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor(private logger: LoggerService) {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.connectionStatus.next(true);
      this.logger.info('Socket connected', { id: this.socket.id });
    });

    this.socket.on('disconnect', () => {
      this.connectionStatus.next(false);
      this.logger.warn('Socket disconnected');
    });
  }

  /**
   * Listen to a specific socket event
   */
  on<T>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      this.socket.on(event, (data: T) => {
        observer.next(data);
      });

      return () => {
        this.socket.off(event);
      };
    });
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  /**
   * Get connection status as an Observable
   */
  get isConnected$(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }
}
```

## Integration with API Service

The API service has a `liveResource` method that combines REST API initialization with WebSocket updates:

```typescript
/**
 * Initializes resource with REST then subscribes to WebSocket updates
 * @param resourceEndpoint REST endpoint for initial resource state
 * @param topic WebSocket topic for updates to the same resource
 */
liveResource<T>(resourceEndpoint: string, topic: string, websocketService: { subscribe(topic: string): Observable<any> }): Observable<T> {
  // First get initial state via REST
  return this.get<T>(resourceEndpoint).pipe(
    // Then merge with WebSocket stream of updates
    mergeMap(initialData => {
      // If websocket service is provided, subscribe to topic
      if (websocketService && typeof websocketService.subscribe === 'function') {
        return new Observable<T>(observer => {
          observer.next(initialData);

          const subscription = websocketService.subscribe(topic).subscribe({
            next: (update: Partial<T>) => {
              const updatedData = { ...initialData, ...update };
              observer.next(updatedData);
            },
            error: (error: any) => observer.error(error)
          });

          return () => subscription.unsubscribe();
        });
      }

      // If no websocket service, just return the initial data
      return of(initialData);
    })
  );
}
```

## Performance Benefits

Socket.IO provides significant performance improvements over traditional HTTP:

1. **Reduced Latency**: Updates are pushed immediately rather than waiting for polling intervals
2. **Lower Bandwidth Usage**: Only data changes are transmitted after initial load
3. **Decreased Server Load**: Eliminates repetitive API calls for checking updates
4. **Improved User Experience**: Real-time updates create a more responsive application

## Diagnostic Tools

The application includes Socket.IO Admin UI for monitoring and debugging:

- Real-time connection monitoring
- Event monitoring and debugging
- Performance metrics tracking
- Room/namespace management

Access the admin UI at `https://admin.socket.io` with credentials:
- Username: admin
- Password: password

## Candidates for Socket Implementation

### Finance Dashboard
The financial data visualizations would greatly benefit from socket delivery to show live price updates without polling the API repeatedly.

### Record Generation Status
For large dataset generation, sockets could provide progress updates rather than waiting for the entire operation to complete.

### Table Component Analysis

The table component currently uses a toggle between client-side and server-side rendering. While this approach works well for initial data loading:

#### Current Implementation
- Toggle determines if sorting/filtering happens on client or server
- Initial data load is always from server
- Changes to filters/sorts may trigger new API calls in server mode

#### Potential Socket Benefits
- Real-time updates to table data without full reload
- Push-based notifications when records are added or modified
- Streaming approach for very large datasets

#### Considerations
- Socket implementation would complement rather than replace current toggle
- Would require state synchronization between connected clients
- Most beneficial for collaborative scenarios where multiple users work on the same data

## Connection Behavior

### Gateway Initialization

When the NestJS application starts, the WebSocket gateways are initialized, but no active connections exist yet. You will see initialization logs like:

```
[SocketGateway] WebSocket Gateway initialized
[YahooGateway] YahooGateway initialized
```

However, you won't see connection logs until a client connects.

### Connection Events

Socket connections are only established when frontend clients explicitly connect. The connection cycle looks like:

1. **Backend starts**: Gateways initialize and listen for connections
2. **Frontend connects**: Angular services create socket.io connections
3. **Connection established**: `handleConnection()` is triggered on the server
4. **Connection logged**: Both client and server log the successful connection

### Connection Logging

All WebSocket connections are logged by:

1. The NestJS Logger in gateway `handleConnection()` methods
2. Angular's LoggerService in the frontend socket service
3. Socket.IO's admin UI (if enabled)

To see active connections:

- Check server logs for connection messages
- Use the Socket.IO Admin UI at `https://admin.socket.io`

## Conclusion

Socket.IO provides a robust foundation for real-time features in Craft Fusion. Services that require immediate updates or handle frequently changing data are ideal candidates for socket-based implementation.
