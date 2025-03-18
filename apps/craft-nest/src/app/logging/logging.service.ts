import { Injectable } from '@nestjs/common';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
  source: 'backend';
}

@Injectable()
export class LoggingService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000; // Prevent memory issues

  constructor() {
    // Capture console methods
    this.interceptConsole();
  }

  debug(message: string, metadata?: any): void {
    this.addLog('debug', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.addLog('info', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.addLog('warn', message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.addLog('error', message, metadata);
  }

  private addLog(level: string, message: string, metadata?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      source: 'backend'
    };

    this.logs.push(logEntry);

    // Trim logs if they exceed the maximum
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
  }

  getLogs(level?: string, limit = 100): LogEntry[] {
    if (!level || level === 'all') {
      return this.logs.slice(-limit);
    }
    return this.logs.filter(log => log.level === level).slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  private interceptConsole(): void {
    // Save original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Override console.log
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('log', message);
      originalConsole.log.apply(console, args);
    };

    // Override console.info
    console.info = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('info', message);
      originalConsole.info.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('warn', message);
      originalConsole.warn.apply(console, args);
    };

    // Override console.error
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('error', message);
      originalConsole.error.apply(console, args);
    };

    // Override console.debug
    console.debug = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('debug', message);
      originalConsole.debug.apply(console, args);
    };
  }
}
