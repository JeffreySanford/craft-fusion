import { Injectable, Injector } from '@angular/core';
import { Observable, Subject, BehaviorSubject, ReplaySubject, of, timer } from 'rxjs';
import { map, switchMap, takeUntil, catchError, tap, filter } from 'rxjs/operators';
import { HttpContext, HttpContextToken } from '@angular/common/http';

// Define the TIMEOUT token for HTTP requests
export const TIMEOUT = new HttpContextToken<number>(() => 30000);

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  component?: string;
  details?: unknown;
}

export interface ServiceCallMetric {
  id: string;
  timestamp: Date;
  serviceName: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  error?: unknown;
  // Additional properties needed by admin component
  errorRate?: number;
  authAttempts?: number;
  securityEvents?: number;
  activeUsers?: number;
  averageLatency?: number;
  lastIncident?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logs: LogEntry[] = [];
  private logLimit = 1000; // Maximum number of logs to store
  private loggerLevel = LogLevel.DEBUG; // Current log level
  private logSubject = new Subject<LogEntry>();
  
  // Service call tracking
  private serviceMetrics: ServiceCallMetric[] = [];
  private serviceMetricsLimit = 100;
  private serviceCallsSubject = new BehaviorSubject<ServiceCallMetric[]>([]);
  private registeredServices: Set<string> = new Set();
  private serviceCallsInProgress: Map<string, ServiceCallMetric> = new Map();
  
  // Backend log polling
  private pollingDestroy$: Subject<void> = new Subject<void>();
  
  // Observable that components can subscribe to for log updates
  logAdded$ = this.logSubject.asObservable();
  logStream$ = this.logSubject.asObservable(); // Alias for compatibility
  serviceCalls$ = this.serviceCallsSubject.asObservable();
  
  // Hot observables for integration
  private connectSubject = new Subject<unknown>();
  private errorSubject = new Subject<unknown>();
  private infoSubject = new Subject<unknown>();
  private changelogSubject = new ReplaySubject<unknown>(100);

  connect$ = this.connectSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  info$ = this.infoSubject.asObservable();
  changelog$ = this.changelogSubject.asObservable();
  
  constructor(
    private injector: Injector
  ) {
    this.info('LoggerService initialized');
  }
  
  setLevel(level: LogLevel) {
    this.loggerLevel = level;
    localStorage.setItem('loggerLevel', level.toString());
  }

  getLevel(): LogLevel {
    return this.loggerLevel;
  }

  debug(message: string, details?: unknown, component: string = this.getCallerComponent()) {
    this.log(LogLevel.DEBUG, message, details, component);
  }

  info(message: string, details?: unknown, component: string = this.getCallerComponent()) {
    this.log(LogLevel.INFO, message, details, component);
  }

  warn(message: string, details?: unknown, component: string = this.getCallerComponent()) {
    this.log(LogLevel.WARN, message, details, component);
  }

  error(message: string, details?: unknown, component: string = this.getCallerComponent()) {
    this.log(LogLevel.ERROR, message, details, component);
  }
  
  highlight(message: string, details?: unknown, component: string = this.getCallerComponent()) {
    this.log(LogLevel.INFO, `⭐ ${message} ⭐`, details, component);
  }
  
  // Service call tracking methods
  registerService(serviceName: string): void {
    if (!this.registeredServices.has(serviceName)) {
      this.registeredServices.add(serviceName);
      this.debug(`Service registered: ${serviceName}`);
    }
  }
  
