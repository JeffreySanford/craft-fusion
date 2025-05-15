# Craft Fusion Troubleshooting Guide

This guide addresses common development environment issues you might encounter when working with Craft Fusion applications.

## Common NX Errors

### "The system cannot find the file specified" (OS Error 2)

**Symptoms:** 
- Error when running NX commands like `npx nx run craft-nest:serve`
- Message containing "The system cannot find the file specified. (os error 2)"
- Process terminating with exit code 1

**Causes:**
1. Missing project files or directories
2. NX cache corruption
3. Incorrect project configuration
4. File system permission issues
5. Incomplete git clone or repository issues

**Solutions:**

1. **Reset the NX cache**
   ```bash
   # Clear NX cache and rebuild
   npx nx reset
   
   # Run the command again
   npx nx run craft-nest:serve
   ```

2. **Verify project structure**
   ```bash
   # Check if the project directory exists
   ls -la apps/craft-nest
   
   # Verify essential files exist
   ls -la apps/craft-nest/src/main.ts
   ```

3. **Rebuild the affected application**
   ```bash
   # Force a clean rebuild of the application
   npx nx build craft-nest --skip-nx-cache
   
   # Then try serving again
   npx nx run craft-nest:serve
   ```

4. **Check workspace.json or nx.json**
   
   Verify that your project is correctly defined in `workspace.json` or `nx.json` with the proper paths and configuration.

5. **Fix file permissions**
   ```bash
   # Reset permissions on the project files
   chmod -R 755 apps/craft-nest
   
   # Ensure you have write access to the NX cache
   chmod -R 755 .nx/cache
   ```

6. **Reinstall dependencies**
   ```bash
   npm ci
   # OR 
   npm install
   ```

### "Too many open files" Error

**Symptoms:**
```
Error: EMFILE: too many open files, open '/repos/craft-fusion/dist/apps/craft-web/assets/documents/file.txt'
```

**Causes:**
- System limit for maximum open files is too low
- Application opening too many files simultaneously 
- Memory leaks with file handles
- Watching too many files during development

**Solutions:**

1. **Increase file descriptor limits** (Linux/Mac)
   ```bash
   # Temporarily increase limit for current session
   ulimit -n 4096
   
   # Check current limit
   ulimit -n
   ```

2. **Increase file handle limit** (Windows)
   ```powershell
   # Run PowerShell as Administrator
   
   # Check for Node.js process and restart
   Get-Process -Name node | Stop-Process
   ```

3. **Modify Node.js settings**
   ```bash
   # Set higher limit before starting application
   NODE_OPTIONS=--max-old-space-size=4096 npx nx run craft-web:serve
   ```

4. **Optimize file watching in nx.json**
   ```json
   // nx.json
   {
     "tasksRunnerOptions": {
       "default": {
         "runner": "nx/tasks-runners/default",
         "options": {
           "cacheableOperations": ["build", "lint", "test", "e2e"],
           "watcherIgnorePatterns": [
             "**/node_modules/**",
             "**/dist/**",
             "**/.git/**"
           ]
         }
       }
     }
   }
   ```

## NestJS API Issues

### API Server Not Starting

**Symptoms:**
- NestJS server fails to start
- "Port already in use" errors
- Application build succeeds but won't run

**Solutions:**

