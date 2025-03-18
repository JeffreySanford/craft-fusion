import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { LoggerService } from '../../common/services/logger.service';
import { Subscription } from 'rxjs';
import { ApiLoggerService } from '../../common/services/api-logger.service';

interface LogEntry {
  timestamp: string;
  numericTimestamp: number; // <-- new field
  level: string;
  message: string;
  description?: string; // <-- new field
  data?: string;        // <-- new field
  rawMessage?: string; // Store the original message
  user?: string; // Add user field
  date?: string; // Add date field
  time?: string; // Add time field
  source: 'frontend' | 'backend';
}

@Component({
  selector: 'app-logger-display',
  templateUrl: './logger-display.component.html',
  styleUrls: ['./logger-display.component.scss', '../../../styles/_variables.scss'],
  standalone: false
})
export class LoggerDisplayComponent implements OnInit, OnDestroy {
  @Input() autoScroll: boolean = true;
  @Input() logFilter: string = 'all';
  
  // Add expanded sections state
  expandedSections: { [key: string]: boolean } = {
    'info': false,
    'log': false,
    'warn': false,
    'error': false,
    'general': false // Add general section
  };

  logs: { [level: string]: { [date: string]: LogEntry[] } } = {
    error: {},
    warn: {},
    info: {},
    log: {},
    general: {} // Add general logs
  };

  // Add sort order for each category, defaulting to ascending
  sortOrder: { [level: string]: 'asc' | 'desc' } = {
    error: 'asc',
    warn: 'asc',
    info: 'asc',
    log: 'asc',
    general: 'asc' // Add sort order for general logs
  };

  private logsSubscription!: Subscription;
  private backendLogsSubscription!: Subscription;

  constructor(private loggerService: LoggerService, private apiLogger: ApiLoggerService) {}

  ngOnInit(): void {
    this.logsSubscription = this.loggerService.logs$.subscribe(logs => {
      this.processLogs(logs);
    });
    
    this.backendLogsSubscription = this.apiLogger.backendLogs$.subscribe(backendLogs => {
      this.processBackendLogs(backendLogs);
    });
    
    // Initialize section states based on log entries
    this.initExpandedSections();
  }

  ngOnDestroy(): void {
    if (this.logsSubscription) {
      this.logsSubscription.unsubscribe();
    }
    if (this.backendLogsSubscription) {
      this.backendLogsSubscription.unsubscribe();
    }
  }

