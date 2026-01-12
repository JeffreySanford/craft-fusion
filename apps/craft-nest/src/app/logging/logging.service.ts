import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';

export interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  metadata?: any;
}

@Injectable()
export class LoggingService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000; // Prevent memory issues
  private readonly SLOW_OPERATION_THRESHOLD = 500; // ms
  private readonly RATE_LIMIT = {
    enabled: true,
    window: 5000, // 5 seconds
    maxErrors: 5, // max errors in window
    errorCount: 0,
    lastResetTime: Date.now()
  };

  // Save original console methods to avoid recursion
  private readonly originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  constructor() {
    // Capture console methods
    this.interceptConsole();
  }

  debug(message: string, metadata?: any): void {
    this.addLog('debug', message, metadata);
  }

  verbose(message: string, metadata?: any): void {
    this.addLog('verbose', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.addLog('info', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.addLog('warn', message, metadata);
  }

  error(message: string, metadata?: any): void {
    // Check rate limiting for errors to prevent log flooding
    if (this.RATE_LIMIT.enabled) {
      const now = Date.now();
      if (now - this.RATE_LIMIT.lastResetTime > this.RATE_LIMIT.window) {
        // Reset counter if window has passed
        this.RATE_LIMIT.errorCount = 0;
        this.RATE_LIMIT.lastResetTime = now;
      }
      
      this.RATE_LIMIT.errorCount++;
      
      if (this.RATE_LIMIT.errorCount > this.RATE_LIMIT.maxErrors) {
        // Add one log about rate limiting instead of the actual error
        if (this.RATE_LIMIT.errorCount === this.RATE_LIMIT.maxErrors + 1) {
          this.addLog('warn', 'Error logging rate limited - suppressing further errors in this time window', {
            window: this.RATE_LIMIT.window,
            maxErrors: this.RATE_LIMIT.maxErrors
          });
        }
        return;
      }
    }
    
    this.addLog('error', message, metadata);
  }

  /**
   * Track operation time and log if it exceeds threshold
   */
  trackOperation(operation: string, durationMs: number, metadata?: any): void {
    if (durationMs > this.SLOW_OPERATION_THRESHOLD) {
      this.warn(`Slow operation: ${operation}`, {
        ...metadata,
        durationMs,
        threshold: this.SLOW_OPERATION_THRESHOLD
      });
    } else {
      this.debug(`Operation completed: ${operation}`, {
        ...metadata,
        durationMs
      });
    }
  }

  /**
   * Create an operation tracker that automatically logs completion time
   */
  createOperationTracker(operation: string, metadata?: any): () => void {
    const startTime = Date.now();
    return () => {
      const durationMs = Date.now() - startTime;
      this.trackOperation(operation, durationMs, metadata);
    };
  }

  private addLog(level: string, message: string, metadata?: any): void {
    // Sanitize metadata to prevent sensitive data leakage
    const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : undefined;
    
    // Create log entry
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      metadata: sanitizedMetadata
    };
    
    // Add to internal logs array with limit
    this.logs.unshift(logEntry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // Output to console with appropriate method
    this.outputToConsole(level, message, sanitizedMetadata);
  }

  /**
   * Get logs filtered by level and limited by count
   * Returns an Observable for reactive pattern consistency
   */
  getLogs(level?: string, limit = 100): Observable<LogEntry[]> {
    if (!level) {
      return of(this.logs.slice(0, limit));
    }
    return of(this.logs
      .filter(log => log.level === level)
      .slice(0, limit));
  }

  /**
   * Clear all logs
   * Returns an Observable to maintain reactive pattern
   */
  clearLogs(): Observable<void> {
    this.logs = [];
    this.info('Logs cleared');
    return of(void 0);
  }

  private interceptConsole(): void {
    // Override console.log
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('log', message);
      this.originalConsole.log.apply(console, args);
    };

    // Override console.info
    console.info = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('info', message);
      this.originalConsole.info.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('warn', message);
      this.originalConsole.warn.apply(console, args);
    };

    // Override console.error
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('error', message);
      this.originalConsole.error.apply(console, args);
    };

    // Override console.debug
    console.debug = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('debug', message);
      this.originalConsole.debug.apply(console, args);
    };
  }

  private outputToConsole(level: string, message: string, metadata?: any): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    // Use original console methods to avoid recursion
    switch (level) {
      case 'debug':
        this.originalConsole.debug(`${prefix} ${message}`, metadata || '');
        break;
      case 'info':
        this.originalConsole.info(`${prefix} ${message}`, metadata || '');
        break;
      case 'warn':
        this.originalConsole.warn(`${prefix} ${message}`, metadata || '');
        break;
      case 'error':
        this.originalConsole.error(`${prefix} ${message}`, metadata || '');
        break;
      default:
        this.originalConsole.log(`${prefix} ${message}`, metadata || '');
    }
  }

  private sanitizeMetadata(metadata: any): any {
    if (!metadata) return metadata;
    
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'key', 'apiKey'];
    const sanitized = {...metadata};
    
    try {
      const sanitizeObject = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        });
      };
      
      sanitizeObject(sanitized);
      
      // Special handling for error objects
      if (metadata.error) {
        const err = metadata.error;
        sanitized.error = {
          message: err.message,
          name: err.name,
          stack: this.isProductionEnv() ? undefined : err.stack
        };
      }
      
      return sanitized;
    } catch (e) {
      return { original: 'Error sanitizing metadata' };
    }
  }
  
  private isProductionEnv(): boolean {
    return process.env['NODE_ENV'] === 'production';
  }
}