1. **Check for port conflicts**
   ```bash
   # Windows:
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac:
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Verify environment configuration**
   ```bash
   # Check environment.ts file
   cat apps/craft-nest/src/environments/environment.ts
   ```

3. **Check server logs with increased verbosity**
   ```bash
   npx nx run craft-nest:serve --verbose
   ```

4. **Ensure storage directories exist**
   ```bash
   # Create required directories that might be missing
   mkdir -p apps/craft-nest/storage/documents/book
   ```

5. **Check for syntax or compilation errors**
   ```bash
   # Run linting to catch syntax errors
   npx nx lint craft-nest
   ```

## Angular Web Frontend Issues

### API Connection Refused

**Symptoms:** 
```
[webpack-dev-server] [HPM] Error occurred while proxying request localhost:4200/api/user/saveLoginDateTime to http://localhost:3000/ [ECONNREFUSED]
```

**Causes:** The frontend is running, but cannot connect to the backend API server.

**Solutions:**

1. **Start the backend server**
   ```bash
   # Start NestJS API
   npx nx run craft-nest:serve
   # OR start Go API
   npx nx run craft-go:serve
   ```

2. **Check if ports are already in use**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

3. **Verify proxy configuration**
   ```bash
   # Check proxy.configjson
   cat apps/craft-web/proxy.configjson
   ```

4. **Use mock data temporarily**
   ```typescript
   // In your component or service:
   import { environment } from 'src/environments/environment';
   
   // Enable mock data mode
   this.yahooService.setMockDataMode(true);
   this.apiService.useOfflineMode();
   ```

### Angular Build or Serve Errors

**Symptoms:**
- Errors during `nx serve craft-web`
- Angular compilation failures
- Package errors or dependency issues

**Solutions:**

1. **Clear Angular cache**
   ```bash
   rm -rf .angular/cache
   # or on Windows
   rmdir /s /q .angular\cache
   ```

2. **Update Angular CLI global version**
   ```bash
   npm install -g @angular/cli@latest
   ```

3. **Check for TypeScript version mismatches**
   ```bash
   npx nx report
   ```

## Go Backend Issues

**Symptoms:**
```
Error: listen tcp :4000: bind: address already in use
```

**Solutions:**

1. **Check for port conflicts**
   ```bash
   # Windows:
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F
   
   # Linux/Mac:
   lsof -i :4000
   kill -9 <PID>
   ```

2. **Change the port (if needed)**
   ```bash
   # Set PORT environment variable
   set PORT=4001
   npx nx run craft-go:serve
   
   # Or in Linux/Mac:
   PORT=4001 npx nx run craft-go:serve
   ```

## NX Workspace Issues

### Project Not Found

**Symptoms:**
- "Project not found" errors
- NX can't find a project that should exist

**Solutions:**

1. **Update NX workspace**
   ```bash
   npx nx g @nx/workspace:refresh
   ```

2. **Verify project exists in workspace.json/nx.json**
   ```bash
   npx nx show project craft-nest
   ```

3. **Remove NX cache folders**
   ```bash
   rm -rf node_modules/.cache/nx
   rm -rf .nx/cache
   ```

### NX Daemon Issues

**Symptoms:**
```
NX Nx Cloud Error
Cannot find module './lib/daemon/process-run-end'
```

**Solutions:**

1. **Restart NX daemon**
   ```bash
   npx nx reset
   ```

2. **Disable NX Cloud temporarily**
   ```bash
   # Use the --no-cloud flag
   npx nx --no-cloud run craft-nest:serve
   ```

3. **Update NX dependencies**
   ```bash
   npm update nx @nrwl/workspace
   ```

4. **Kill and restart NX daemon process**
   ```bash
   # Windows
   npx nx-stop-daemon
   # Linux/Mac
   pkill -f "nx-daemon"
   ```

## Memory-Related Issues

### JavaScript Heap Out of Memory

**Symptoms:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Increase Node.js memory limit**
   ```bash
   NODE_OPTIONS="--max-old-space-size=8192" npx nx run craft-web:serve
   ```

2. **Enable memory optimization in apps**
   ```typescript
   // In your component initialization
   this.adminStateService.updateTableMemoryUsage(0); // Reset usage
   this.tablePreparationService.configureForLargeDataset({
     chunkSize: 20,
     memoryThreshold: 100, // MB
     useVirtualScroll: true
   });
   ```

3. **Profile memory usage**
   ```bash
   # Start with inspector
   NODE_OPTIONS="--inspect" npx nx run craft-web:serve
   ```
   Then open Chrome at chrome://inspect and analyze memory usage.

## Environment Setup Issues

### Missing Dependencies or Tools

**Symptoms:**
- "Command not found" errors
- Missing binaries or tools
- Unexpected behavior in scripts

**Solutions:**

1. **Verify Node.js and npm versions**
   ```bash
   node -v  # Should match version in package.json engines field
   npm -v
   ```

2. **Install required global tools**
   ```bash
   npm install -g nx@latest
   npm install -g @angular/cli@latest
   npm install -g @nestjs/cli
   ```

3. **Reinstall project dependencies**
   ```bash
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

### PATH and Environment Issues

**Symptoms:**
- Tools not being found despite being installed
- "Command not found" errors
- Wrong versions of tools being used

