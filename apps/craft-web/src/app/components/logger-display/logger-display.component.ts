import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { LoggerService, LogEntry, LogLevel } from '../../common/services/logger.service';

@Component({
  selector: 'app-logger-display',
  templateUrl: './logger-display.component.html',
  styleUrls: ['./logger-display.component.scss'],
  standalone: false,
})
export class LoggerDisplayComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() logFilter: string = 'all';
  @Input() autoScroll: boolean = true;
  @ViewChild('logContainer') logContainer!: ElementRef;

  logs: LogEntry[] = [];
  logTimes: { [id: string]: string } = {}; // Store pre-computed times
  private logSubscription!: Subscription;
  private timeUpdateSubscription!: Subscription;

  constructor(
    private logger: LoggerService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    // Get existing logs directly as an array
    this.logs = this.logger.getLogs();

    // Pre-compute all time strings
    this.updateAllLogTimes();

    // Subscribe to new logs
    this.logSubscription = this.logger.logStream$.subscribe(log => {
      this.logs.unshift(log); // Add newest logs to the top

      // Pre-compute and store the time string
      const logId = this.getLogId(0, log);
      this.logTimes[logId] = this.computeTimeAgo(log.timestamp);

      // Apply auto-scroll if enabled
      if (this.autoScroll) {
        this.scrollToTop();
      }
    });

    // Start a background timer for updating the "time ago" texts
    // Run outside Angular zone to avoid triggering change detection on each tick
    this.zone.runOutsideAngular(() => {
      this.timeUpdateSubscription = interval(15000).subscribe(() => {
        this.updateAllLogTimes();

        // Only trigger change detection when we update the times
        this.zone.run(() => {
          this.cdr.markForCheck();
        });
      });
    });
  }

  ngAfterViewInit(): void {
    // Initial scroll to top where the newest logs will be
    if (this.autoScroll) {
      this.scrollToTop();
    }
  }

  ngOnDestroy(): void {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }

    if (this.timeUpdateSubscription) {
      this.timeUpdateSubscription.unsubscribe();
    }
  }

  filterLogs(): LogEntry[] {
    if (this.logFilter === 'all') {
      return this.logs;
    }

    const level = this.logFilter as unknown as LogLevel;
    return this.logs.filter(log => log.level === level);
  }

  formatDetails(details: unknown): string {
    if (!details) return '';

    if (details instanceof Error) {
      return details.message;
    }

    try {
      return JSON.stringify(details, null, 2);
    } catch (error) {
      return String(details);
    }
  }

  getLogClass(log: LogEntry): string {
    const baseClass = this.getLogLevelClass(log.level);

    // Add special classes for certain log types
    if (this.isHighlightedLog(log)) {
      return `${baseClass} log-highlighted`;
    }

    if (this.isSecurityLog(log)) {
      return `${baseClass} log-security`;
    }

    if (this.isPerformanceLog(log)) {
      return `${baseClass} log-performance`;
    }

    if (this.isUserLog(log)) {
      return `${baseClass} log-user`;
    }

    if (this.isApiLog(log)) {
      return `${baseClass} log-api`;
    }

    if (this.isUSALog(log)) {
      return `${baseClass} log-usa`;
    }

    return baseClass;
  }

  private isHighlightedLog(log: LogEntry): boolean {
    // Check for highlight markers in message
    return log.message.includes('⭐') || log.message.includes('IMPORTANT') || (log.details as any)?.highlight === true;
  }

  private isSecurityLog(log: LogEntry): boolean {
    const securityTerms = ['auth', 'login', 'password', 'token', 'security', 'permission', 'access'];
    return securityTerms.some(term => log.message.toLowerCase().includes(term) || (log.component && log.component.toLowerCase().includes(term)));
  }

  private isPerformanceLog(log: LogEntry): boolean {
    const perfTerms = ['performance', 'latency', 'speed', 'slow', 'fast', 'metrics', 'benchmark'];
    return perfTerms.some(term => log.message.toLowerCase().includes(term) || ((log.details as any) && JSON.stringify(log.details).toLowerCase().includes(term)));
  }

  private isUserLog(log: LogEntry): boolean {
    const userTerms = ['user', 'account', 'profile', 'logged in', 'logged out', 'signup'];
    return userTerms.some(term => log.message.toLowerCase().includes(term));
  }

  private isApiLog(log: LogEntry): boolean {
    const apiTerms = ['api', 'endpoint', 'request', 'response', 'http', 'service call'];
    return apiTerms.some(term => log.message.toLowerCase().includes(term) || (log.component && log.component.toLowerCase().includes('api'))) || log.message.includes('/api/');
  }

  private isUSALog(log: LogEntry): boolean {
    const usaTerms = ['usa', 'patriotic', 'america', 'united states', 'presidential', 'election'];
    return usaTerms.some(term => log.message.toLowerCase().includes(term));
  }

  getLogIcon(log: LogEntry): string {
    if (this.isSecurityLog(log)) {
      return 'security';
    } else if (this.isHighlightedLog(log)) {
      return 'star';
    } else if (this.isPerformanceLog(log)) {
      return 'speed';
    } else if (this.isUserLog(log)) {
      return 'person';
    } else if (this.isApiLog(log)) {
      return 'api';
    } else if (this.isUSALog(log)) {
      return 'flag';
    }

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

  scrollToTop(): void {
    setTimeout(() => {
      if (this.logContainer && this.logContainer.nativeElement) {
        const container = this.logContainer.nativeElement;
        container.scrollTop = 0;
      }
    }, 10);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.logContainer && this.logContainer.nativeElement) {
        const container = this.logContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 10);
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

  // Updated: Fix trackBy function to generate unique identifiers directly
  getLogId(index: number, log: LogEntry): string {
    return `${log.timestamp.getTime()}_${log.level}_${log.component || 'unknown'}_${log.message.substring(0, 20)}`;
  }

  // Pre-compute all time strings
  private updateAllLogTimes(): void {
    this.logs.forEach(log => {
      const logId = this.getLogId(0, log);
      this.logTimes[logId] = this.computeTimeAgo(log.timestamp);
    });
  }

  // Compute the time ago string
  private computeTimeAgo(timestamp: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    } else {
      return `${Math.floor(seconds / 86400)}d ago`;
    }
  }

  // Updated: Take the whole log object instead of just the timestamp
  getTimeAgo(log: LogEntry): string {
    const logId = this.getLogId(0, log);
    return this.logTimes[logId] || this.computeTimeAgo(log.timestamp);
  }
}
