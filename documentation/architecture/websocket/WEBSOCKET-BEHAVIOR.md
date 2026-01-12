# WebSocket Connection Behavior

## Socket Initialization Process

### Backend (NestJS)

1. **Gateway Initialization**: When NestJS starts, it initializes the WebSocket gateways, but no active connections exist yet.

2. **Waiting for Connections**: The server is now listening for WebSocket connections on the configured namespaces, but you won't see connection logs until a client connects.

3. **Connection Logging**: When a client connects, the `handleConnection()` method in the gateway is triggered, which logs the connection.

### Frontend (Angular)

1. **Connection Attempt**: The client-side Socket.IO client attempts to connect to the server when initialized:

   ```typescript
   this.socket = io('http://localhost:3000/user-state', {
     transports: ['websocket', 'polling'],
     reconnectionAttempts: 5,
     reconnectionDelay: 1000
   });
   ```

2. **Connection Event**: When the connection is established, the `connect` event fires:

   ```typescript
   this.socket.on('connect', () => {
    this.logger.debug('Socket connected to user-state namespace', { 
      id: this.socket.id, 
      namespace: 'user-state' 
    });
    this.connectionStatusSubject.next(true);
    // ...
   });
   ```

3. **Authentication Integration**: The socket connection now properly integrates with the authentication system:

   ```typescript
   // Authenticate socket connection with current auth token
   const token = this.authService.getAuthToken();
   if (token) {
     this.socket.emit('authenticate', { token });
     this.logger.debug('Socket authentication attempted');
   }
   ```

## Connection Configuration

### Transport Options

Socket.IO supports different transport mechanisms:

1. **WebSocket**: Modern, efficient bidirectional communication.
   - Lower latency
   - Less overhead
   - Preferred when available

2. **Polling**: HTTP long-polling fallback.
   - More compatible with older browsers/networks
   - Works through some restrictive proxies
   - Higher latency and overhead

### Recommended Configuration

For Craft Fusion applications, configure sockets with this robust approach:

```typescript
this.socket = io(this.socketUrl, {
  transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
  reconnectionAttempts: 5,              // Number of reconnection attempts
  reconnectionDelay: 1000,              // Start with 1s delay (increases with backoff)
  timeout: 10000,                       // Connection timeout in ms
  auth: {                               // Auth data sent with connection
    token: this.authService.getAuthToken()
  }
});
```

## Logging Behavior

### Connection Logs

- NestJS logs WebSocket connections when they occur using the `handleConnection()` method
- Socket connections will appear in logs with messages like:

  ```
  [YahooGateway] Client connected: socketId123
  ```

### Event Logs

- Socket event handling is logged when configured in the gateway
- Messages are logged using the NestJS Logger:

  ```typescript
  this.logger.log(`Client ${client.id} subscribed to Yahoo data: ${symbols.join(',')}`);
  ```

### Connection Status Tracking

The application now properly tracks connection status:

```typescript
// Observable to track connection status
private connectionStatusSubject = new BehaviorSubject<boolean>(false);
public connectionStatus$ = this.connectionStatusSubject.asObservable();

// Update status on connection events
this.socket.on('connect', () => {
  this.connectionStatusSubject.next(true);
  // ...
});

this.socket.on('disconnect', () => {
  this.connectionStatusSubject.next(false);
  // ...
});
```

## Troubleshooting Socket Connections

1. **No Connection Logs**: If no socket connections appear in your logs:
   - Verify the client is attempting to connect to the correct URL and namespace
   - Ensure CORS settings are properly configured on both sides
   - Check network tab in browser DevTools for connection issues
   - Verify server is listening on the expected port

2. **Connection but No Events**: If connections are established but events aren't triggering:
   - Ensure event names match exactly between client and server
   - Verify payload format is as expected
   - Add debug logging for event emissions and receptions

3. **Debugging Socket Issues**:
   - Use Socket.IO Admin UI (accessible at `https://admin.socket.io`)
   - Add explicit logging on both client and server for socket lifecycle events
   - Monitor network traffic using browser DevTools

4. **Gateway Timeout Errors**:
   - Check if the backend server is running and accessible
   - Verify proxy configuration is correct for API endpoints
   - Ensure proper transport mechanisms are configured
   - Check for CORS policy restrictions

5. **Authentication Issues**:
   - Verify token is being properly sent with socket connection
   - Check that backend socket gateway validates tokens correctly
   - Review authentication middleware for socket connections

## Integration with AdminStateService

Recent improvements ensure proper synchronization between WebSocket connections and the application's admin state:

```typescript
// In AuthenticationService
login(username: string, password: string): Observable<any> {
  return this.http.post<{ token: string, user: User }>('/api/auth/login', { username, password }).pipe(
    tap(response => {
      // ...existing authentication logic...
      
      // Update AdminStateService when user has admin role
      const isAdmin = Array.isArray(response.user.roles) && response.user.roles.includes('admin');
      this.adminStateService.setAdminStatus(isAdmin);
      
      // Re-establish socket connections with new authentication
      this.socketService.reconnectWithAuth(response.token);
    }),
    // ...error handling...
  );
}
```

## Best Practices

1. **Namespace Organization**: Use distinct namespaces for different functional areas
2. **Explicit Error Handling**: Always handle socket errors on both client and server
3. **Reconnection Logic**: Implement reconnection strategies for better reliability
4. **Connection Status Tracking**: Expose connection status to UI for transparency
5. **Payload Validation**: Validate incoming payloads before processing
6. **Transport Fallback**: Configure both WebSocket and polling transport options
7. **Authentication Integration**: Always secure socket connections with proper authentication
8. **Service Integration**: Update relevant services like AdminStateService when socket status changes

## Known Issues and Workarounds

1. **Connection Drops Behind Proxies**:
   - Solution: Configure socket to use both WebSocket and polling transport modes
   - Add explicit reconnection logic with exponential backoff

2. **Memory Leaks from Socket Subscriptions**:
   - Solution: Always unsubscribe from socket events in ngOnDestroy
   - Use takeUntil pattern with destroy subject

3. **Authentication State Synchronization**:
   - Solution: Ensure AdminStateService receives updates when authentication status changes
   - Reconnect sockets with new auth token after login/logout

Last Updated: 2025-05-05