**Solutions:**

1. **Check PATH environment variable**
   ```bash
   # Windows
   echo %PATH%
   
   # Linux/Mac
   echo $PATH
   ```

2. **Ensure npm global binaries are in PATH**
   ```bash
   # Add to Windows PATH
   set PATH=%PATH%;%APPDATA%\npm
   
   # Add to Linux/Mac PATH
   export PATH="$PATH:$(npm config get prefix)/bin"
   ```

## Dual-Backend Configuration

When running both NestJS and Go backends:

1. **Configure matching API paths**
   ```typescript
   // In apiService:
   this.setApiUrl('Nest'); // For NestJS backend
   // OR
   this.setApiUrl('Go');   // For Go backend
   ```

2. **Check for proper proxy configuration**
   ```json
   // proxy.configjson
   {
     "/api": {
       "target": "http://localhost:3000",
       "secure": false
     },
     "/api-go": {
       "target": "http://localhost:4000",
       "secure": false,
       "pathRewrite": {
         "^/api-go": ""
       }
     }
   }
   ```

## Testing Your Setup

After applying fixes, verify your environment:

1. **Backend Health Check**
   ```bash
   # Test NestJS API
   curl http://localhost:3000/api/health
   
   # Test Go API
   curl http://localhost:4000/health
   ```

2. **Frontend-to-Backend Connection**
   - Start the frontend with `npx nx run craft-web:serve`
   - Navigate to http://localhost:4200
   - Open browser developer tools (F12) and check Network tab
   - Verify API calls succeed with 200 status codes

3. **Use the built-in API Tester**
   - Navigate to http://localhost:4200/admin/api-tester
   - Use the interface to test specific endpoints
   - Check response times and status codes

## Prevention Best Practices

1. **Add pre-start script to check environment**
   - Create a script that verifies ports are available
   - Check for required services before starting

2. **Implement graceful backend shutdown**
   - Ensure proper cleanup of resources
   - Close file handles when terminating

3. **Optimize webpack configuration**
   - Reduce the number of watched files
   - Increase file watching limits

4. **Use the Health Dashboard**
   - Monitor system health through the admin dashboard
   - Check memory usage metrics
   - Watch for increasing resource trends

## WebSocket Connection Issues

### Gateway Timeout Errors

**Symptoms:**
- 504 Gateway Timeout errors in browser console
- Socket connection fails to establish
- "Socket connected successfully" message never appears in logs
- API requests failing with timeout errors

**Causes:**
1. Backend server not running or inaccessible
2. Incorrect proxy configuration for WebSocket endpoints
3. Missing transport fallback options
4. Authentication token issues with WebSocket connections
5. CORS policy restrictions

**Solutions:**

1. **Configure proper Socket.IO transport options**
   ```typescript
   // In your socket service
   this.socket = io(this.socketUrl, {
     transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
     reconnectionAttempts: 5,
     reconnectionDelay: 1000,
     timeout: 10000
   });
   ```

2. **Verify proxy configuration includes WebSocket support**
   ```json
   // In proxy.configjson
   {
     "/api": {
       "target": "http://localhost:3000",
       "secure": false,
       "ws": true
     }
   }
   ```

3. **Check server logs for socket connection attempts**
   ```bash
   # Start backend with verbose logging
   DEBUG=socket.io* npx nx run craft-nest:serve
   ```

4. **Test socket connection with a standalone client**
   ```javascript
   // Create a test.html file with this code
   <script src="https://cdn.socket.io/4.4.1/socket.io.min.js"></script>
   <script>
     const socket = io('http://localhost:3000', {
       transports: ['websocket', 'polling']
     });
     socket.on('connect', () => {
       console.log('Connected!', socket.id);
     });
     socket.on('connect_error', (err) => {
       console.error('Connection error:', err);
     });
   </script>
   ```

5. **Verify CORS configuration on the server**
   ```typescript
   // In NestJS main.ts
   const app = await NestFactory.create(AppModule);
   app.enableCors({
     origin: true,
     methods: ['GET', 'POST'],
     credentials: true,
   });
   ```

6. **Restart both frontend and backend services**
   ```bash
   # Terminate and restart everything
   npx nx run craft-nest:serve
   # In another terminal
   npx nx run craft-web:serve
   ```

