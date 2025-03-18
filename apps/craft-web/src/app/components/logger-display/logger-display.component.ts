import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '../../common/services/logger.service';
import { Subscription } from 'rxjs';

interface LogEntry {
  timestamp: string;
  numericTimestamp: number; // <-- new field
  level: string;
  message: string;
  description?: string; // <-- new field
  data?: string;        // <-- new field
  rawMessage?: string; // Store the original message
}

@Component({
  selector: 'app-logger-display',
  templateUrl: './logger-display.component.html',
  styleUrls: ['./logger-display.component.scss', '../../../styles/_variables.scss'],
  standalone: false
})
export class LoggerDisplayComponent implements OnInit, OnDestroy {
  logs: { [level: string]: LogEntry[] } = {
    error: [
      { timestamp: '', numericTimestamp: 0, level: 'error', message: 'No logs yet', description: '', data: '' }
    ],
    warn: [
      { timestamp: '', numericTimestamp: 0, level: 'warn', message: 'No logs yet', description: '', data: '' }
    ],
    info: [
      { timestamp: '', numericTimestamp: 0, level: 'info', message: 'No logs yet', description: '', data: '' }
    ],
    log: [
      { timestamp: '', numericTimestamp: 0, level: 'log', message: 'No logs yet', description: '', data: '' }
    ]
  };

  // Add sort order for each category, defaulting to ascending
  sortOrder: { [level: string]: 'asc' | 'desc' } = {
    error: 'asc',
    warn: 'asc',
    info: 'asc',
    log: 'asc'
  };

  private logsSubscription!: Subscription;

  constructor(private loggerService: LoggerService) {}

  ngOnInit(): void {
    this.logsSubscription = this.loggerService.logs$.subscribe(logs => {
      this.processLogs(logs);
    });
  }

  ngOnDestroy(): void {
    if (this.logsSubscription) {
      this.logsSubscription.unsubscribe();
    }
  }

  private processLogs(logs: string[]): void {
    this.logs = { error: [], warn: [], info: [], log: [] }; // Reset logs

    logs.forEach(log => {
      const match = log.match(/\[(.*?)\]\s(.*?):\s(.*)/);
      if (match) {
        const rawTime = match[1];
        const date = new Date(rawTime);
        const numericTimestamp = date.getTime();
        const timestamp = isNaN(numericTimestamp) ? 'Invalid Date' : date.toLocaleString();
        const level = match[2].toLowerCase();
        let message = match[3];
        
        // Handle console.log style formatting with %c
        message = this.processConsoleFormatting(message);

        // Split message into description and data (if delimiter " - " exists)
        let description = message;
        let data = '';
        if (message.includes(' - ')) {
          const parts = message.split(' - ');
          description = parts[0];
          data = parts.slice(1).join(' - ');
        }
        
        const logEntry: LogEntry = { 
          timestamp, 
          numericTimestamp,  // store number version
          level, 
          message,
          description,
          data,
          rawMessage: match[3] // Store the original message for debugging
        };
        
        if (this.logs[level]) {
          this.logs[level].push(logEntry);
        } else {
          this.logs['info'].push(logEntry); // Default to info if level is unknown
        }
      } else {
        const now = new Date();
        const logEntry: LogEntry = { 
          timestamp: now.toLocaleString(),
          numericTimestamp: now.getTime(),
          level: 'info', 
          message: log,
          description: log,
          data: '',
          rawMessage: log
        };
        this.logs['info'].push(logEntry);
      }
    });

    // Sort each category based on its current sort order
    Object.keys(this.logs).forEach(category => {
      if (this.sortOrder[category] === 'asc') {
        this.logs[category].sort((a, b) => a.numericTimestamp - b.numericTimestamp);
      } else {
        this.logs[category].sort((a, b) => b.numericTimestamp - a.numericTimestamp);
      }
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
      this.logs[level].sort((a, b) => this.sortOrder[level] === 'asc' ? 
        a.numericTimestamp - b.numericTimestamp : b.numericTimestamp - a.numericTimestamp);
    }
  }
}
