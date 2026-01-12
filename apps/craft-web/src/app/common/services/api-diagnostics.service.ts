import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer, throwError } from 'rxjs';
import { catchError, map, retry, shareReplay, switchMap, tap, delay, retryWhen, take } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';

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

interface PortsResponse {
  ports?: Record<string, boolean>;
}

interface SocketStatusResponse {
  connected?: boolean;
}

interface ServerInfoResponse {
  serverInfo?: {
    binding?: string;
  };
}

interface HttpErrorLike {
  status?: number;
  statusText?: string;
  message?: string;
}

interface DiagnosticDashboardData {
  apiConnection: {
    status: ConnectionDiagnostics['status'];
    isConnected: boolean;
    lastChecked: Date;
    responseTimes: number[];
    averageResponseTime: number;
  };
  socketConnection: {
    isConnected: boolean;
    reconnectAttempts: number;
    pingTime?: number;
    connectionId?: string;
  };
  suggestions: string[];
  namespaceStatuses: NamespacedSocketStatus[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiDiagnosticsService {
  private diagnosticsSubject = new BehaviorSubject<ConnectionDiagnostics>({
    isConnected: false,
    status: 'unavailable',
    lastChecked: new Date(),
  });
  private socketDiagnosticsSubject = new BehaviorSubject<SocketDiagnostics>({
    isConnected: false,
    reconnectAttempts: 0,
  });

  private namespaceSocketsSubject = new BehaviorSubject<NamespacedSocketStatus[]>([]);

  private knownNamespaces = new Map<string, NamespacedSocketStatus>();

  private checkInterval = 30000;              
  private retryCount = 3;
  private retryDelay = 1000;
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 5;
  private socketInstance: Socket | null = null;
  private socketReconnectAttempts = 0;
  private maxSocketReconnectAttempts = 10;

  private namespaceSocketInstances = new Map<string, Socket>();

  readonly diagnostics$ = this.diagnosticsSubject.asObservable();
  readonly isConnected$ = this.diagnostics$.pipe(map(d => d.isConnected));
  readonly socketDiagnostics$ = this.socketDiagnosticsSubject.asObservable();
  readonly isSocketConnected$ = this.socketDiagnostics$.pipe(map(d => d.isConnected));
  readonly namespaceStatuses$ = this.namespaceSocketsSubject.asObservable();

  readonly workingSocketsCount$ = this.namespaceSocketsSubject.pipe(map(namespaces => namespaces.filter(ns => ns.isConnected).length));

  readonly hasAnyWorkingSocket$ = this.workingSocketsCount$.pipe(map(count => count > 0));

  constructor(
    private http: HttpClient,
    private logger: LoggerService,
  ) {
    this.logger.registerService('ApiDiagnosticsService');
    this.logger.info('API Diagnostics Service initialized');
    this.startHealthCheck();
  }

  checkConnectionNow(): Observable<ConnectionDiagnostics> {
    const startTime = Date.now();

    return this.http
      .get<unknown>(`${environment.apiUrl}/api`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .pipe(
        map(response => {
          const responseTime = Date.now() - startTime;
          const currentDiagnostics = this.diagnosticsSubject.value;
          const responseTimes = [...(currentDiagnostics.responseTimes || []), responseTime].slice(-5);

          this.consecutiveFailures = 0;                                    

          const diagnostics: ConnectionDiagnostics = {
            isConnected: true,
            status: this.determineStatus(responseTime),
            lastChecked: new Date(),
            responseTimes,
            serverBinding: this.extractServerBinding(response),
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
            error: this.formatError(error),
          };

          this.diagnosticsSubject.next(diagnostics);

          if (this.consecutiveFailures <= this.maxConsecutiveFailures) {
            this.logger.warn('API connection failed', {
              error: diagnostics.error,
              url: `${environment.apiUrl}/api`,
              consecutiveFailures: this.consecutiveFailures,
            });
          } else if (this.consecutiveFailures === this.maxConsecutiveFailures + 1) {

            this.logger.warn(`API connection failures threshold reached (${this.maxConsecutiveFailures}). Suppressing further logs until connection restored.`, {
              error: diagnostics.error,
            });
          }

          return of(diagnostics);
        }),
        shareReplay(1),
      );
  }

  startHealthCheck(): void {
    timer(1000, this.checkInterval)
      .pipe(
        switchMap(() =>
          this.checkConnectionNow().pipe(
            retry({
              count: this.retryCount,
              delay: this.retryDelay,
            }),
            catchError(error => {
              if (this.consecutiveFailures <= this.maxConsecutiveFailures) {
                this.logger.error('All API health check retries failed', {
                  error: this.formatError(error),
                  retries: this.retryCount,
                });
              }
              return of(null);
            }),
          ),
        ),
      )
      .subscribe();
  }

  runNetworkDiagnostics(): Observable<string> {
    this.logger.info('Running network diagnostics');

    return this.http
      .get<unknown>(`${environment.apiUrl}/api`, {
        headers: { 'X-Diagnostics': 'true' },
      })
      .pipe(
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
            diagnosticMessage += '  • Verify NestJS is still running with "pnpm dlx nx run craft-nest:serve"\n';
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
            diagnosticMessage += '  • Verify proxy.config.json settings\n';
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
        }),
      );
  }

  checkPortAvailability(): Observable<string> {

    return this.http
      .get<unknown>(`${environment.apiUrl}/api/health/ports`, {
        headers: { 'X-Diagnostics': 'true' },
      })
      .pipe(
        map(response => {
          const ports = (response as PortsResponse).ports;
          if (!ports) {
            return 'Port availability check completed, but no data returned';
          }

          let message = 'Port status:\n';
          Object.entries(ports).forEach(([port, inUse]) => {
            message += `- Port ${port}: ${inUse ? 'In use' : 'Available'}\n`;
          });

          return message;
        }),
        catchError(error => {
          return of(`Port availability check failed: ${this.formatError(error)}`);
        }),
      );
  }

  getSuggestedFixes(): string[] {
    const currentDiagnostics = this.diagnosticsSubject.value;
    const suggestions: string[] = [];

    if (!currentDiagnostics.isConnected) {
      suggestions.push('Ensure the NestJS backend is running with "pnpm dlx nx run craft-nest:serve"');
      suggestions.push('Check if the server is binding to 0.0.0.0 instead of localhost in main.ts');
      suggestions.push('Verify the proxy configuration in angular.json or proxy.configjson');
      suggestions.push('Try restarting both frontend and backend services');
      suggestions.push('Check environment.apiUrl setting is correct');

      if (currentDiagnostics.error?.includes('ECONNREFUSED')) {
        suggestions.push('The server appears to be running but refusing connections - check firewall settings');
        suggestions.push('Verify the port is not in use by another process');
        suggestions.push('Try manually accessing the API endpoint: curl http://localhost:3000/api');
      }

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

  checkSocketConnection(): Observable<boolean> {
    return this.http.get<unknown>(`${environment.apiUrl}/api/socket-status`).pipe(
      map(response => (response as SocketStatusResponse).connected === true),
      catchError(() => of(false)),
    );
  }

  initializeSocketMonitoring(socketUrl?: string): void {
    if (!socketUrl) {

      socketUrl = environment.production ? environment.apiUrl : '';
    }

    this.logger.info('Initializing socket monitoring', { socketUrl });

    try {

      if (this.socketInstance) {
        this.socketInstance.disconnect();
      }

      this.socketInstance = io(socketUrl);

      this.socketInstance.on('connect', () => {
        this.socketReconnectAttempts = 0;
        const connectionId = this.socketInstance?.id;
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: true,
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl,
          ...(connectionId ? { connectionId } : {}),
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.info('Socket connected successfully', {
          socketId: this.socketInstance?.id,                         
          url: socketUrl,
        });

        this.measureSocketLatency();
      });

      this.socketInstance.on('disconnect', reason => {
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl,
          ...(reason ? { lastError: reason } : {}),
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.warn('Socket disconnected', { reason });
      });

      this.socketInstance.on('error', error => {
        const message = error?.message || 'Unknown socket error';
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl,
          ...(message ? { lastError: message } : {}),
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.error('Socket connection error', { error });
      });

      this.socketInstance.on('reconnect_attempt', attempt => {
        this.socketReconnectAttempts = attempt;
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          reconnectAttempts: attempt,
          socketUrl,
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.info('Socket reconnection attempt', { attempt });
      });

      this.socketInstance.on('reconnect_failed', () => {
        const lastError = 'Reconnection failed after maximum attempts';
        const socketDiagnostics: SocketDiagnostics = {
          isConnected: false,
          reconnectAttempts: this.socketReconnectAttempts,
          socketUrl,
          ...(lastError ? { lastError } : {}),
        };
        this.socketDiagnosticsSubject.next(socketDiagnostics);
        this.logger.error('Socket reconnection failed', {
          attempts: this.socketReconnectAttempts,
        });
      });
    } catch (error) {
      this.logger.error('Error initializing socket connection', { error });
    }
  }

  measureSocketLatency(): void {
    if (!this.socketInstance || !this.socketInstance.connected) {
      return;
    }

    const start = Date.now();

    this.socketInstance.emit('ping', {}, () => {
      const latency = Date.now() - start;
      const currentDiagnostics = this.socketDiagnosticsSubject.value;

      this.socketDiagnosticsSubject.next({
        ...currentDiagnostics,
        pingTime: latency,
      });

      this.logger.debug('Socket latency', { latency: `${latency}ms` });
    });

    setTimeout(() => this.measureSocketLatency(), 30000);
  }

  reconnectSocket(): Observable<boolean> {
    if (!this.socketInstance) {
      return throwError(() => new Error('Socket not initialized'));
    }

    this.logger.info('Manually reconnecting socket...');

    return new Observable<boolean>(observer => {
      try {
        this.socketInstance?.disconnect();

        setTimeout(() => {
          this.socketInstance?.connect();

          const onConnect = () => {
            this.socketInstance?.off('connect', onConnect);
            this.socketInstance?.off('connect_error', onError);
            observer.next(true);
            observer.complete();
          };

          const onError = (error: unknown) => {

            this.socketInstance?.off('connect', onConnect);
            this.socketInstance?.off('connect_error', onError);
            observer.error(error);
          };

          this.socketInstance?.once('connect', onConnect);
          this.socketInstance?.once('connect_error', onError);

          setTimeout(() => {
            this.socketInstance?.off('connect', onConnect);
            this.socketInstance?.off('connect_error', onError);
            observer.error(new Error('Reconnection timeout'));
          }, 5000);
        }, 1000);
      } catch (error) {
        observer.error(error);
      }
    }).pipe(
      retryWhen(errors =>
        errors.pipe(
          delay(1000),
          tap(error => this.logger.warn('Retrying socket reconnection after error', { error })),

          tap(() => {
            this.socketReconnectAttempts++;
            if (this.socketReconnectAttempts >= this.maxSocketReconnectAttempts) {
              throw new Error(`Maximum reconnection attempts (${this.maxSocketReconnectAttempts}) reached`);
            }
          }),
        ),
      ),
    );
  }

  monitorNamespaceSocket(namespace: string, socketUrl?: string): void {
    if (!socketUrl) {

      socketUrl = environment.production ? environment.apiUrl : '';
    }

    try {

      const nsPath = namespace ? `/${namespace}` : '';
      const nsSocket = io(`${socketUrl}${nsPath}`);

      this.logger.debug(`Monitoring socket namespace: ${namespace || 'default'}`, { socketUrl });

      if (!this.namespaceSocketInstances.has(namespace)) {
        this.namespaceSocketInstances.set(namespace, nsSocket);
      }

      if (!this.knownNamespaces.has(namespace)) {
        this.knownNamespaces.set(namespace, {
          namespace,
          isConnected: false,
        });
      }

      nsSocket.on('connect', () => {
        const connectionId = nsSocket.id;
        const status: NamespacedSocketStatus = {
          namespace,
          isConnected: true,
          lastConnectedTime: new Date(),
          ...(connectionId ? { connectionId } : {}),
        };

        this.knownNamespaces.set(namespace, status);
        this.updateNamespaceStatuses();

        this.logger.info(`Socket namespace ${namespace} connected successfully`, {
          socketId: nsSocket.id,
          url: socketUrl + nsPath,
        });
      });

      nsSocket.on('disconnect', reason => {
        const existingStatus = this.knownNamespaces.get(namespace) || {
          namespace,
          isConnected: false,
        };

        const lastError = reason;
        const status: NamespacedSocketStatus = {
          ...existingStatus,
          isConnected: false,
          lastDisconnectedTime: new Date(),
          ...(lastError ? { lastError } : {}),
        };

        this.knownNamespaces.set(namespace, status);
        this.updateNamespaceStatuses();

        this.logger.warn(`Socket namespace ${namespace} disconnected`, { reason });
      });

      nsSocket.on('error', error => {
        const existingStatus = this.knownNamespaces.get(namespace) || {
          namespace,
          isConnected: false,
        };

        const lastError = error?.message || 'Unknown socket error';
        const status: NamespacedSocketStatus = {
          ...existingStatus,
          isConnected: false,
          lastDisconnectedTime: new Date(),
          ...(lastError ? { lastError } : {}),
        };

        this.knownNamespaces.set(namespace, status);
        this.updateNamespaceStatuses();

        this.logger.error(`Socket namespace ${namespace} error`, { error });
      });
    } catch (error) {
      this.logger.error(`Error initializing ${namespace} namespace socket`, { error });

      const status: NamespacedSocketStatus = {
        namespace,
        isConnected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error during initialization',
        lastDisconnectedTime: new Date(),
      };

      this.knownNamespaces.set(namespace, status);
      this.updateNamespaceStatuses();
    }
  }

  monitorAllNamespaces(socketUrl?: string): void {

    const commonNamespaces = ['health', 'yahoo', 'user-state'];

    commonNamespaces.forEach(namespace => {
      this.monitorNamespaceSocket(namespace, socketUrl);
    });

    this.monitorNamespaceSocket('', socketUrl);
  }

  reconnectNamespaceSocket(namespace: string): Observable<boolean> {
    const nsSocket = this.namespaceSocketInstances.get(namespace);
    if (!nsSocket) {
      return throwError(() => new Error(`Socket namespace ${namespace} not initialized`));
    }

    this.logger.info(`Manually reconnecting ${namespace} socket...`);

    return new Observable<boolean>(observer => {
      try {
        nsSocket.disconnect();

        setTimeout(() => {
          nsSocket.connect();

          const onConnect = () => {
            nsSocket.off('connect', onConnect);
            nsSocket.off('connect_error', onError);
            observer.next(true);
            observer.complete();
          };

          const onError = (error: unknown) => {

            nsSocket.off('connect', onConnect);
            nsSocket.off('connect_error', onError);
            observer.error(error);
          };

          nsSocket.once('connect', onConnect);
          nsSocket.once('connect_error', onError);

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
      retryWhen(errors =>
        errors.pipe(
          delay(1000),
          tap(error => this.logger.warn(`Retrying ${namespace} socket reconnection after error`, { error })),

          tap(count => {
            if (count >= 3) {
              throw new Error(`Maximum reconnection attempts reached for namespace ${namespace}`);
            }
          }),
          take(3),
        ),
      ),
    );
  }

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

  getEnhancedDiagnosticData(): Observable<unknown> {
    return this.getDiagnosticDashboardData().pipe(
      map(dashboardData => ({
        ...dashboardData,
        socketNamespaces: Array.from(this.knownNamespaces.values()),
        partialConnectivity: {
          hasAnyWorkingSocket: this.getWorkingSocketsCount() > 0,
          workingSocketsCount: this.getWorkingSocketsCount(),
          totalNamespaces: this.knownNamespaces.size,
          partiallyWorking: this.getWorkingSocketsCount() > 0 && this.getWorkingSocketsCount() < this.knownNamespaces.size,
        },
        enhancedRecommendations: this.getPartialConnectivitySuggestions(),
      })),
    );
  }

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

  getDiagnosticDashboardData(): Observable<DiagnosticDashboardData> {
    const connectionDiagnostics = this.diagnosticsSubject.value;
    const socketDiagnostics = this.socketDiagnosticsSubject.value;
    const socketConnection: DiagnosticDashboardData['socketConnection'] = {
      isConnected: socketDiagnostics.isConnected,
      reconnectAttempts: socketDiagnostics.reconnectAttempts,
    };

    if (socketDiagnostics.pingTime !== undefined) {
      socketConnection.pingTime = socketDiagnostics.pingTime;
    }
    if (socketDiagnostics.connectionId) {
      socketConnection.connectionId = socketDiagnostics.connectionId;
    }

    return of({
      apiConnection: {
        status: connectionDiagnostics.status,
        isConnected: connectionDiagnostics.isConnected,
        lastChecked: connectionDiagnostics.lastChecked,
        responseTimes: connectionDiagnostics.responseTimes || [],
        averageResponseTime: this.calculateAverageResponseTime(connectionDiagnostics.responseTimes || []),
      },
      socketConnection,
      suggestions: this.getSuggestedFixes(),
      namespaceStatuses: Array.from(this.knownNamespaces.values()),
    });
  }

  private updateNamespaceStatuses(): void {
    const statuses = Array.from(this.knownNamespaces.values());
    this.namespaceSocketsSubject.next(statuses);

    const anyConnected = statuses.some(s => s.isConnected);
    const anyFailing = statuses.some(s => !s.isConnected);

    if (anyConnected) {
      const lastError = anyFailing ? 'Some socket namespaces are failing' : undefined;
      const socketDiagnostics: SocketDiagnostics = {
        ...this.socketDiagnosticsSubject.value,
        isConnected: true,
        ...(lastError ? { lastError } : {}),
      };
      this.socketDiagnosticsSubject.next(socketDiagnostics);
    }
  }

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

  private extractServerBinding(response: unknown): string {

    const serverInfo = (response as ServerInfoResponse)?.serverInfo;
    if (serverInfo?.binding) {
      return serverInfo.binding;
    }

    if (environment.production) {
      return 'Production server';
    } else {
      return 'Development server (localhost:3000)';
    }
  }

  private formatError(error: unknown): string {
    if (!error) return 'Unknown error';

    const err = error as HttpErrorLike;

    if (err.status === 0) {
      if (err.message && err.message.includes('ECONNREFUSED')) {
        return 'Connection refused (ECONNREFUSED) - Backend server may not be running';
      }
      return 'Connection refused - Network error';
    }

    if (err.status === 504) {
      return `504: Gateway Timeout - Server took too long to respond`;
    }

    return `${err.status}: ${err.statusText || err.message || 'Unknown error'}`;
  }
}