## Authentication Integration Issues

### Login State Not Synchronizing

**Symptoms:**
- User appears logged in but has no permissions
- Admin status not being recognized after login
- Authentication state resets unexpectedly
- WebSocket connections don't send authentication data

**Causes:**
1. AdminStateService not being updated on login/logout
2. Authentication tokens not being properly stored
3. Socket connections not being refreshed with new auth state
4. Race conditions between authentication and service initialization

**Solutions:**

1. **Ensure AdminStateService updates on authentication changes**
   ```typescript
   // In your AuthenticationService
   login(username: string, password: string): Observable<any> {
     return this.http.post<any>('/api/auth/login', { username, password }).pipe(
       tap(response => {
         this.sessionService.setToken(response.token);
         
         // Update admin state based on user roles
         const isAdmin = this.hasAdminRole(response.user);
         this.adminStateService.setAdminStatus(isAdmin);
         
         // Reconnect sockets with new token
         this.socketService.reconnectWithAuth(response.token);
       }),
       catchError(error => {
         this.logger.error('Login failed', { error, username });
         return throwError(() => error);
       })
     );
   }
   ```

2. **Fix token storage and retrieval**
   ```typescript
   // In SessionService
   setToken(token: string): void {
     localStorage.setItem('auth_token', token);
     this.tokenSubject.next(token);
   }
   
   getToken(): string | null {
     return localStorage.getItem('auth_token');
   }
   ```

3. **Implement proper service initialization order**
   ```typescript
   // In app.component.ts
   ngOnInit() {
     // First restore authentication from storage
     this.authService.restoreAuthState().pipe(
       // Then initialize dependent services
       tap(() => this.socketService.initialize()),
       tap(() => this.loggerService.startPollingBackendLogs())
     ).subscribe();
   }
   ```

4. **Add socket reconnection with authentication**
   ```typescript
   // In SocketService
   reconnectWithAuth(token: string): void {
     // Disconnect existing socket
     if (this.socket && this.socket.connected) {
       this.socket.disconnect();
     }
     
     // Reconnect with auth token
     this.socket = io(this.socketUrl, {
       transports: ['websocket', 'polling'],
       auth: {
         token: token
       }
     });
     
     // Setup event handlers
     this.setupSocketEventHandlers();
   }
   ```

## Realtime Data Issues

### Socket-Based Data Not Updating

**Symptoms:**
- Real-time charts not updating
- Socket events not being received
- Console shows socket connection but no event data

**Causes:**
1. Socket namespace mismatch between client and server
2. Event name discrepancies 
3. Incorrect event payload format
4. Missing error handling for socket events
5. Component destroying socket subscriptions improperly

**Solutions:**

1. **Verify socket namespaces match exactly**
   ```typescript
   // Server-side (NestJS)
   @WebSocketGateway({ namespace: 'data-feeds' })
   
   // Client-side (Angular)
   this.socket = io('http://localhost:3000/data-feeds');
   ```

2. **Check event names for exact matches**
   ```typescript
   // Server-side emission
   this.server.emit('chart:update', payload);
   
   // Client-side reception
   this.socket.on('chart:update', (data) => {
     // Handler code
   });
   ```

3. **Implement proper socket cleanup**
   ```typescript
   // In your component
   private destroyed$ = new Subject<void>();
   
   ngOnInit() {
     this.socketService.on<ChartData[]>('chart:update')
       .pipe(takeUntil(this.destroyed$))
       .subscribe(data => {
         this.chartData = data;
       });
   }
   
   ngOnDestroy() {
     this.destroyed$.next();
     this.destroyed$.complete();
   }
   ```

4. **Add explicit error handling**
   ```typescript
   this.socket.on('connect_error', (error) => {
     this.logger.error('Socket connection error', { error, socketUrl: this.socketUrl });
     this.handleConnectionFailure();
   });
   ```

5. **Validate data structure on both ends**
   ```typescript
   // Type-check incoming socket data
   this.socket.on('chart:update', (rawData: unknown) => {
     try {
       // Validate data structure matches expected type
       const chartData = validateChartData(rawData);
       this.updateChart(chartData);
     } catch (error) {
       this.logger.error('Invalid chart data received', { error, rawData });
     }
   });
   ```
