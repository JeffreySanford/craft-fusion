# Proxy Configuration Guide

## Overview

This document provides comprehensive guidance for configuring the proxy settings in the Craft Fusion application. Proper proxy configuration is essential for ensuring seamless communication between the Angular frontend and the NestJS/Go backends, particularly for WebSocket connections that power real-time features.

## Current Configuration

The Angular development server uses a proxy configuration file located at:
```
apps/craft-web/src/proxy.config.json
```

This configuration handles routing of HTTP requests and WebSocket connections from the Angular application (running on port 4200) to the backend services (running on ports 3000/4000).

### Current Proxy Settings

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "timeout": 30000,
    "proxyTimeout": 30000
  },
  "/socket.io": {
    "target": "http://localhost:3000",
    "secure": false,
    "ws": true,
    "changeOrigin": true,
    "logLevel": "debug",
    "timeout": 60000,
    "proxyTimeout": 60000
  }
}
```

## Key Configuration Options

### Understanding Proxy Options

| Option | Purpose | Recommended Setting |
|--------|---------|---------------------|
| `target` | Backend server URL | `http://localhost:3000` for NestJS |
| `secure` | Whether target uses HTTPS | `false` for local development |
| `ws` | Enable WebSocket support | `true` for Socket.IO endpoints |
| `changeOrigin` | Change origin header to match target | `true` (helps with CORS) |
| `logLevel` | Debugging level | `debug` during development |
| `timeout` | Socket timeout (ms) | `30000` for API, `60000` for WebSockets |
| `proxyTimeout` | Proxy request timeout (ms) | Match the `timeout` value |

### Socket.IO Configuration

Socket.IO requires specific proxy settings:

1. The `/socket.io` path must be explicitly configured
2. The `ws` option must be set to `true`
3. Longer timeout values are recommended for WebSocket connections

## Common Issues and Solutions

### 504 Gateway Timeout Errors

**Problem**: Frontend receives 504 Gateway Timeout errors when connecting to backend APIs or WebSockets.

**Causes**:
- Insufficient timeout values in proxy configuration
- Backend server not running or inaccessible
- Connection issues between frontend and backend

**Solutions**:
1. **Increase timeout values** in proxy.config.json (as implemented above)
2. Ensure backend services are running (`nx run craft-nest:serve`)
3. Configure proper transport options in Socket.IO client:

```typescript
this.socket = io(this.socketUrl, {
  transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});
```

### WebSocket Connection Failures

**Problem**: WebSocket connections fail to establish or disconnect frequently.

**Causes**:
- Incorrect proxy configuration for WebSockets
- Missing transport fallback options
- Network restrictions or firewalls blocking WebSocket traffic

**Solutions**:
1. Enable WebSocket support with `"ws": true` in proxy config
2. Use multiple transport options (`['websocket', 'polling']`)
3. Set appropriate timeout values
4. Implement reconnection logic in the Socket.IO client

## Multiple Backend Configurations

When working with both NestJS and Go backends simultaneously:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  },
  "/api-go": {
    "target": "http://localhost:4000",
    "secure": false,
    "pathRewrite": {
      "^/api-go": ""
    }
  },
  "/socket": {
    "target": "ws://localhost:3000",
    "secure": false,
    "ws": true,
    "changeOrigin": true
  }
}
```

## Production Configuration

For production environments, use `proxy.config.prod.json` with appropriate production server URLs:

```json
{
  "/api": {
    "target": "https://api.craftfusion.com",
    "secure": true,
    "changeOrigin": true
  },
  "/socket.io": {
    "target": "https://api.craftfusion.com",
    "secure": true,
    "ws": true,
    "changeOrigin": true
  }
}
```

## How to Test Proxy Configuration

1. **Verify Backend Services**: Ensure backend services are running
   ```bash
   # Terminal 1 - Start NestJS backend
   pnpm dlx nx run craft-nest:serve
   
   # Terminal 2 - Start Go backend (if using)
   pnpm dlx nx run craft-go:serve
   ```

2. **Check Health Endpoints**:
   ```bash
   # Test NestJS API
   curl http://localhost:3000/api/health
   
   # Test Go API
   curl http://localhost:4000/health
   ```

3. **Test Frontend Proxy**:
   ```bash
   # Start frontend with verbose output
   pnpm dlx nx run craft-web:serve --verbose
   ```

4. **Monitor Network Traffic**:
   - Open Chrome DevTools (F12)
   - Go to Network tab
   - Filter by WS (WebSockets) or XHR
   - Observe request/response patterns

## Troubleshooting

### Server Logs

When troubleshooting connection issues, check both frontend and backend logs:

```bash
# Frontend logs with proxy debugging
pnpm dlx nx run craft-web:serve --verbose

# Backend logs with Socket.IO debugging
DEBUG=socket.io* pnpm dlx nx run craft-nest:serve

# Socket.IO specific logs
DEBUG=socket.io:client* pnpm dlx nx run craft-web:serve
```

### WebSocket Client Testing

To isolate WebSocket issues, create a standalone test client:

```html
<!-- websocket-test.html -->
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.4.1/socket.io.min.js"></script>
</head>
<body>
  <h1>WebSocket Connection Test</h1>
  <div id="status">Connecting...</div>
  <script>
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
      document.getElementById('status').innerHTML = 
        `Connected! Socket ID: ${socket.id}`;
      console.log('Connected!', socket.id);
    });
    
    socket.on('connect_error', (err) => {
      document.getElementById('status').innerHTML = 
        `Error: ${err.message}`;
      console.error('Connection error:', err);
    });
  </script>
</body>
</html>
```

## Best Practices

1. **Always enable WebSocket support** for Socket.IO paths
2. **Set appropriate timeout values** based on expected operations
3. **Use both transport mechanisms** (`websocket` and `polling`) for reliability
4. **Implement proper error handling and reconnection logic** in the client
5. **Monitor connection status** and provide visual feedback to users
6. **Debug using verbose logging** when troubleshooting issues

## Further References

- [Angular DevServer Proxy Configuration](https://angular.io/guide/build#proxying-to-a-backend-server)
- [Socket.IO Client Configuration](https://socket.io/docs/v4/client-options/)
- [HTTP-Proxy-Middleware Options](https://github.com/chimurai/http-proxy-middleware#options)
- [Craft Fusion WebSocket Behavior](../WEBSOCKET-BEHAVIOR.md)

Last Updated: 2025-05-05