# WebSocket Connection Behavior

## Socket Initialization Process

### Backend (NestJS)

1. **Gateway Initialization**: When NestJS starts, it initializes the WebSocket gateways, but no active connections exist yet.

2. **Waiting for Connections**: The server is now listening for WebSocket connections on the configured namespaces, but you won't see connection logs until a client connects.

3. **Connection Logging**: When a client connects, the `handleConnection()` method in the gateway is triggered, which logs the connection.

### Frontend (Angular)

1. **Connection Attempt**: The client-side Socket.IO client attempts to connect to the server when initialized:
   ```typescript
   this.socket = io('http://localhost:3000/user-state');
   ```

2. **Connection Event**: When the connection is established, the `connect` event fires:
   ```typescript
   this.socket.on('connect', () => {
    this.logger.debug('Socket connected to user-state namespace');
    // ...
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

## Best Practices

1. **Namespace Organization**: Use distinct namespaces for different functional areas
2. **Explicit Error Handling**: Always handle socket errors on both client and server
3. **Reconnection Logic**: Implement reconnection strategies for better reliability
4. **Connection Status Tracking**: Expose connection status to UI for transparency
5. **Payload Validation**: Validate incoming payloads before processing