import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

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
  details?: any;
}

export interface ServiceCallMetric {
  id: string;
  timestamp: Date;
  serviceName: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  error?: any;
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
  
  // Observable that components can subscribe to for log updates
  logAdded$ = this.logSubject.asObservable();
  logStream$ = this.logSubject.asObservable(); // Alias for compatibility
  serviceCalls$ = this.serviceCallsSubject.asObservable();

  constructor() {
    // Check for stored log level preference
    const storedLevel = localStorage.getItem('loggerLevel');
    if (storedLevel !== null) {
      this.loggerLevel = parseInt(storedLevel, 10);
    }
    
    this.info('LoggerService initialized', { level: this.loggerLevel });
  }

  setLevel(level: LogLevel) {
    this.loggerLevel = level;
    localStorage.setItem('loggerLevel', level.toString());
  }

  getLevel(): LogLevel {
    return this.loggerLevel;
  }

  debug(message: string, details?: any, component?: string) {
    this.log(LogLevel.DEBUG, message, details, component);
  }

  info(message: string, details?: any, component?: string) {
    this.log(LogLevel.INFO, message, details, component);
  }

  warn(message: string, details?: any, component?: string) {
    this.log(LogLevel.WARN, message, details, component);
  }

  error(message: string, details?: any, component?: string) {
    this.log(LogLevel.ERROR, message, details, component);
  }
  
  highlight(message: string, details?: any, component?: string) {
    // Special highlighted log - treat as INFO level
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
  
  endServiceCall(callId: string, status: number, error?: any): void {
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

  private log(level: LogLevel, message: string, details?: any, component?: string) {
    // Only log if the level is greater than or equal to the logger level
    if (level >= this.loggerLevel) {
      // Determine component name from call stack if not provided
      if (!component) {
        component = this.getCallerComponent();
      }
      
      // Create log entry
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        message,
        component,
        details
      };

      // Add to logs array
      this.logs.unshift(entry);
      
      // Limit the number of logs stored
      if (this.logs.length > this.logLimit) {
        this.logs.pop();
      }
      
      // Notify subscribers
      this.logSubject.next(entry);
      
      // Still send to console for development visibility
      this.outputToConsole(level, message, details, component);
    }
  }

  private outputToConsole(level: LogLevel, message: string, details?: any, component?: string) {
    const componentPrefix = component ? `[${component}] ` : '';
    const formattedMessage = `${componentPrefix}${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, details || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, details || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, details || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, details || '');
        break;
    }
  }
  
  private getCallerComponent(): string {
    try {
      const err = new Error();
      const stackLines = err.stack?.split('\n') || [];
      
      // Look for class name in stack trace
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i];
        // Match Component name pattern
        const match = line.match(/at\s+(\w+Component)\./);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch (error) {
      // Silently fail if cannot determine component
    }
    
    return 'Unknown';
  }
  
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  clearLogs() {
    this.logs = [];
    this.logSubject.next({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message: 'Logs cleared',
      component: 'LoggerService'
    });
  }
}