  private processLogs(logs: string[]): void {
    this.logs = { error: {}, warn: {}, info: {}, log: {}, general: {} }; // Reset logs

    logs.forEach(log => {
      const match = log.match(/\[(.*?)\]\s(.*?):\s\((.*?)\)\s(.*)/);
      if (match) {
        const rawTime = match[1];
        const date = new Date(rawTime);
        const numericTimestamp = date.getTime();
        const timestamp = isNaN(numericTimestamp) ? 'Invalid Date' : date.toLocaleString();
        let level = match[2].toLowerCase();
        const user = match[3]; // Extract user
        let message = match[4];
        
        // Handle console.log style formatting with %c
        message = this.processConsoleFormatting(message);

        // Split message into description and data (if delimiter " - " exists)
        let description = message;
        let data = '';
        if (message.includes(' - ')) {
          const parts = message.split(' - ');
          description = parts[0];
          data = parts.slice(1).join(' - ');
          
          // Try to parse JSON data if it looks like JSON
          try {
            if (data.startsWith('{') && data.endsWith('}')) {
              const jsonData = JSON.parse(data);
              data = JSON.stringify(jsonData, null, 2);
            }
          } catch (e) {
            // Not valid JSON, keep as is
          }
        }
        
        // Enhanced error parsing
        if (level === 'error') {
          const errorParts = description.split(': ');
          if (errorParts.length > 1) {
            description = errorParts[0];
            data = errorParts.slice(1).join(': ');
          }
        }
        
        const logEntry: LogEntry = { 
          timestamp, 
          numericTimestamp,
          level, 
          message,
          description,
          data,
          user, // Add user to log entry
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), // Extract date
          time: date.toLocaleTimeString(),  // Extract time
          rawMessage: match[4],
          source: 'frontend'
        };
        
        // Map certain log levels to our standard categories
        let targetLevel = level.toLowerCase();
        if (targetLevel === 'debug') targetLevel = 'log';
        if (targetLevel === 'highlight' || targetLevel === 'system') {
          targetLevel = 'log'; // Route system messages to general logs
        }
        
        // Route specific initialization messages to general logs
        if (
          description.includes('User activity tracking initialized') ||
          description.includes('UserStateService initialized') ||
          description.includes('Admin component initialized')
        ) {
          targetLevel = 'log';
        }
        
        // Detect log properties and categorize as general if needed
        this.detectLogProperties(logEntry);

        // Force certain messages into 'general' category
        if (message.toLowerCase().includes('initialized') || message.toLowerCase().includes('connected to backend')) {
          targetLevel = 'general';
        }

        if (!this.logs[targetLevel]) {
          this.logs[targetLevel] = {};
        }

        if (!this.logs[targetLevel][logEntry.date!]) {
          this.logs[targetLevel][logEntry.date!] = [];
        }
        
        this.logs[targetLevel][logEntry.date!].push(logEntry);
      } else {
        const now = new Date();
        const logEntry: LogEntry = { 
          timestamp: now.toLocaleString(),
          numericTimestamp: now.getTime(),
          level: 'info', 
          message: log,
          description: log,
          data: '',
          user: 'system', // Default to system for unmatched logs
          date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), // Extract date
          time: now.toLocaleTimeString(), // Extract time
          rawMessage: log,
          source: 'frontend'
        };
        
        if (!this.logs['info']) {
          this.logs['info'] = {};
        }

        if (!this.logs['info'][logEntry.date!]) {
          this.logs['info'][logEntry.date!] = [];
        }
        
        this.logs['info'][logEntry.date!].push(logEntry);
      }
    });

    // Sort each category based on its current sort order
    Object.keys(this.logs).forEach(category => {
      Object.keys(this.logs[category]).forEach(date => {
        if (this.sortOrder[category] === 'asc') {
          this.logs[category][date].sort((a, b) => a.numericTimestamp - b.numericTimestamp);
        } else {
          this.logs[category][date].sort((a, b) => b.numericTimestamp - a.numericTimestamp);
        }
      });
    });
  }
  
  private processBackendLogs(backendLogs: any[]): void {
    backendLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const logEntry: LogEntry = {
        timestamp: date.toLocaleString(),
        numericTimestamp: date.getTime(),
        level: log.level.toLowerCase(),
        message: log.message,
        description: log.message,
        data: log.metadata ? JSON.stringify(log.metadata, null, 2) : '',
        user: 'system',
        date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: date.toLocaleTimeString(),
        source: 'backend'
      };

      // Detect log properties and categorize as general if needed
      this.detectLogProperties(logEntry);

      let targetLevel = logEntry.level;
      if (targetLevel === 'debug') targetLevel = 'log';

      if (!this.logs[targetLevel]) {
        this.logs[targetLevel] = {};
      }

      if (!this.logs[targetLevel][logEntry.date!]) {
        this.logs[targetLevel][logEntry.date!] = [];
      }

      this.logs[targetLevel][logEntry.date!].push(logEntry);
    });
  }

  /**
   * Process console.log style formatting with %c markers
   * For example: "%cLOGGER: %cUser activity tracking initialized"
   */
  private processConsoleFormatting(message: string): string {
    // First, check if we have %c markers
    if (message.includes('%c')) {
      // Simple replacement for common patterns
      if (message.startsWith('%cLOGGER: %c')) {
        return message.replace('%cLOGGER: %c', '');
      }
      
      // General case: remove all %c markers
      return message.replace(/%c/g, '');
    }
    
    return message;
  }

  /**
   * Format timestamp to a human-readable date-time format with debugging
   */
  private formatTimestamp(timestamp: string): string {
    console.debug('formatTimestamp input:', timestamp);
    const date = new Date(timestamp);
    console.debug('formatTimestamp computed date:', date);
    if (isNaN(date.getTime())) {
      debugger; // Debugger breakpoint for investigation of invalid date
      console.error('Invalid date produced from timestamp:', timestamp, date);
      return 'Invalid Date';
    }
    return date.toLocaleString();
  }

  toggleSort(level: string): void {
    this.sortOrder[level] = this.sortOrder[level] === 'asc' ? 'desc' : 'asc';
    if (this.logs[level]) {
      Object.keys(this.logs[level]).forEach(date => {
        this.logs[level][date].sort((a, b) => this.sortOrder[level] === 'asc' ? 
          a.numericTimestamp - b.numericTimestamp : b.numericTimestamp - a.numericTimestamp);
      });
    }
  }
  
  private initExpandedSections(): void {
    // Auto-expand sections that have log entries
    Object.keys(this.logs).forEach(logType => {
      this.expandedSections[logType] = Object.keys(this.logs[logType]).length > 0;
    });
  }
  
  // Toggle section expansion
  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  /**
   * Helper method to get the keys of an object
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  /**
   * Helper method to get the number of logs for a given level
   */
  getLogCount(level: string): number {
    let count = 0;
    for (const date in this.logs[level]) {
      if (this.logs[level].hasOwnProperty(date)) {
        count += this.logs[level][date].length;
      }
    }
    return count;
  }

  /**
   * Detect log properties and categorize as general if needed
   */
  private detectLogProperties(logEntry: any): any {
    const message: string = logEntry.message || '';
    const level: string = logEntry.level || 'info';

    // New check for initialization (i.e., 'initialized')
    if (message.includes('initialized')) {
      logEntry.level = 'general';
    }

    return logEntry;
  }
}