  startServiceCall(serviceName: string, method: string, url: string): string {
    const callId = `${serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: ServiceCallMetric = {
      id: callId,
      timestamp: new Date(),
      serviceName,
      method,
      url
    };
    
    this.serviceCallsInProgress.set(callId, metric);
    this.debug(`Service call started: ${serviceName}`, { method, url, callId });
    
    return callId;
  }
  
  endServiceCall(callId: string, status: number, error?: unknown): void {
    const startMetric = this.serviceCallsInProgress.get(callId);
    
    if (startMetric) {
      const endTime = new Date();
      const duration = endTime.getTime() - startMetric.timestamp.getTime();
      
      const completedMetric: ServiceCallMetric = {
        ...startMetric,
        status,
        duration,
        error
      };
      
      // Remove from in-progress map
      this.serviceCallsInProgress.delete(callId);
      
      // Add to metrics history
      this.serviceMetrics.unshift(completedMetric);
      
      // Limit number of stored metrics
      if (this.serviceMetrics.length > this.serviceMetricsLimit) {
        this.serviceMetrics.pop();
      }
      
      // Notify subscribers
      this.serviceCallsSubject.next([...this.serviceMetrics]);
      
      // Log appropriate message
      if (status >= 200 && status < 300) {
        this.debug(`Service call completed: ${startMetric.serviceName}`, 
          { method: startMetric.method, url: startMetric.url, status, duration: `${duration}ms` });
      } else {
        this.error(`Service call failed: ${startMetric.serviceName}`, 
          { method: startMetric.method, url: startMetric.url, status, duration: `${duration}ms`, error });
      }
    } else {
      this.warn(`Attempted to end unknown service call: ${callId}`);
    }
  }
  
  getServiceMetrics(): ServiceCallMetric[] {
    return [...this.serviceMetrics];
  }
  
  clearMetrics(): void {
    this.serviceMetrics = [];
    this.serviceCallsSubject.next([]);
    this.info('Service metrics cleared');
  }

  private log(level: LogLevel, message: string, details?: unknown, component?: string) {
    // Only log if the level is greater than or equal to the logger level
    if (level >= this.loggerLevel) {
      // If component not provided, try to determine it
      if (!component) {
        component = this.getCallerComponent();
      }
      
      // Sanitize sensitive information in details
      const sanitizedDetails = this.sanitizeLogDetails(details);
      
      // Create log entry
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        message,
        component,
        details: sanitizedDetails
      };

      // Add to logs array
      this.logs.unshift(entry);
      
      // Limit the number of logs stored
      if (this.logs.length > this.logLimit) {
        this.logs.pop();
      }
      
      // Notify subscribers
      this.logSubject.next(entry);
      // Emit to info/error subjects
      if (level === LogLevel.ERROR) {
        this.errorSubject.next(entry);
      } else if (level === LogLevel.INFO) {
        this.infoSubject.next(entry);
      }
      
      // Still send to console for development visibility
      this.outputToConsole(level, message, sanitizedDetails, component);
    }
  }

  private outputToConsole(level: LogLevel, message: string, details?: unknown, component: string = '') {
    const componentPrefix = component ? `[${component}] ` : '';
    
    // Enhanced color definitions for different log categories
    const styles = {
      // Core log levels - Updated for patriotic theme
      debug: 'color: #3b82f6; font-weight: normal;',      // blue
      info: 'color: #0052B4; font-weight: normal;',       // more vibrant blue for info (patriotic blue)
      warn: 'color: #FF8C00; font-weight: bold;',         // more vibrant orange for warnings
      error: 'color: #BF0A30; font-weight: bold;',        // patriotic red for errors
      
      // Special categories with patriotic colors
      highlight: 'color: #3C3B6E; font-weight: bold; text-decoration: underline;', // patriotic navy blue
      security: 'color: #8B008B; font-weight: bold; background-color: rgba(139, 0, 139, 0.1); padding: 2px 4px;', // vibrant purple
      performance: 'color: #3C3B6E; font-weight: normal; font-style: italic;', // patriotic navy
      user: 'color: #008080; font-weight: normal;',       // vibrant teal
      api: 'color: #0052B4; font-weight: normal;',        // patriotic blue
      navigation: 'color: #FF8C00; font-weight: normal;', // vibrant orange
      data: 'color: #0052B4; font-weight: normal;',       // patriotic blue
      storage: 'color: #006400; font-weight: normal;',    // vibrant green
      rendering: 'color: #0052B4; font-weight: normal;',  // patriotic blue
      initialization: 'color: #3C3B6E; font-weight: normal;', // patriotic navy blue
      lifecycle: 'color: #3C3B6E; font-weight: normal;',  // patriotic navy blue
      usa: 'background: linear-gradient(90deg, #0052B4, #3C3B6E); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;', // modified patriotic gradient (blue only)
      system: 'color: #3C3B6E; font-weight: normal;',     // patriotic navy blue
      component: 'color: #FFFFFF; font-style: italic; background-color: rgba(60, 59, 110, 0.5); padding: 2px 4px; border-radius: 2px;'    // white on navy background for component name
    };
    
    // Format component prefix with style
    const styledPrefix = component ? `%c[${component}]%c ` : '';
    const styledMessage = `${styledPrefix}%c${message}`;
    
    // Prepare style arguments
    const styleArgs = [];
    if (component) {
      styleArgs.push(styles.component, ''); // Reset after component
    }
    
    // Determine message category for special styling
    let messageStyle = '';
    
    // Order matters here - check in order of most to least specific
    
    // Check for special categories first
    if (message.includes('⭐') || message.includes('IMPORTANT')) {
      messageStyle = styles.highlight;
    } 
    // Check for security-related messages
    else if (this.isSecurityRelated(message, component, details)) {
      messageStyle = styles.security;
    }
    // Authentication-related messages
    else if (this.isAuthRelated(message, component)) {
      messageStyle = styles.security; // Use security style for auth as well
    }
    // Performance-related messages
    else if (this.isPerformanceRelated(message, component, details)) {
      messageStyle = styles.performance;
    }
    // User-related messages
    else if (this.isUserRelated(message, component)) {
      messageStyle = styles.user;
    }
    // API-related messages
    else if (this.isApiRelated(message, component)) {
      messageStyle = styles.api;
    }
    // Navigation/routing related messages
    else if (this.isNavigationRelated(message, component)) {
      messageStyle = styles.navigation;
    }
    // Data handling/state related messages
    else if (this.isDataRelated(message, component)) {
      messageStyle = styles.data;
    }
    // Storage/caching related messages
    else if (this.isStorageRelated(message, component)) {
      messageStyle = styles.storage;
    }
    // Rendering/view related messages
    else if (this.isRenderingRelated(message, component)) {
      messageStyle = styles.rendering;
    }
    // Initialization related messages
    else if (this.isInitializationRelated(message, component)) {
      messageStyle = styles.initialization;
    }
    // Component lifecycle related messages
    else if (this.isLifecycleRelated(message, component)) {
      messageStyle = styles.lifecycle;
    }
    // USA/patriotic related messages
    else if (this.isUSARelated(message, component)) {
      messageStyle = styles.usa;
    }
    // System-related messages
    else if (this.isSystemRelated(message, component)) {
      messageStyle = styles.system;
    }
    else {
      // Default styling based on log level
      switch (level) {
        case LogLevel.DEBUG:
          messageStyle = styles.debug;
          break;
        case LogLevel.INFO:
          messageStyle = styles.info;
          break;
        case LogLevel.WARN:
          messageStyle = styles.warn;
          break;
        case LogLevel.ERROR:
          messageStyle = styles.error;
          break;
      }
    }
    
    // Add the detected style
    styleArgs.push(messageStyle);
    
    // Output to console with appropriate styling
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(styledMessage, ...styleArgs, details || '');
        break;
      case LogLevel.INFO:
        console.info(styledMessage, ...styleArgs, details || '');
        break;
      case LogLevel.WARN:
        console.warn(styledMessage, ...styleArgs, details || '');
        break;
      case LogLevel.ERROR:
        console.error(styledMessage, ...styleArgs, details || '');
        break;
    }
  }

  // Helper methods for categorizing log messages
  private isSecurityRelated(message: string, component: string = '', details?: unknown): boolean {
    const securityTerms = [
      'security', 'permission', 'access', 'credential', 'protect', 'firewall',
      'encrypt', 'decrypt', 'hash', 'salt', 'csrf', 'xss', 'injection', 'vulnerability'
    ];
    return Boolean(this.containsTerms(securityTerms, message) || 
           (component && this.containsTerms(securityTerms, component)) ||
           (component && ['AuthService', 'SecurityService', 'AuthGuard', 'PermissionService'].includes(component)));
  }

  private isAuthRelated(message: string, component: string = ''): boolean {
    const authTerms = [
      'auth', 'login', 'logout', 'signin', 'signout', 'register', 'password',
      'token', 'jwt', 'authenticate', 'identity', 'oauth', 'session', 'user'
    ];
    return Boolean(this.containsTerms(authTerms, message) || 
           (component && this.containsTerms(authTerms, component)) ||
           (component && ['AuthService', 'LoginComponent', 'AuthGuard'].includes(component)));
  }

  private isPerformanceRelated(message: string, component: string = '', details?: unknown): boolean {
    const perfTerms = [
      'performance', 'latency', 'speed', 'slow', 'fast', 'metrics', 'benchmark',
      'timeout', 'memory', 'cpu', 'load', 'resource', 'optimize', 'render time'
    ];
    return Boolean(this.containsTerms(perfTerms, message) || 
           (component && this.containsTerms(perfTerms, component)) ||
           (details && JSON.stringify(details).toLowerCase().includes('performance')));
  }

  private isUserRelated(message: string, component: string = ''): boolean {
    const userTerms = [
      'user', 'account', 'profile', 'logged in', 'logged out', 'signup', 'register',
      'preference', 'settings', 'avatar', 'role', 'permission'
    ];
    return Boolean(this.containsTerms(userTerms, message) || 
           (component && this.containsTerms(userTerms, component)) ||
           (component && ['UserService', 'ProfileComponent', 'AccountComponent'].includes(component)));
  }

  private isApiRelated(message: string, component: string = ''): boolean {
    const apiTerms = [
      'api', 'endpoint', 'request', 'response', 'http', 'service call', 'fetch', 
      'xhr', 'rest', 'graphql', 'post', 'get', 'put', 'delete', 'patch'
    ];
    return Boolean(this.containsTerms(apiTerms, message) || 
           (component && this.containsTerms(apiTerms, component)) ||
           (component && ['ApiService', 'HttpClient', 'ApiLoggerService', 'DataService'].includes(component)) ||
           message.includes('/api/'));
  }

  private isNavigationRelated(message: string, component: string = ''): boolean {
    const navTerms = [
      'navigate', 'routing', 'route', 'path', 'url', 'link', 'redirect',
      'forward', 'back', 'page', 'view', 'location'
    ];
    return Boolean(this.containsTerms(navTerms, message) || 
           (component && this.containsTerms(navTerms, component)) ||
           (component && ['Router', 'NavigationService', 'RouteGuard'].includes(component)));
  }

  private isDataRelated(message: string, component: string = ''): boolean {
    const dataTerms = [
      'data', 'model', 'entity', 'object', 'json', 'parse', 'serialize', 
      'store', 'state', 'update', 'change', 'mutation'
    ];
    return Boolean(this.containsTerms(dataTerms, message) || 
           (component && this.containsTerms(dataTerms, component)) ||
           (component && ['StoreService', 'DataService', 'StateService'].includes(component)));
  }

  private isStorageRelated(message: string, component: string = ''): boolean {
    const storageTerms = [
      'storage', 'cache', 'persist', 'save', 'load', 'local', 'session',
      'cookie', 'indexdb', 'database', 'db'
    ];
    return Boolean(this.containsTerms(storageTerms, message) || 
           (component && this.containsTerms(storageTerms, component)) ||
           (component && ['StorageService', 'CacheService', 'PersistenceService'].includes(component)));
  }

  private isRenderingRelated(message: string, component: string = ''): boolean {
    const renderTerms = [
      'render', 'view', 'template', 'component', 'ui', 'interface', 'dom',
      'element', 'layout', 'style', 'css', 'html'
    ];
    return Boolean(this.containsTerms(renderTerms, message) || 
           (component && this.containsTerms(renderTerms, component)) ||
           (message.toLowerCase().includes('render') || message.toLowerCase().includes('template')));
  }

  private isInitializationRelated(message: string, component: string = ''): boolean {
    const initTerms = [
      'init', 'start', 'bootstrap', 'launch', 'setup', 'config', 'load',
      'ready', 'create', 'instantiate'
    ];
    return Boolean(this.containsTerms(initTerms, message) || 
           (component && this.containsTerms(initTerms, component)) || 
           message.toLowerCase().includes('initialized'));
  }

  private isLifecycleRelated(message: string, component: string = ''): boolean {
    const lifecycleTerms = [
      'lifecycle', 'oninit', 'onchanges', 'ondestroy', 'afterviewinit',
      'mount', 'unmount', 'construct', 'destroy'
    ];
    return Boolean(this.containsTerms(lifecycleTerms, message) ||
           (component && this.containsTerms(lifecycleTerms, component)));
  }

  private isUSARelated(message: string, component: string = ''): boolean {
    const usaTerms = [
      'usa', 'patriotic', 'america', 'united states', 'flag', 'military',
      'veteran', 'patriot', 'freedom', 'liberty', 'independence', 'eagle'
    ];
    return Boolean(this.containsTerms(usaTerms, message) ||
           (component && this.containsTerms(usaTerms, component)));
  }

  private isSystemRelated(message: string, component: string = ''): boolean {
    const systemTerms = [
      'system', 'core', 'framework', 'platform', 'infrastructure'
    ];
    
    const systemComponents = [
      'SystemService', 
      'ConfigService', 
      'InitializationService', 
      'AppComponent',
      'CoreModule'
    ];
    
    return Boolean(this.containsTerms(systemTerms, message) ||
           (component && this.containsTerms(systemTerms, component)) ||
           (component && systemComponents.includes(component)));
  }

  // Helper method to check if a message contains any terms from an array
  private containsTerms(terms: string[], text: string, component: string = ''): boolean {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    const lowerComponent = component ? component.toLowerCase() : '';
    
    return Boolean(terms.some(term => 
      lowerText.includes(term.toLowerCase()) || 
      (component && lowerComponent.includes(term.toLowerCase()))
    ));
  }

  private getCallerComponent(): string {
    try {
      const err = new Error();
      const stackLines = err.stack?.split('\n') || [];
      
      // Look for class name in stack trace - improved detection pattern
      for (let i = 3; i < Math.min(10, stackLines.length); i++) { // Check more lines but limit for performance
        const line = stackLines[i];
        
        // Enhanced pattern matching to detect components and services
        const componentMatch = line.match(/at\s+(\w+(?:Component|Service|Guard|Directive|Pipe|Resolver))\./);
        if (componentMatch && componentMatch[1]) {
          return componentMatch[1];
        }
        
        // Try to match class methods with 'this' context
        const methodMatch = line.match(/at\s+([A-Z]\w*)\.((?:\w+))/);
        if (methodMatch && methodMatch[1]) {
          return methodMatch[1]; // Return class name if found
        }
        
        // Last resort: Try to extract file name for context
        const fileMatch = line.match(/\((.+?)(?:\.ts|\.[jt]sx?):(\d+):(\d+)\)$/);
        if (fileMatch && fileMatch[1]) {
          const fileName = fileMatch[1].split(/[/\\]/).pop() || '';
          if (fileName && !fileName.includes('logger.service') && !fileName.includes('node_modules')) {
            return fileName.replace(/\.component$/, 'Component')
                          .replace(/\.service$/, 'Service')
                          .replace(/\.guard$/, 'Guard')
                          .replace(/\.[jt]s$/, '');
          }
        }
      }
    } catch (error) {
      // Silently fail if cannot determine component
      console.error('Error determining component:', error);
    }
    
    // Default fallbacks based on common patterns
    if (typeof window !== 'undefined') {
      const url = window.location.pathname;
      if (url.includes('/admin')) return 'AdminComponent';
      if (url.includes('/login')) return 'LoginComponent';
      if (url.includes('/auth')) return 'AuthComponent';
      // Add more URL-based fallbacks as needed
    }
    
    return 'Unknown';
  }
  
  // Add a log sanitizer helper to avoid sensitive info in logs
  private sanitizeLogDetails(details: unknown): unknown {
    if (!details) return details;
    
    try {
      // Make a copy to avoid modifying the original object
      const sanitized = JSON.parse(JSON.stringify(details));
      
      // List of sensitive field names to mask
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'auth'];
      
      // Helper to sanitize an object recursively
      const sanitizeObject = (obj: unknown) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          const lowerKey = key.toLowerCase();
          
          // If sensitive field, mask the value
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            obj[key] = '[REDACTED]';
          } 
          // Recurse if object or array
          else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        });
      };
      
      sanitizeObject(sanitized);
      return sanitized;
      
    } catch (error) {
      // If any error during sanitization, return original but add warning
      return { original: details, warning: 'Could not sanitize log details' };
    }
  }
  
  // Backend log integration methods
  
  /**
   * Start polling for backend logs
   * @param intervalMs - Polling interval in milliseconds
   */
  startPollingBackendLogs(intervalMs: number = 10000): void {
    // Stop any existing polling
    this.stopPollingBackendLogs();
    
    // Track backend connectivity status
    let backendAvailable = true;
    let consecutiveFailures = 0;
    let currentInterval = intervalMs;
    const maxInterval = 60000; // Max 1 minute between attempts
    
    // Create a new destroy subject
    this.pollingDestroy$ = new Subject<void>();
    
    // Set up periodic polling with exponential backoff on failures
    timer(1000, 1000) // Check every second to calculate interval dynamically
      .pipe(
        takeUntil(this.pollingDestroy$),
        map(() => {
          // Reset poll interval to normal if backend is available
          if (backendAvailable) {
            currentInterval = intervalMs;
          }
          return currentInterval;
        }),
        switchMap(interval => 
          timer(0, interval).pipe(
            takeUntil(this.pollingDestroy$),
            switchMap(() => this.checkBackendHealth()),
            catchError(() => of(false)),
            tap(isHealthy => {
              backendAvailable = isHealthy;
              
              if (!isHealthy) {
                // Increase interval with exponential backoff
                consecutiveFailures++;
                currentInterval = Math.min(intervalMs * Math.pow(1.5, consecutiveFailures), maxInterval);
                
                if (consecutiveFailures === 1) {
                  this.warn('Backend connection lost, retrying with increased interval', { 
                    nextRetry: `${(currentInterval / 1000).toFixed(1)}s` 
                  });
                }
              } else if (consecutiveFailures > 0) {
                // Reset failures when connection is restored
                consecutiveFailures = 0;
                this.info('Backend connection restored, resuming normal polling');
              }
            }),
            // Only proceed with fetching logs if backend is available
            filter(isHealthy => isHealthy),
            switchMap(() => this.fetchBackendLogs())
          )
        )
      )
      .subscribe({
        next: (logs) => {
          // Process logs without causing infinite loop
          this.processBackendLogs(logs);
        }
      });
    
    this.info('Backend log polling started', { 
      initialIntervalMs: intervalMs,
      adaptivePolling: true 
    });
  }
  
  /**
   * Stop polling for backend logs
   */
  stopPollingBackendLogs(): void {
    if (this.pollingDestroy$) {
      this.pollingDestroy$.next();
      this.pollingDestroy$.complete();
      this.debug('Backend log polling stopped');
    }
  }
  
  /**
   * Process logs received from the backend
   * Ensures logs are properly formatted and doesn't cause infinite feedback
   */
  private processBackendLogs(logs: LogEntry[]): void {
    // Don't notify subscribers for backend logs to avoid infinite loops
    // Just store them in our local logs array with a special tag
    
    for (const log of logs) {
      // Add source identifier to distinguish backend logs
      const backendLog = {
        ...log,
        source: 'backend',
        // Ensure proper date object
        timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)
      };
      
      // Add to logs array without notifying subscribers
      this.logs.unshift(backendLog);
    }
    
    // Trim logs if they exceed the maximum
    while (this.logs.length > this.logLimit) {
      this.logs.pop();
    }
  }
  
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  clearLogs() {
    this.logs = [];
    // Do not emit a "Logs cleared" log entry to avoid feedback loop
    // Optionally, notify UI via a separate subject if needed
  }
  
  /**
   * Log a change that should be added to the changelog
   * @param type - Type of change (feat, fix, etc.)
   * @param description - Description of the change
   * @param scope - Optional scope of the change
   */
  changelogEntry(type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'chore', 
                 description: string, 
                 scope?: string): void {
    // Format as conventional commit message
    const message = scope ? 
      `${type}(${scope}): ${description}` : 
      `${type}: ${description}`;
    // Log to console
    this.info(`CHANGELOG: ${message}`, { changelog: true });
    // Store in changelog subject (no try-catch)
    const entry = {
      type,
      scope,
      description,
      timestamp: new Date().toISOString()
    };
    this.changelogSubject.next(entry);
    // Optionally, persist to localStorage (no try-catch)
    const entries = JSON.parse(localStorage.getItem('changelog-entries') || '[]');
    entries.push(entry);
    localStorage.setItem('changelog-entries', JSON.stringify(entries));
  }
  
  /**
   * Retrieve all stored changelog entries
   */
  getChangelogEntries(): Array<{type: string, scope?: string, description: string, timestamp: string}> {
    // No try-catch, just return parsed or empty array
    const raw = localStorage.getItem('changelog-entries');
    return raw ? JSON.parse(raw) : [];
  }
  
  /**
   * Clear stored changelog entries
   */
  clearChangelogEntries(): void {
    localStorage.removeItem('changelog-entries');
    this.info('Cleared changelog entries');
  }

  /**
   * Stub: Check backend health. Returns Observable<boolean>.
   */
  private checkBackendHealth(): Observable<boolean> {
    // TODO: Implement actual health check logic
    return of(true); // Always healthy for now
  }

  /**
   * Stub: Fetch backend logs. Returns Observable<LogEntry[]>.
   */
  private fetchBackendLogs(): Observable<LogEntry[]> {
    // TODO: Implement actual log fetching logic
    return of([]); // No logs for now
  }

  // Example: emit connect event (call this when appropriate in your app)
  emitConnectEvent(data: unknown) {
    this.connectSubject.next(data);
  }
}
