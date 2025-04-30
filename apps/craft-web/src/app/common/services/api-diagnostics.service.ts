import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer, throwError } from 'rxjs';
import { catchError, map, retry, shareReplay, switchMap, tap, delay, retryWhen, take } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';
import { io } from 'socket.io-client';

export interface ConnectionDiagnostics {
  isConnected: boolean;
  status: 'healthy' | 'degraded' | 'unavailable';
  lastChecked: Date;
  error?: string;
  serverBinding?: string;
  portStatus?: string;
  responseTimes?: number[];
}

export interface SocketDiagnostics {
  isConnected: boolean;
  connectionId?: string;
  pingTime?: number;
  reconnectAttempts: number;
  lastError?: string;
  socketUrl?: string;
}

export interface NamespacedSocketStatus {
  namespace: string;
  isConnected: boolean;
  connectionId?: string;
  lastError?: string;
  lastConnectedTime?: Date;
  lastDisconnectedTime?: Date;
}

export interface ProxyRouteStatus {
  route: string;
  lastAttempted?: Date;
  lastSuccessful?: Date;
  consecutiveFailures: number;
  error?: string;
  statusCode?: number;
}

/**
 * API Diagnostics Service
 * 
 * Monitors API connectivity and provides diagnostics for troubleshooting
 * connection issues between the frontend and backend services.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiDiagnosticsService {
  private diagnosticsSubject = new BehaviorSubject<ConnectionDiagnostics>({
    isConnected: false,
    status: 'unavailable',
    lastChecked: new Date()
  });
  private socketDiagnosticsSubject = new BehaviorSubject<SocketDiagnostics>({
    isConnected: false,
    reconnectAttempts: 0
  });
  
  // Track namespace-specific socket statuses
  private namespaceSocketsSubject = new BehaviorSubject<NamespacedSocketStatus[]>([]);
  
  // Track known namespaces with their connection status
  private knownNamespaces = new Map<string, NamespacedSocketStatus>();
  
  private checkInterval = 30000; // 30 seconds
  private retryCount = 3;
  private retryDelay = 1000;
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 5;
  private socketInstance: any = null;
  private socketReconnectAttempts = 0;
  private maxSocketReconnectAttempts = 10;
  
  // Namespace-specific socket instances
  private namespaceSocketInstances = new Map<string, any>();

  // Expose as observable for components to consume
  readonly diagnostics$ = this.diagnosticsSubject.asObservable();
  readonly isConnected$ = this.diagnostics$.pipe(map(d => d.isConnected));
  readonly socketDiagnostics$ = this.socketDiagnosticsSubject.asObservable();
  readonly isSocketConnected$ = this.socketDiagnostics$.pipe(map(d => d.isConnected));
  readonly namespaceStatuses$ = this.namespaceSocketsSubject.asObservable();
  
  // Get count of working socket namespaces
  readonly workingSocketsCount$ = this.namespaceSocketsSubject.pipe(
    map(namespaces => namespaces.filter(ns => ns.isConnected).length)
  );

  // Check if at least one socket is working
  readonly hasAnyWorkingSocket$ = this.workingSocketsCount$.pipe(
    map(count => count > 0)
  );

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.logger.registerService('ApiDiagnosticsService');
    this.logger.info('API Diagnostics Service initialized');
    this.startHealthCheck();
  }

  /**
   * Perform an immediate health check
   */
  checkConnectionNow(): Observable<ConnectionDiagnostics> {
    const startTime = Date.now();
    
    return this.http.get<any>(`${environment.apiUrl}/api`, {
      headers: { 'Cache-Control': 'no-cache' }
    }).pipe(
      map(response => {
        const responseTime = Date.now() - startTime;
        const currentDiagnostics = this.diagnosticsSubject.value;
        const responseTimes = [...(currentDiagnostics.responseTimes || []), responseTime].slice(-5);
        
        this.consecutiveFailures = 0; // Reset failure counter on success
        
        const diagnostics: ConnectionDiagnostics = {
          isConnected: true,
          status: this.determineStatus(responseTime),
          lastChecked: new Date(),
          responseTimes,
          serverBinding: this.extractServerBinding(response)
        };
        
        this.diagnosticsSubject.next(diagnostics);
        this.logger.debug('API connection healthy', diagnostics);
        return diagnostics;
      }),
      catchError(error => {
        this.consecutiveFailures++;
        
        const diagnostics: ConnectionDiagnostics = {
          isConnected: false,
          status: 'unavailable',
          lastChecked: new Date(),
          error: this.formatError(error)
        };
        
        this.diagnosticsSubject.next(diagnostics);
        
        // Only log failures until we reach the threshold to avoid flooding logs
        if (this.consecutiveFailures <= this.maxConsecutiveFailures) {
          this.logger.warn('API connection failed', { 
            error: diagnostics.error,
            url: `${environment.apiUrl}/api`,
            consecutiveFailures: this.consecutiveFailures
          });
        } else if (this.consecutiveFailures === this.maxConsecutiveFailures + 1) {
          // Log one more time when we cross the threshold
          this.logger.warn(`API connection failures threshold reached (${this.maxConsecutiveFailures}). Suppressing further logs until connection restored.`, {
            error: diagnostics.error
          });
        }
        
        return of(diagnostics);
      }),
      shareReplay(1)
    );
  }

  /**
   * Start automated health checks
   */
  startHealthCheck(): void {
    timer(1000, this.checkInterval).pipe(
      switchMap(() => this.checkConnectionNow().pipe(
        retry({
          count: this.retryCount,
          delay: this.retryDelay
        }),
        catchError(error => {
          if (this.consecutiveFailures <= this.maxConsecutiveFailures) {
            this.logger.error('All API health check retries failed', { 
              error: this.formatError(error),
              retries: this.retryCount
            });
          }
          return of(null);
        })
      ))
    ).subscribe();
  }

  /**
   * Run network diagnostics to determine the cause of connectivity issues
   */
  runNetworkDiagnostics(): Observable<string> {
    this.logger.info('Running network diagnostics');
    
    return this.http.get<any>(`${environment.apiUrl}/api`, { 
      headers: { 'X-Diagnostics': 'true' } 
    }).pipe(
      map(() => 'Connection successful'),
      catchError(error => {
        let diagnosticMessage = 'Network diagnostics results:\n';
        
        if (error.status === 0) {
          diagnosticMessage += '- Server unreachable (ECONNREFUSED)\n';
          diagnosticMessage += '- Possible causes:\n';
          diagnosticMessage += '  • Backend server is not running\n';
          diagnosticMessage += '  • Backend server is binding only to 127.0.0.1 (not 0.0.0.0)\n';
          diagnosticMessage += '  • Firewall is blocking the connection\n';
          diagnosticMessage += '  • Port 3000 is in use by another process\n';
          diagnosticMessage += '\n- Recommendations:\n';
          diagnosticMessage += '  • Verify NestJS is still running with "npx nx run craft-nest:serve"\n';
          diagnosticMessage += '  • Check server binding in main.ts (should use 0.0.0.0)\n';
          diagnosticMessage += '  • Check firewall settings\n';
          diagnosticMessage += '  • Run "netstat -ano | findstr :3000" to check for port conflicts\n';
          diagnosticMessage += '  • Try accessing the API endpoint directly: "curl http://localhost:3000/api"\n';
        } else if (error.status === 504) {
          diagnosticMessage += `- HTTP Error 504: Gateway Timeout\n`;
          diagnosticMessage += '- Possible causes:\n';
          diagnosticMessage += '  • API server is overloaded\n';
          diagnosticMessage += '  • Request is taking too long to process\n';
          diagnosticMessage += '  • Proxy timeout settings are too restrictive\n';
          diagnosticMessage += '  • Network congestion between client and server\n';
          diagnosticMessage += '\n- Recommendations:\n';
          diagnosticMessage += '  • Check if the API server is running and responsive\n';
          diagnosticMessage += '  • Verify proxy configuration and timeout settings\n';
          diagnosticMessage += '  • Increase timeout limits in the proxy configuration\n';
          diagnosticMessage += '  • Check for long-running operations that might block the server\n';
          diagnosticMessage += '  • Examine server logs for potential memory/CPU bottlenecks\n';
        } else if (error.status === 404) {
          diagnosticMessage += `- HTTP Error 404: Endpoint not found\n`;
          diagnosticMessage += '- Possible causes:\n';
          diagnosticMessage += '  • API route does not exist\n';
          diagnosticMessage += '  • Proxy configuration incorrect\n';
          diagnosticMessage += '\n- Recommendations:\n';
          diagnosticMessage += '  • Check if the API endpoint exists in the backend\n';
          diagnosticMessage += '  • Verify proxy.conf.json settings\n';
        } else if (error.status === 403) {
          diagnosticMessage += `- HTTP Error 403: Forbidden\n`;
          diagnosticMessage += '- Possible causes:\n';
          diagnosticMessage += '  • CORS policy blocking the request\n';
          diagnosticMessage += '  • Authentication required but not provided\n';
          diagnosticMessage += '\n- Recommendations:\n';
          diagnosticMessage += '  • Check CORS configuration in backend\n';
          diagnosticMessage += '  • Verify authentication requirements\n';
        } else {
          diagnosticMessage += `- HTTP Error ${error.status}: ${error.statusText}\n`;
          diagnosticMessage += `- Message: ${error.message || 'No additional details'}\n`;
        }
        
        this.logger.info(diagnosticMessage);
        return of(diagnosticMessage);
      })
    );
  }

  /**
   * Perform port availability check
   */
  checkPortAvailability(): Observable<string> {
    return this.http.get<any>(`${environment.apiUrl}/api/health/ports`, {
      headers: { 'X-Diagnostics': 'true' }
    }).pipe(
      map(response => {
        if (response && response.ports) {
          const ports = response.ports;
          let message = 'Port status:\n';
          
          Object.keys(ports).forEach(port => {
            message += `- Port ${port}: ${ports[port] ? 'In use' : 'Available'}\n`;
          });
          
          return message;
        }
        return 'Port availability check completed, but no data returned';
      }),
      catchError(error => {
        return of(`Port availability check failed: ${this.formatError(error)}`);
      })
    );
  }

  /**
   * Suggest fixes for common connection issues
   */
  getSuggestedFixes(): string[] {
    const currentDiagnostics = this.diagnosticsSubject.value;
    const suggestions: string[] = [];
    
    if (!currentDiagnostics.isConnected) {
      suggestions.push('Ensure the NestJS backend is running with "npx nx run craft-nest:serve"');
      suggestions.push('Check if the server is binding to 0.0.0.0 instead of localhost in main.ts');
      suggestions.push('Verify the proxy configuration in angular.json or proxy.conf.json');
      suggestions.push('Try restarting both frontend and backend services');
      suggestions.push('Check environment.apiUrl setting is correct');
      
      if (currentDiagnostics.error?.includes('ECONNREFUSED')) {
        suggestions.push('The server appears to be running but refusing connections - check firewall settings');
        suggestions.push('Verify the port is not in use by another process');
        suggestions.push('Try manually accessing the API endpoint: curl http://localhost:3000/api');
      }

      // Add specific suggestions for Gateway Timeout errors
      if (currentDiagnostics.error?.includes('504') || currentDiagnostics.error?.includes('Gateway Timeout')) {
        suggestions.push('Gateway Timeout detected - the server took too long to respond');
        suggestions.push('Check if the server is overloaded or processing long-running operations');
        suggestions.push('Verify proxy timeout settings are appropriate (might need to increase)');
        suggestions.push('Look for memory leaks or CPU bottlenecks on the server');
        suggestions.push('Check network latency between client and server');
      }
    } else if (currentDiagnostics.status === 'degraded') {
      suggestions.push('API connection is slow - check network latency');
      suggestions.push('Consider optimizing backend API responses');
      suggestions.push('Check server load and resource utilization');
    }
    
    return suggestions;
  }

  /**
   * Get WebSocket connection status
   */
  checkSocketConnection(): Observable<boolean> {
    return this.http.get<any>(`${environment.apiUrl}/api/socket-status`).pipe(
      map(response => response.connected === true),
      catchError(() => of(false))
    );
  }

  /**
   * Initialize and monitor socket connection
   */
  initializeSocketMonitoring(socketUrl?: string): void {
    if (!socketUrl) {
      socketUrl = environment.apiUrl;
    }

    this.logger.info('Initializing socket monitoring', { socketUrl });
    
    try {
      // Close existing socket if any
      if (this.socketInstance) {
        this.socketInstance.disconnect();
      }

      this.socketInstance = io(socketUrl);

      this.socketInstance.on('connect', () => {
        this.socketReconnectAttempts = 0;
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: true,
          connectionId: this.socketInstance.id,
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.info('Socket connected successfully', { 
          socketId: this.socketInstance.id,
          url: socketUrl 
        });

        // Measure ping time
        this.measureSocketLatency();
      });

      this.socketInstance.on('disconnect', (reason) => {
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          lastError: reason,
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.warn('Socket disconnected', { reason });
      });

      this.socketInstance.on('error', (error) => {
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          lastError: error.message || 'Unknown socket error',
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.error('Socket connection error', { error });
      });

      this.socketInstance.on('reconnect_attempt', (attempt) => {
        this.socketReconnectAttempts = attempt;
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          reconnectAttempts: attempt,
          socketUrl
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.info('Socket reconnection attempt', { attempt });
      });

      this.socketInstance.on('reconnect_failed', () => {
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          lastError: 'Reconnection failed after maximum attempts',
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.error('Socket reconnection failed', { 
          attempts: this.socketReconnectAttempts 
        });
      });
    } catch (error) {
      this.logger.error('Error initializing socket connection', { error });
    }
  }

  /**
   * Measure socket latency using ping-pong
   */
  measureSocketLatency(): void {
    if (!this.socketInstance || !this.socketInstance.connected) {
      return;
    }

    const start = Date.now();
    
    // Using a custom ping event - the server needs to respond with a 'pong' event
    this.socketInstance.emit('ping', {}, () => {
      const latency = Date.now() - start;
      const currentDiagnostics = this.socketDiagnosticsSubject.value;
      
      this.socketDiagnosticsSubject.next({
        ...currentDiagnostics,
        pingTime: latency
      });
      
      this.logger.debug('Socket latency', { latency: `${latency}ms` });
    });

    // Schedule next measurement
    setTimeout(() => this.measureSocketLatency(), 30000);
  }

  /**
   * Manually attempt to reconnect socket
   */
  reconnectSocket(): Observable<boolean> {
    if (!this.socketInstance) {
      return throwError(() => new Error('Socket not initialized'));
    }

    this.logger.info('Manually reconnecting socket...');
    
    return new Observable<boolean>(observer => {
      try {
        this.socketInstance.disconnect();
        
        // Allow some time for disconnection to complete
        setTimeout(() => {
          this.socketInstance.connect();
          
          // Subscribe to connection event only once for this reconnection attempt
          const onConnect = () => {
            this.socketInstance.off('connect', onConnect);
            this.socketInstance.off('connect_error', onError);
            observer.next(true);
            observer.complete();
          };
          
          const onError = (error) => {
            this.socketInstance.off('connect', onConnect);
            this.socketInstance.off('connect_error', onError);
            observer.error(error);
          };
          
          this.socketInstance.once('connect', onConnect);
          this.socketInstance.once('connect_error', onError);
          
          // Set timeout for reconnection attempt
          setTimeout(() => {
            this.socketInstance.off('connect', onConnect);
            this.socketInstance.off('connect_error', onError);
            observer.error(new Error('Reconnection timeout'));
          }, 5000);
        }, 1000);
      } catch (error) {
        observer.error(error);
      }
    }).pipe(
      retryWhen(errors => errors.pipe(
        delay(1000),
        tap(error => this.logger.warn('Retrying socket reconnection after error', { error })),
        // Limit retries
        tap(() => {
          this.socketReconnectAttempts++;
          if (this.socketReconnectAttempts >= this.maxSocketReconnectAttempts) {
            throw new Error(`Maximum reconnection attempts (${this.maxSocketReconnectAttempts}) reached`);
          }
        })
      ))
    );
  }

  /**
   * Initialize monitoring for a specific socket namespace
   * @param namespace The Socket.IO namespace to monitor (e.g., 'health', 'yahoo', 'user-state')
   * @param socketUrl Base socket URL (defaults to environment.apiUrl)
   */
  monitorNamespaceSocket(namespace: string, socketUrl?: string): void {
    if (!socketUrl) {
      socketUrl = environment.apiUrl;
    }

    const namespaceUrl = namespace ? `${socketUrl}/${namespace}` : socketUrl;
    this.logger.info(`Initializing monitoring for socket namespace: ${namespace}`, { socketUrl: namespaceUrl });
    
    try {
      // Close existing namespace socket if any
      if (this.namespaceSocketInstances.has(namespace)) {
        const existingSocket = this.namespaceSocketInstances.get(namespace);
        if (existingSocket) {
          existingSocket.disconnect();
        }
      }

      // Create new namespace socket
      const nsSocket = io(namespaceUrl);
      this.namespaceSocketInstances.set(namespace, nsSocket);
      
      // Create initial status for this namespace if it doesn't exist
      if (!this.knownNamespaces.has(namespace)) {
        this.knownNamespaces.set(namespace, {
          namespace,
          isConnected: false,
          connectionId: undefined,
          lastError: undefined
        });
      }

      // Setup event listeners for this namespace
      nsSocket.on('connect', () => {
        const status: NamespacedSocketStatus = {
          namespace,
          isConnected: true,
          connectionId: nsSocket.id,
          lastConnectedTime: new Date()
        };
        
        this.knownNamespaces.set(namespace, status);
        this.updateNamespaceStatuses();
        
        this.logger.info(`Socket namespace ${namespace} connected successfully`, { 
          socketId: nsSocket.id,
          url: namespaceUrl 
        });
      });

      nsSocket.on('disconnect', (reason) => {
        const existingStatus = this.knownNamespaces.get(namespace) || {
          namespace,
          isConnected: false
        };
        
        const status: NamespacedSocketStatus = {
          ...existingStatus,
          isConnected: false,
          lastError: reason,
          lastDisconnectedTime: new Date()
        };
        
        this.knownNamespaces.set(namespace, status);
        this.updateNamespaceStatuses();
        
        this.logger.warn(`Socket namespace ${namespace} disconnected`, { reason });
      });

      nsSocket.on('error', (error) => {
        const existingStatus = this.knownNamespaces.get(namespace) || {
          namespace,
          isConnected: false
        };
        
        const status: NamespacedSocketStatus = {
          ...existingStatus,
          isConnected: false,
          lastError: error.message || 'Unknown socket error',
          lastDisconnectedTime: new Date()
        };
        
        this.knownNamespaces.set(namespace, status);
        this.updateNamespaceStatuses();
        
        this.logger.error(`Socket namespace ${namespace} error`, { error });
      });

    } catch (error) {
      this.logger.error(`Error initializing ${namespace} namespace socket`, { error });
      
      // Update status to reflect initialization error
      const status: NamespacedSocketStatus = {
        namespace,
        isConnected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error during initialization',
        lastDisconnectedTime: new Date()
      };
      
      this.knownNamespaces.set(namespace, status);
      this.updateNamespaceStatuses();
    }
  }

  /**
   * Initialize monitoring for all known socket namespaces
   */
  monitorAllNamespaces(socketUrl?: string): void {
    // Common namespaces used in the application
    const commonNamespaces = ['health', 'yahoo', 'user-state'];
    
    commonNamespaces.forEach(namespace => {
      this.monitorNamespaceSocket(namespace, socketUrl);
    });
    
    // Also monitor the default namespace
    this.monitorNamespaceSocket('', socketUrl);
  }

  /**
   * Reconnect a specific namespace socket
   * @param namespace The namespace to reconnect
   * @returns Observable indicating success or failure
   */
  reconnectNamespaceSocket(namespace: string): Observable<boolean> {
    const nsSocket = this.namespaceSocketInstances.get(namespace);
    if (!nsSocket) {
      return throwError(() => new Error(`Socket namespace ${namespace} not initialized`));
    }

    this.logger.info(`Manually reconnecting ${namespace} socket...`);
    
    return new Observable<boolean>(observer => {
      try {
        nsSocket.disconnect();
        
        // Allow some time for disconnection to complete
        setTimeout(() => {
          nsSocket.connect();
          
          // Subscribe to connection event only once for this reconnection attempt
          const onConnect = () => {
            nsSocket.off('connect', onConnect);
            nsSocket.off('connect_error', onError);
            observer.next(true);
            observer.complete();
          };
          
          const onError = (error) => {
            nsSocket.off('connect', onConnect);
            nsSocket.off('connect_error', onError);
            observer.error(error);
          };
          
          nsSocket.once('connect', onConnect);
          nsSocket.once('connect_error', onError);
          
          // Set timeout for reconnection attempt
          setTimeout(() => {
            nsSocket.off('connect', onConnect);
            nsSocket.off('connect_error', onError);
            observer.error(new Error(`Reconnection timeout for namespace ${namespace}`));
          }, 5000);
        }, 1000);
      } catch (error) {
        observer.error(error);
      }
    }).pipe(
      retryWhen(errors => errors.pipe(
        delay(1000),
        tap(error => this.logger.warn(`Retrying ${namespace} socket reconnection after error`, { error })),
        // Limit retries
        tap(count => {
          if (count >= 3) {
            throw new Error(`Maximum reconnection attempts reached for namespace ${namespace}`);
          }
        }),
        take(3)
      ))
    );
  }

  /**
   * Run diagnostics for specific socket namespace
   */
  runNamespaceDiagnostics(namespace: string): Observable<string> {
    this.logger.info(`Running diagnostics for socket namespace: ${namespace}`);
    
    const namespaceStatus = this.knownNamespaces.get(namespace);
    if (!namespaceStatus) {
      return of(`Namespace ${namespace} is not being monitored. Use monitorNamespaceSocket() first.`);
    }
    
    let diagnosticMessage = `Socket namespace ${namespace} diagnostics results:\n`;
    diagnosticMessage += `- Connected: ${namespaceStatus.isConnected ? 'Yes' : 'No'}\n`;
    
    if (namespaceStatus.connectionId) {
      diagnosticMessage += `- Socket ID: ${namespaceStatus.connectionId}\n`;
    }
    
    if (namespaceStatus.lastConnectedTime) {
      diagnosticMessage += `- Last connected: ${namespaceStatus.lastConnectedTime.toISOString()}\n`;
    }
    
    if (namespaceStatus.lastDisconnectedTime) {
      diagnosticMessage += `- Last disconnected: ${namespaceStatus.lastDisconnectedTime.toISOString()}\n`;
    }
    
    if (namespaceStatus.lastError) {
      diagnosticMessage += `- Last error: ${namespaceStatus.lastError}\n`;
    }
    
    // Add namespace-specific recommendations
    diagnosticMessage += '\n- Recommendations:\n';
    
    if (!namespaceStatus.isConnected) {
      diagnosticMessage += `  • Check if the '${namespace}' namespace is properly configured on the server\n`;
      diagnosticMessage += '  • Verify the server is listening on this namespace\n';
      diagnosticMessage += `  • Try reconnecting using reconnectNamespaceSocket('${namespace}')\n`;
      
      if (namespaceStatus.lastError?.includes('timeout')) {
        diagnosticMessage += '  • Connection timeout detected - check for overloaded handlers in this namespace\n';
      }
    }
    
    return of(diagnosticMessage);
  }

  /**
   * Get enhanced diagnostic data including namespace statuses
   */
  getEnhancedDiagnosticData(): Observable<any> {
    return this.getDiagnosticDashboardData().pipe(
      map(dashboardData => ({
        ...dashboardData,
        socketNamespaces: Array.from(this.knownNamespaces.values()),
        partialConnectivity: {
          hasAnyWorkingSocket: this.getWorkingSocketsCount() > 0,
          workingSocketsCount: this.getWorkingSocketsCount(),
          totalNamespaces: this.knownNamespaces.size,
          partiallyWorking: this.getWorkingSocketsCount() > 0 && 
                            this.getWorkingSocketsCount() < this.knownNamespaces.size
        },
        enhancedRecommendations: this.getPartialConnectivitySuggestions()
      }))
    );
  }

  /**
   * Get specific recommendations for partial socket connectivity
   */
  getPartialConnectivitySuggestions(): string[] {
    const suggestions: string[] = [];
    const workingSockets = Array.from(this.knownNamespaces.values()).filter(ns => ns.isConnected);
    const failingSockets = Array.from(this.knownNamespaces.values()).filter(ns => !ns.isConnected);
    
    if (workingSockets.length > 0 && failingSockets.length > 0) {
      suggestions.push('Some socket namespaces are working while others are failing:');
      suggestions.push(`- Working namespaces: ${workingSockets.map(s => s.namespace || 'default').join(', ')}`);
      suggestions.push(`- Failing namespaces: ${failingSockets.map(s => s.namespace || 'default').join(', ')}`);
      suggestions.push('This suggests a namespace-specific configuration issue rather than a general connectivity problem.');
      suggestions.push('Check the server logs for errors related to the specific failing namespaces.');
      
      if (failingSockets.some(s => s.lastError?.includes('timeout'))) {
        suggestions.push('One or more namespaces are experiencing timeout issues. Check for long-running operations.');
      }
      
      if (failingSockets.some(s => s.lastError?.includes('auth'))) {
        suggestions.push('Authentication issues detected in some namespaces. Verify credentials for these specific namespaces.');
      }
    }
    
    return suggestions;
  }

  /**
   * Get diagnostic data formatted for dashboard display
   */
  getDiagnosticDashboardData(): Observable<any> {
    const connectionDiagnostics = this.diagnosticsSubject.value;
    const socketDiagnostics = this.socketDiagnosticsSubject.value;
    
    return of({
      apiConnection: {
        status: connectionDiagnostics.status,
        isConnected: connectionDiagnostics.isConnected,
        lastChecked: connectionDiagnostics.lastChecked,
        responseTimes: connectionDiagnostics.responseTimes || [],
        averageResponseTime: this.calculateAverageResponseTime(connectionDiagnostics.responseTimes || [])
      },
      socketConnection: {
        isConnected: socketDiagnostics.isConnected,
        reconnectAttempts: socketDiagnostics.reconnectAttempts,
        pingTime: socketDiagnostics.pingTime,
        connectionId: socketDiagnostics.connectionId
      },
      suggestions: this.getSuggestedFixes(),
      namespaceStatuses: Array.from(this.knownNamespaces.values())
    });
  }

  /**
   * Update the namespace statuses observable
   */
  private updateNamespaceStatuses(): void {
    const statuses = Array.from(this.knownNamespaces.values());
    this.namespaceSocketsSubject.next(statuses);
    
    // Update the main socket status based on aggregate namespace status
    const anyConnected = statuses.some(s => s.isConnected);
    const anyFailing = statuses.some(s => !s.isConnected);
    
    // If we have both working and failing connections, update the main status
    if (anyConnected) {
      const socketDiagnostics: SocketDiagnostics = {
        ...this.socketDiagnosticsSubject.value,
        isConnected: true,
        lastError: anyFailing ? 'Some socket namespaces are failing' : undefined
      };
      this.socketDiagnosticsSubject.next(socketDiagnostics);
    }
  }

  /**
   * Get the count of working socket namespaces
   */
  private getWorkingSocketsCount(): number {
    return Array.from(this.knownNamespaces.values()).filter(ns => ns.isConnected).length;
  }

  private determineStatus(responseTime: number): 'healthy' | 'degraded' | 'unavailable' {
    if (responseTime < 300) return 'healthy';
    if (responseTime < 1000) return 'degraded';
    return 'unavailable';
  }

  private calculateAverageResponseTime(responseTimes: number[]): number {
    if (!responseTimes.length) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private extractServerBinding(response: any): string {
    // Try to extract server binding info if available in response
    if (response?.serverInfo?.binding) {
      return response.serverInfo.binding;
    }
    
    // Make an educated guess based on the environment
    if (environment.production) {
      return 'Production server';
    } else {
      return 'Development server (localhost:3000)';
    }
  }

  private formatError(error: any): string {
    if (!error) return 'Unknown error';
    
    if (error.status === 0) {
      if (error.message && error.message.includes('ECONNREFUSED')) {
        return 'Connection refused (ECONNREFUSED) - Backend server may not be running';
      }
      return 'Connection refused - Network error';
    }
    
    if (error.status === 504) {
      return `504: Gateway Timeout - Server took too long to respond`;
    }
    
    return `${error.status}: ${error.statusText || error.message || 'Unknown error'}`;
  }
}
