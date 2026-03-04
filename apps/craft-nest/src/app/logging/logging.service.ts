import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';

import { LogEntry } from './log-entry.interface';

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

  constructor() {
    // Console interception disabled to reduce pollution
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('debug', message, metadata);
  }

  verbose(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('verbose', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
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
  trackOperation(operation: string, durationMs: number, metadata?: Record<string, unknown>): void {
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
  createOperationTracker(operation: string, metadata?: Record<string, unknown>): () => void {
    const startTime = Date.now();
    return () => {
      const durationMs = Date.now() - startTime;
      this.trackOperation(operation, durationMs, metadata);
    };
  }

  private addLog(level: string, message: string, metadata?: Record<string, unknown>): void {
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

  private outputToConsole(level: string, message: string, metadata?: any): void {
    // Only output INFO and above to console to reduce noise
    if (level === 'debug' || level === 'verbose') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    // Using standard console methods
    switch (level) {
      case 'debug':
        console.debug(`${prefix} ${message}`, metadata || '');
        break;
      case 'info':
        console.info(`${prefix} ${message}`, metadata || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, metadata || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, metadata || '');
        break;
      default:
         // console.log(`${prefix} ${message}`, metadata || '');
    }
  }

  private sanitizeMetadata(metadata: unknown): Record<string, unknown> | undefined {
    // Only objects can be sanitized
    if (!metadata || typeof metadata !== 'object') {
      return undefined;
    }
    
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'key', 'apiKey'];
    const sanitized = { ...(metadata as Record<string, unknown>) } as Record<string, unknown>;
    
    try {
      const sanitizeObject = (obj: Record<string, unknown>) => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
          const val = obj[key];
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            obj[key] = '[REDACTED]';
          } else if (typeof val === 'object' && val !== null) {
            sanitizeObject(val as Record<string, unknown>);
          }
        });
      };
      
      sanitizeObject(sanitized);
      
      // Special handling for error objects if present on sanitized copy
      if ('error' in sanitized && typeof sanitized['error'] === 'object' && sanitized['error'] !== null) {
        const err = sanitized['error'] as any;
        sanitized['error'] = {
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
