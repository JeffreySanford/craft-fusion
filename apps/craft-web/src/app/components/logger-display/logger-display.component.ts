import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoggerService, LogEntry, LogLevel } from '../../common/services/logger.service';

@Component({
  selector: 'app-logger-display',
  templateUrl: './logger-display.component.html',
  styleUrls: ['./logger-display.component.scss'],
  standalone: false // Changed from true to false
})
export class LoggerDisplayComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() logFilter: string = 'all';
  @Input() autoScroll: boolean = true;
  @ViewChild('logContainer') logContainer!: ElementRef;
  
  logs: LogEntry[] = [];
  private logSubscription!: Subscription;
  
  constructor(private logger: LoggerService) {}
  
  ngOnInit(): void {
    // Get existing logs directly as an array
    this.logs = this.logger.getLogs();
    
    // Subscribe to new logs
    this.logSubscription = this.logger.logStream$.subscribe(log => {
      this.logs.push(log);
      
      // Apply auto-scroll if enabled
      if (this.autoScroll) {
        this.scrollToBottom();
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Initial scroll to bottom
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }
  
  ngOnDestroy(): void {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }
  }
  
  filterLogs(): LogEntry[] {
    if (this.logFilter === 'all') {
      return this.logs;
    }
    
    const level = this.logFilter as unknown as LogLevel;
    return this.logs.filter(log => log.level === level);
  }

  formatDetails(details: any): string {
    if (details instanceof Error) {
      return details.message;
    }
    return JSON.stringify(details, null, 2);
  }

  getLogClass(log: LogEntry): string {
    switch (log.level) {
      case LogLevel.ERROR:
        return 'error-log';
      case LogLevel.WARN:
        return 'warn-log';
      case LogLevel.INFO:
        return 'info-log';
      case LogLevel.DEBUG:
        return 'debug-log';
      default:
        return '';
    }
  }
  
  getLogIcon(log: LogEntry): string {
    switch (log.level) {
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.DEBUG:
        return 'code';
      default:
        return 'receipt';
    }
  }
  
  scrollToBottom(): void {
    setTimeout(() => {
      if (this.logContainer && this.logContainer.nativeElement) {
        const container = this.logContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  getLogLevelClass(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'log-level-error';
      case LogLevel.WARN:
        return 'log-level-warn';
      case LogLevel.INFO:
        return 'log-level-info';
      case LogLevel.DEBUG:
      default:
        return 'log-level-debug';
    }
  }

  getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'ERROR';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.DEBUG:
      default:
        return 'DEBUG';
    }
  }
}
