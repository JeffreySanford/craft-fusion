import { Injectable, Injector, Inject, forwardRef } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ApiService } from './api.service'; // Adjust the path as necessary

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface BaseServiceCallMetric {
  serviceName: string;
  method: string;
  url: string;
  timestamp: number;
  duration?: number;
  status?: number;
}

export interface ServiceCallMetric extends BaseServiceCallMetric {
  securityEvents: number;
  authAttempts: number;
  failedAuths: number;
  activeUsers: number;
  averageLatency: number;
  errorRate: number;
  lastIncident?: Date;
}

interface RegisteredService {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastActivity: number;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

@Injectable({
  providedIn: 'root'
})

export class LoggerService {
  private apiService!: ApiService;
  private logs: LogEntry[] = [];
  private logSubject = new Subject<LogEntry>();
  
  // Expose the log stream as an Observable
  logStream$ = this.logSubject.asObservable();
  
  constructor() {
    this.system('LoggerService initialized');
  }
  // Colors for console output
  private readonly COLORS = {
    error: 'color: #ff3860; font-weight: bold; background-color: rgba(255, 56, 96, 0.1); padding: 2px 6px; border-radius: 4px;',
    warn: 'color: #ffdd57; font-weight: bold; background-color: rgba(255, 221, 87, 0.1); padding: 2px 6px; border-radius: 4px;',
    info: 'color: #3273dc; font-weight: bold; background-color: rgba(50, 115, 220, 0.1); padding: 2px 6px; border-radius: 4px;',
    log: 'color: #23d160; font-weight: bold; background-color: rgba(35, 209, 96, 0.1); padding: 2px 6px; border-radius: 4px;',
    debug: 'color: #9da5b4; font-weight: bold; background-color: rgba(157, 165, 180, 0.1); padding: 2px 6px; border-radius: 4px;',
    highlight: 'color: #ff470f; font-weight: bold; text-decoration: underline; background-color: rgba(255, 71, 15, 0.1); padding: 2px 6px; border-radius: 4px;',
    system: 'color: #8A2BE2; font-weight: bold; background-color: rgba(138, 43, 226, 0.1); padding: 2px 6px; border-radius: 4px;'
  };
  
  // Maximum number of logs to keep in memory
  private readonly MAX_LOGS = 1000;
  
  // Store logs in memory
  private logHistory: string[] = [];
  
  // Observable for frontend components
  private logsSubject = new BehaviorSubject<string[]>([]);
  public logs$: Observable<string[]> = this.logsSubject.asObservable();
  
  // Store service call metrics
  private serviceCallsHistory: ServiceCallMetric[] = [];
  private serviceCallsSubject = new BehaviorSubject<ServiceCallMetric[]>([]);
  public serviceCalls$: Observable<ServiceCallMetric[]> = this.serviceCallsSubject.asObservable();

  // Track registered services
  private registeredServices: Map<string, RegisteredService> = new Map();
  private registeredServicesSubject = new BehaviorSubject<RegisteredService[]>([]);
  public registeredServices$ = this.registeredServicesSubject.asObservable();
  
  // Track active service calls
  private activeServiceCalls: Map<string, BaseServiceCallMetric> = new Map();

  /**
   * Format a message with timestamp and level
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const source = level === 'SYSTEM' ? 'system' : 'user'; // Indicate source
    return `[${timestamp}] ${level}: (${source}) ${message}`;
  }

  /**
   * Add a log to history and notify subscribers
   */
  private addLog(level: string, message: string): void {
    const formattedMessage = this.formatMessage(level, message);
    this.logHistory.push(formattedMessage);
    
    // Trim log history if it exceeds the maximum
    if (this.logHistory.length > this.MAX_LOGS) {
      this.logHistory = this.logHistory.slice(-this.MAX_LOGS);
    }
    
    // Notify subscribers
    this.logsSubject.next([...this.logHistory]);
  }

  /**
   * Log an error with vibrant red color
   */
  error(message: string, data?: any): void {
    this.logMessage('error', message, data);
  }

  /**
   * Log a warning with vibrant yellow color
   */
  warn(message: string, data?: any): void {
    this.logMessage('warn', message, data);
  }

  /**
   * Log info with vibrant blue color
   */
  info(message: string, data?: any): void {
    this.logMessage('info', message, data);
  }

  /**
   * Debug log with subtle gray color
   */
  debug(message: string, data?: any): void {
    this.logMessage('debug', message, data);
  }

  /**
   * System log with vibrant purple color - for internal service messages
   */
  system(message: string): void {
    console.log(`%cSYSTEM: %c${message}`, this.COLORS.system, 'color: inherit');
    this.addLog('LOG', message);
  }

  /**
   * Highlight log with vibrant orange color - for important messages
   */
  highlight(message: string, data?: any): void {
    const dataStr = data ? ` - ${JSON.stringify(data)}` : '';
    const fullMessage = `${message}${dataStr}`;
    
    console.log(`%cHIGHLIGHT: %c${fullMessage}`, this.COLORS.highlight, 'color: inherit');
    this.addLog('HIGHLIGHT', fullMessage);
  }

