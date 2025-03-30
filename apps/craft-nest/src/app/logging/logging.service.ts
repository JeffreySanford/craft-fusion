import { Injectable, Logger } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { WriteStream } from 'fs';
import { Observable, of } from 'rxjs';

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: any;
  trace?: string;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private logStream: WriteStream | undefined;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000; // Keep at most 1000 logs in memory

  constructor() {
    this.logger.log('LoggingService initialized');
    this.setupLogFile();
  }

  private setupLogFile(): void {
    try {
      const logDir = join(process.cwd(), 'logs');
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      this.logStream = createWriteStream(logFile, { flags: 'a' });
      this.logger.log(`Log file created at: ${logFile}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to set up log file: ${errorMessage}`);
    }
  }

  log(message: string, context?: string, metadata?: any): void {
    this.addLogEntry('info', message, context, metadata);
    this.logger.log(message, context);
  }
  
  info(message: string, context?: string, metadata?: any): void {
    this.log(message, context, metadata);
  }

  error(message: string, trace?: string, context?: string, metadata?: any): void {
    this.addLogEntry('error', message, context, metadata, trace);
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string, metadata?: any): void {
    this.addLogEntry('warn', message, context, metadata);
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string, metadata?: any): void {
    this.addLogEntry('debug', message, context, metadata);
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string, metadata?: any): void {
    this.addLogEntry('verbose', message, context, metadata);
    this.logger.verbose(message, context);
  }

  private addLogEntry(level: string, message: string, context?: string, metadata?: any, trace?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level,
      message,
      timestamp,
      context,
      metadata,
      trace,
    };

    // Add to in-memory logs (with size limit)
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log when limit is reached
    }

    // Write to log file
    if (this.logStream) {
      try {
        this.logStream.write(`${JSON.stringify(logEntry)}\n`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to write to log file: ${errorMessage}`);
      }
    }
  }

  getLogs(limit: number = 100, level?: string): Observable<LogEntry[]> {
    let filteredLogs = [...this.logs];
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    const result = filteredLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
      
    return of(result);
  }

  clearLogs(): Observable<boolean> {
    this.logger.log('Clearing in-memory logs');
    this.logs = [];
    return of(true);
  }
}
