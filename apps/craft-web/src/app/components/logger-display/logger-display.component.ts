import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { LoggerService, LogEntry, LogLevel } from '../../common/services/logger.service';

@Component({
  selector: 'app-logger-display',
  templateUrl: './logger-display.component.html',
  styleUrls: ['./logger-display.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ]
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
    
    const level = this.logFilter as LogLevel;
    return this.logs.filter(log => log.level === level);
  }
  
  getLogClass(log: LogEntry): string {
    switch (log.level) {
      case 'error':
        return 'error-log';
      case 'warn':
        return 'warn-log';
      case 'info':
        return 'info-log';
      case 'debug':
        return 'debug-log';
      default:
        return '';
    }
  }
  
  getLogIcon(log: LogEntry): string {
    switch (log.level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
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
}