  /**
   * Log service call metrics for API tracking
   */
  logServiceCall(metric: ServiceCallMetric): void {
    this.serviceCallsHistory.push(metric);
    this.serviceCallsSubject.next([...this.serviceCallsHistory]);

    // Log the service call to console with appropriate color
    const status = metric.status || 0;
    const method = metric.method || 'UNKNOWN';
    const url = metric.url || 'unknown-url';
    const duration = metric.duration ? `${metric.duration.toFixed(2)}ms` : 'N/A';
    
    if (status >= 400) {
      this.error(`API ${method} ${url} - ${status}`, { duration, ...metric });
    } else if (status >= 300) {
      this.warn(`API ${method} ${url} - ${status}`, { duration, ...metric });
    } else {
      this.info(`API ${method} ${url} - ${status}`, { duration, serviceName: metric.serviceName });
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.logHistory = [];
    this.logsSubject.next([]);
    this.system('All logs cleared');
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.serviceCallsHistory = [];
    this.serviceCallsSubject.next([]);
    this.system('All metrics cleared');
  }

  /**
   * Get current logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Log user login activities
   */
  logUserLogin(username: string, loginDate: Date): void {
    const loginTime = loginDate.toISOString();
    this.highlight(`User login: ${username} at ${loginTime}`);
    this.logServiceCall({
      serviceName: 'AuthenticationService',
      method: 'POST',
      url: '/auth/login',
      status: 200,
      duration: 120,
      timestamp: loginDate.getTime(),
      securityEvents: 1,
      authAttempts: 1,
      failedAuths: 0,
      activeUsers: 1,
      averageLatency: 120,
      errorRate: 0
    });
  }

  /**
   * Log record generation events 
   */
  logRecordGeneration(count: number): void {
    this.info(`Generated ${count} records`, { timestamp: new Date().toISOString(), count });
  }
  
  /**
   * Log state changes
   */
  logStateChange(key: string, value: string): void {
    this.debug(`State change: ${key} = ${value}`);
  }

  /**
   * Register a service with the logger
   */
  registerService(serviceName: string): void {
    const service: RegisteredService = {
      name: serviceName,
      status: 'active',
      lastActivity: Date.now()
    };
    
    this.registeredServices.set(serviceName, service);
    this.system(`Service registered: ${serviceName}`);
    this.updateRegisteredServices();
  }

  /**
   * Update service status
   */
  updateServiceStatus(serviceName: string, status: 'active' | 'inactive' | 'error'): void {
    const service = this.registeredServices.get(serviceName);
    if (service) {
      service.status = status;
      service.lastActivity = Date.now();
      this.updateRegisteredServices();
      
      if (status === 'error') {
        this.error(`Service ${serviceName} reported error status`);
      } else {
        this.debug(`Service ${serviceName} status: ${status}`);
      }
    }
  }
  
  /**
   * Start tracking a service call
   */
  startServiceCall(serviceName: string, method: string, url: string): string {
    const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeServiceCalls.set(callId, {
      serviceName,
      method,
      url,
      timestamp: Date.now()
    });
    
    this.debug(`${serviceName} API call started: ${method} ${url}`);
    
    return callId;
  }

  /**
   * End tracking a service call with status
   */
  endServiceCall(callId: string, status: number): void {
    const startData = this.activeServiceCalls.get(callId);
    if (!startData) return;
    
    const endTime = Date.now();
    const duration = endTime - startData.timestamp;
    
    // Create complete metric
    const metric: ServiceCallMetric = {
      ...startData,
      status,
      duration,
      securityEvents: 0,
      authAttempts: 0,
      failedAuths: 0,
      activeUsers: 0,
      averageLatency: duration,
      errorRate: status >= 400 ? 100 : 0
    };
    
    // Update service last activity time
    const service = this.registeredServices.get(startData.serviceName);
    if (service) {
      service.lastActivity = Date.now();
      this.updateRegisteredServices();
    }
    
    // Log and store the complete service call
    this.logServiceCall(metric);
    
    // Remove from active calls
    this.activeServiceCalls.delete(callId);
  }
  
  private updateRegisteredServices(): void {
    this.registeredServicesSubject.next(Array.from(this.registeredServices.values()));
  }

  /**
   * Log standard message with vibrant green color
   */
  log(message: string, data?: any): void {
    this.logMessage('info', message, data); // Call logMessage instead of log to avoid name conflict
  }
  
  private logMessage(level: LogLevel, message: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source: this.getCallerInfo()
    };

    this.logs.push(logEntry);
    this.logSubject.next(logEntry);
    
    // Also log to console in development
    this.logToConsole(logEntry);
    
    // Add to string-based log history for backward compatibility
    const formattedMessage = `${message}${data ? ` - ${JSON.stringify(data)}` : ''}`;
    this.addLog(level.toUpperCase(), formattedMessage);
  }

  private logToConsole(logEntry: LogEntry): void {
    const consoleMessage = `[${logEntry.level.toUpperCase()}] ${logEntry.message}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(consoleMessage, logEntry.data || '');
        break;
      case 'info':
        console.info(consoleMessage, logEntry.data || '');
        break;
      case 'warn':
        console.warn(consoleMessage, logEntry.data || '');
        break;
      case 'error':
        console.error(consoleMessage, logEntry.data || '');
        break;
    }
  }

  private getCallerInfo(): string {
    try {
      const err = new Error();
      const stack = err.stack || '';
      const stackLines = stack.split('\n');
      
      // Skip the first few stack frames which belong to this logger
      if (stackLines.length > 3) {
        const callerLine = stackLines[3]; // This might need adjusting based on your environment
        
        // Extract the caller info from the stack trace
        const match = callerLine.match(/at\s+(.*)\s+\(/);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch (e) {
      // Ignore any errors in stack trace parsing
    }
    
    return 'unknown';
  }
}
