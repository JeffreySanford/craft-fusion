import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, ReplaySubject, of, timer } from 'rxjs';
import { map, switchMap, takeUntil, catchError, tap, filter } from 'rxjs/operators';
import { HttpContextToken } from '@angular/common/http';

export const TIMEOUT = new HttpContextToken<number>(() => 30000);

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
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

  errorRate?: number;
  authAttempts?: number;
  securityEvents?: number;
  activeUsers?: number;
  averageLatency?: number;
  lastIncident?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logs: LogEntry[] = [];
  private logLimit = 1000;                                   
  private loggerLevel = LogLevel.DEBUG;                     
  private logSubject = new Subject<LogEntry>();

  private serviceMetrics: ServiceCallMetric[] = [];
  private serviceMetricsLimit = 100;
  private serviceCallsSubject = new BehaviorSubject<ServiceCallMetric[]>([]);
  private registeredServices: Set<string> = new Set();
  private serviceCallsInProgress: Map<string, ServiceCallMetric> = new Map();

  private pollingDestroy$: Subject<void> = new Subject<void>();

  logAdded$ = this.logSubject.asObservable();
  logStream$ = this.logSubject.asObservable();                           
  serviceCalls$ = this.serviceCallsSubject.asObservable();

  private connectSubject = new Subject<unknown>();
  private errorSubject = new Subject<unknown>();
  private infoSubject = new Subject<unknown>();
  private changelogSubject = new ReplaySubject<unknown>(100);

  connect$ = this.connectSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  info$ = this.infoSubject.asObservable();
  changelog$ = this.changelogSubject.asObservable();

  constructor() {
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
      url,
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
        error,
      };

      this.serviceCallsInProgress.delete(callId);

      this.serviceMetrics.unshift(completedMetric);

      if (this.serviceMetrics.length > this.serviceMetricsLimit) {
        this.serviceMetrics.pop();
      }

      this.serviceCallsSubject.next([...this.serviceMetrics]);

      if (status >= 200 && status < 300) {
        this.debug(`Service call completed: ${startMetric.serviceName}`, { method: startMetric.method, url: startMetric.url, status, duration: `${duration}ms` });
      } else {
        this.error(`Service call failed: ${startMetric.serviceName}`, { method: startMetric.method, url: startMetric.url, status, duration: `${duration}ms`, error });
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

    if (level >= this.loggerLevel) {

      if (!component) {
        component = this.getCallerComponent();
      }

      let suppressConsole = false;
      let detailsForSanitization: Record<string, unknown> | undefined;

      if (details && typeof details === 'object' && !Array.isArray(details)) {
        detailsForSanitization = { ...(details as Record<string, unknown>) };
        if ('suppressConsole' in detailsForSanitization) {
          suppressConsole = Boolean((detailsForSanitization as Record<string, unknown>)['suppressConsole']);
          delete (detailsForSanitization as Record<string, unknown>)['suppressConsole'];
        }
      }

      const sanitizedDetails = this.sanitizeLogDetails(detailsForSanitization);

      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        message,
        component,
        details: sanitizedDetails,
      };

      this.logs.unshift(entry);

      if (this.logs.length > this.logLimit) {
        this.logs.pop();
      }

      this.logSubject.next(entry);

      if (level === LogLevel.ERROR) {
        this.errorSubject.next(entry);
      } else if (level === LogLevel.INFO) {
        this.infoSubject.next(entry);
      }

      if (this.isTestEnvironment()) {
        suppressConsole = true;
      }
      this.outputToConsole(level, message, sanitizedDetails, component, suppressConsole);
    }
  }

  private outputToConsole(level: LogLevel, message: string, details?: unknown, component: string = '', suppressConsole = false) {
    if (suppressConsole) return;
    const css = (name: string, fallback: string) => {
      try {
        if (typeof window === 'undefined' || !window.getComputedStyle) return fallback;
        const v = getComputedStyle(document.documentElement).getPropertyValue(name);
        return v ? v.trim() : fallback;
      } catch {
        return fallback;
      }
    };

    const styles = {
      debug: `color: ${css('--md-sys-primary', '#3b82f6')}; font-weight: normal;`,
      info: `color: ${css('--md-sys-primary', '#0052B4')}; font-weight: normal;`,
      warn: `color: ${css('--md-sys-warning', '#FF8C00')}; font-weight: bold;`,
      error: `color: ${css('--md-sys-error', '#BF0A30')}; font-weight: bold;`,

      highlight: `color: ${css('--md-sys-on-surface', '#3C3B6E')}; font-weight: bold; text-decoration: underline;`,
      security: `color: ${css('--md-sys-security', '#8B008B')}; font-weight: bold; background-color: rgba(139, 0, 139, 0.1); padding: 2px 4px;`,
      performance: `color: ${css('--md-sys-on-surface', '#3C3B6E')}; font-weight: normal; font-style: italic;`,
      user: `color: ${css('--md-sys-success', '#008080')}; font-weight: normal;`,
      api: `color: ${css('--md-sys-primary', '#0052B4')}; font-weight: normal;`,
      navigation: `color: ${css('--md-sys-warning', '#FF8C00')}; font-weight: normal;`,
      data: `color: ${css('--md-sys-primary', '#0052B4')}; font-weight: normal;`,
      storage: `color: ${css('--md-sys-success', '#006400')}; font-weight: normal;`,
      rendering: `color: ${css('--md-sys-primary', '#0052B4')}; font-weight: normal;`,
      initialization: `color: ${css('--md-sys-on-surface', '#3C3B6E')}; font-weight: normal;`,
      lifecycle: `color: ${css('--md-sys-on-surface', '#3C3B6E')}; font-weight: normal;`,
      usa: `background: linear-gradient(90deg, ${css('--md-sys-primary', '#0052B4')}, ${css('--md-sys-on-surface', '#3C3B6E')}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;`,
      system: `color: ${css('--md-sys-on-surface', '#3C3B6E')}; font-weight: normal;`,
      component: `color: ${css('--md-sys-on-primary', '#fff')}; font-style: italic; background-color: rgba(60, 59, 110, 0.5); padding: 2px 4px; border-radius: 2px;`,
    };

    const styledPrefix = component ? `%c[${component}]%c ` : '';
    const styledMessage = `${styledPrefix}%c${message}`;

    const styleArgs = [];
    if (component) {
      styleArgs.push(styles.component, '');                         
    }

    let messageStyle = '';

    if (message.includes('⭐') || message.includes('IMPORTANT')) {
      messageStyle = styles.highlight;
    }

    else if (this.isSecurityRelated(message, component)) {
      messageStyle = styles.security;
    }

    else if (this.isAuthRelated(message, component)) {
      messageStyle = styles.security;                                       
    }

    else if (this.isPerformanceRelated(message, component, details)) {
      messageStyle = styles.performance;
    }

    else if (this.isUserRelated(message, component)) {
      messageStyle = styles.user;
    }

    else if (this.isApiRelated(message, component)) {
      messageStyle = styles.api;
    }

    else if (this.isNavigationRelated(message, component)) {
      messageStyle = styles.navigation;
    }

    else if (this.isDataRelated(message, component)) {
      messageStyle = styles.data;
    }

    else if (this.isStorageRelated(message, component)) {
      messageStyle = styles.storage;
    }

    else if (this.isRenderingRelated(message, component)) {
      messageStyle = styles.rendering;
    }

    else if (this.isInitializationRelated(message, component)) {
      messageStyle = styles.initialization;
    }

    else if (this.isLifecycleRelated(message, component)) {
      messageStyle = styles.lifecycle;
    }

    else if (this.isUSARelated(message, component)) {
      messageStyle = styles.usa;
    }

    else if (this.isSystemRelated(message, component)) {
      messageStyle = styles.system;
    } else {

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

    styleArgs.push(messageStyle);

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

  private isSecurityRelated(message: string, component: string = ''): boolean {
    const securityTerms = [
      'security',
      'permission',
      'access',
      'credential',
      'protect',
      'firewall',
      'encrypt',
      'decrypt',
      'hash',
      'salt',
      'csrf',
      'xss',
      'injection',
      'vulnerability',
    ];
    return Boolean(
      this.containsTerms(securityTerms, message) ||
      (component && this.containsTerms(securityTerms, component)) ||
      (component && ['AuthService', 'SecurityService', 'AuthGuard', 'PermissionService'].includes(component)),
    );
  }

  private isAuthRelated(message: string, component: string = ''): boolean {
    const authTerms = ['auth', 'login', 'logout', 'signin', 'signout', 'register', 'password', 'token', 'jwt', 'authenticate', 'identity', 'oauth', 'session', 'user'];
    return Boolean(
      this.containsTerms(authTerms, message) ||
      (component && this.containsTerms(authTerms, component)) ||
      (component && ['AuthService', 'LoginComponent', 'AuthGuard'].includes(component)),
    );
  }

  private isPerformanceRelated(message: string, component: string = '', details?: unknown): boolean {
    const perfTerms = ['performance', 'latency', 'speed', 'slow', 'fast', 'metrics', 'benchmark', 'timeout', 'memory', 'cpu', 'load', 'resource', 'optimize', 'render time'];
    return Boolean(
      this.containsTerms(perfTerms, message) ||
      (component && this.containsTerms(perfTerms, component)) ||
      (details && JSON.stringify(details).toLowerCase().includes('performance')),
    );
  }

  private isUserRelated(message: string, component: string = ''): boolean {
    const userTerms = ['user', 'account', 'profile', 'logged in', 'logged out', 'signup', 'register', 'preference', 'settings', 'avatar', 'role', 'permission'];
    return Boolean(
      this.containsTerms(userTerms, message) ||
      (component && this.containsTerms(userTerms, component)) ||
      (component && ['UserService', 'ProfileComponent', 'AccountComponent'].includes(component)),
    );
  }

  private isApiRelated(message: string, component: string = ''): boolean {
    const apiTerms = ['api', 'endpoint', 'request', 'response', 'http', 'service call', 'fetch', 'xhr', 'rest', 'graphql', 'post', 'get', 'put', 'delete', 'patch'];
    return Boolean(
      this.containsTerms(apiTerms, message) ||
      (component && this.containsTerms(apiTerms, component)) ||
      (component && ['ApiService', 'HttpClient', 'ApiLoggerService', 'DataService'].includes(component)) ||
      message.includes('/api/'),
    );
  }

  private isNavigationRelated(message: string, component: string = ''): boolean {
    const navTerms = ['navigate', 'routing', 'route', 'path', 'url', 'link', 'redirect', 'forward', 'back', 'page', 'view', 'location'];
    return Boolean(
      this.containsTerms(navTerms, message) ||
      (component && this.containsTerms(navTerms, component)) ||
      (component && ['Router', 'NavigationService', 'RouteGuard'].includes(component)),
    );
  }

  private isDataRelated(message: string, component: string = ''): boolean {
    const dataTerms = ['data', 'model', 'entity', 'object', 'json', 'parse', 'serialize', 'store', 'state', 'update', 'change', 'mutation'];
    return Boolean(
      this.containsTerms(dataTerms, message) ||
      (component && this.containsTerms(dataTerms, component)) ||
      (component && ['StoreService', 'DataService', 'StateService'].includes(component)),
    );
  }

  private isStorageRelated(message: string, component: string = ''): boolean {
    const storageTerms = ['storage', 'cache', 'persist', 'save', 'load', 'local', 'session', 'cookie', 'indexdb', 'database', 'db'];
    return Boolean(
      this.containsTerms(storageTerms, message) ||
      (component && this.containsTerms(storageTerms, component)) ||
      (component && ['StorageService', 'CacheService', 'PersistenceService'].includes(component)),
    );
  }

  private isRenderingRelated(message: string, component: string = ''): boolean {
    const renderTerms = ['render', 'view', 'template', 'component', 'ui', 'interface', 'dom', 'element', 'layout', 'style', 'css', 'html'];
    return Boolean(
      this.containsTerms(renderTerms, message) ||
      (component && this.containsTerms(renderTerms, component)) ||
      message.toLowerCase().includes('render') ||
      message.toLowerCase().includes('template'),
    );
  }

  private isInitializationRelated(message: string, component: string = ''): boolean {
    const initTerms = ['init', 'start', 'bootstrap', 'launch', 'setup', 'config', 'load', 'ready', 'create', 'instantiate'];
    return Boolean(this.containsTerms(initTerms, message) || (component && this.containsTerms(initTerms, component)) || message.toLowerCase().includes('initialized'));
  }

  private isLifecycleRelated(message: string, component: string = ''): boolean {
    const lifecycleTerms = ['lifecycle', 'oninit', 'onchanges', 'ondestroy', 'afterviewinit', 'mount', 'unmount', 'construct', 'destroy'];
    return Boolean(this.containsTerms(lifecycleTerms, message) || (component && this.containsTerms(lifecycleTerms, component)));
  }

  private isUSARelated(message: string, component: string = ''): boolean {
    const usaTerms = ['usa', 'patriotic', 'america', 'united states', 'flag', 'military', 'veteran', 'patriot', 'freedom', 'liberty', 'independence', 'eagle'];
    return Boolean(this.containsTerms(usaTerms, message) || (component && this.containsTerms(usaTerms, component)));
  }

  private isSystemRelated(message: string, component: string = ''): boolean {
    const systemTerms = ['system', 'core', 'framework', 'platform', 'infrastructure'];

    const systemComponents = ['SystemService', 'ConfigService', 'InitializationService', 'AppComponent', 'CoreModule'];

    return Boolean(this.containsTerms(systemTerms, message) || (component && this.containsTerms(systemTerms, component)) || (component && systemComponents.includes(component)));
  }

  private containsTerms(terms: string[], text: string, component: string = ''): boolean {
    if (!text) return false;

    const lowerText = text.toLowerCase();
    const lowerComponent = component ? component.toLowerCase() : '';

    return Boolean(terms.some(term => lowerText.includes(term.toLowerCase()) || (component && lowerComponent.includes(term.toLowerCase()))));
  }

  private getCallerComponent(): string {
    try {
      const err = new Error();
      const stackLines = err.stack?.split('\n') || [];

      for (let i = 3; i < Math.min(10, stackLines.length); i++) {

        const line = stackLines.at(i);
        if (!line) continue;

        const componentMatch = line.match(/at\s+(\w+(?:Component|Service|Guard|Directive|Pipe|Resolver))\./);
        if (componentMatch && componentMatch[1]) {
          return componentMatch[1];
        }

        const methodMatch = line.match(/at\s+([A-Z]\w*)\.((?:\w+))/);
        if (methodMatch && methodMatch[1]) {
          return methodMatch[1];                              
        }

        const fileMatch = line.match(/\((.+?)(?:\.ts|\.[jt]sx?):(\d+):(\d+)\)$/);
        if (fileMatch && fileMatch[1]) {
          const fileName = fileMatch[1].split(/[/\\]/).pop() || '';
          if (fileName && !fileName.includes('logger.service') && !fileName.includes('node_modules')) {
            return fileName
              .replace(/\.component$/, 'Component')
              .replace(/\.service$/, 'Service')
              .replace(/\.guard$/, 'Guard')
              .replace(/\.[jt]s$/, '');
          }
        }
      }
    } catch (error) {

      console.error('Error determining component:', error);
    }

    if (typeof window !== 'undefined') {
      const url = window.location.pathname;
      if (url.includes('/admin')) return 'AdminComponent';
      if (url.includes('/login')) return 'LoginComponent';
      if (url.includes('/auth')) return 'AuthComponent';

    }

    return 'Unknown';
  }

  private sanitizeLogDetails(details: unknown): unknown {
    if (!details) return details;

    try {

      const sanitized = JSON.parse(JSON.stringify(details)) as Record<string, any>;

      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'auth'];

      const sanitizeObject = (obj: Record<string, any>) => {
        if (!obj || typeof obj !== 'object') return;

        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = String(key).toLowerCase();

          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            Object.defineProperty(obj, key, {
              value: '[REDACTED]',
              writable: true,
              enumerable: true,
              configurable: true,
            });
            continue;
          }

          if (value && typeof value === 'object') {
            sanitizeObject(value as Record<string, any>);
          }
        }
      };

      sanitizeObject(sanitized);
      return sanitized;
    } catch {

      return { original: details, warning: 'Could not sanitize log details' };
    }
  }

  startPollingBackendLogs(intervalMs: number = 10000): void {

    this.stopPollingBackendLogs();

    let backendAvailable = true;
    let consecutiveFailures = 0;
    let currentInterval = intervalMs;
    const maxInterval = 60000;                                 

    this.pollingDestroy$ = new Subject<void>();

    timer(1000, 1000)                                                        
      .pipe(
        takeUntil(this.pollingDestroy$),
        map(() => {

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

                consecutiveFailures++;
                currentInterval = Math.min(intervalMs * Math.pow(1.5, consecutiveFailures), maxInterval);

                if (consecutiveFailures === 1) {
                  this.warn('Backend connection lost, retrying with increased interval', {
                    nextRetry: `${(currentInterval / 1000).toFixed(1)}s`,
                  });
                }
              } else if (consecutiveFailures > 0) {

                consecutiveFailures = 0;
                this.info('Backend connection restored, resuming normal polling');
              }
            }),

            filter(isHealthy => isHealthy),
            switchMap(() => this.fetchBackendLogs()),
          ),
        ),
      )
      .subscribe({
        next: logs => {

          this.processBackendLogs(logs);
        },
      });

    this.info('Backend log polling started', {
      initialIntervalMs: intervalMs,
      adaptivePolling: true,
    });
  }

  stopPollingBackendLogs(): void {
    if (this.pollingDestroy$) {
      this.pollingDestroy$.next();
      this.pollingDestroy$.complete();
      this.debug('Backend log polling stopped');
    }
  }

  private processBackendLogs(logs: LogEntry[]): void {

    for (const log of logs) {

      const backendLog = {
        ...log,
        source: 'backend',

        timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp),
      };

      this.logs.unshift(backendLog);
    }

    while (this.logs.length > this.logLimit) {
      this.logs.pop();
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];

  }

  changelogEntry(type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'chore', description: string, scope?: string): void {

    const message = scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`;

    this.info(`CHANGELOG: ${message}`, { changelog: true });

    const entry = {
      type,
      scope,
      description,
      timestamp: new Date().toISOString(),
    };
    this.changelogSubject.next(entry);

    const entries = JSON.parse(localStorage.getItem('changelog-entries') || '[]');
    entries.push(entry);
    localStorage.setItem('changelog-entries', JSON.stringify(entries));
  }

  getChangelogEntries(): Array<{ type: string; scope?: string; description: string; timestamp: string }> {

    const raw = localStorage.getItem('changelog-entries');
    return raw ? JSON.parse(raw) : [];
  }

  clearChangelogEntries(): void {
    localStorage.removeItem('changelog-entries');
    this.info('Cleared changelog entries');
  }

  private checkBackendHealth(): Observable<boolean> {

    return of(true);                          
  }

  private fetchBackendLogs(): Observable<LogEntry[]> {

    return of([]);                   
  }

  private isTestEnvironment(): boolean {
    const env = typeof (globalThis as any).process !== 'undefined' ? (globalThis as any).process.env : undefined;
    return Boolean(env && env.NODE_ENV === 'test');
  }

  emitConnectEvent(data: unknown) {
    this.connectSubject.next(data);
  }
}
