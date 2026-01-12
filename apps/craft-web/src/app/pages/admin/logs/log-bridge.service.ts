import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { auditTime, tap } from 'rxjs/operators';
import { LoggerService, LogEntry } from '../../../common/services/logger.service';

const DEFAULT_THROTTLE_MS = 500;
const MAX_LOG_RECORDS = 500;

@Injectable({
  providedIn: 'root',
})
export class LogBridgeService implements OnDestroy {
  private readonly logsSubject = new BehaviorSubject<LogEntry[]>([]);
  public readonly logs$ = this.logsSubject.asObservable();

  private logSubscription: Subscription | undefined;
  private logBuffer: LogEntry[] = [];
  private isMonitoring = false;

  constructor(
    private readonly ngZone: NgZone,
    private readonly logger: LoggerService,
  ) {}

  startMonitoring(throttleMs = DEFAULT_THROTTLE_MS): void {
    if (this.isMonitoring) {
      return;
    }
    this.isMonitoring = true;
    this.syncWithLogger();

    this.ngZone.runOutsideAngular(() => {
      this.logSubscription = this.logger.logStream$
        .pipe(
          tap((log) => this.enqueueLog(log)),
          auditTime(throttleMs),
        )
        .subscribe(() => this.emitLogs());
    });
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.logSubscription?.unsubscribe();
    this.logSubscription = undefined;
  }

  refresh(): void {
    this.syncWithLogger();
  }

  clear(): void {
    this.logger.clearLogs();
    this.logBuffer = [];
    this.emitLogs();
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  private enqueueLog(log: LogEntry): void {
    this.logBuffer.unshift(log);
    if (this.logBuffer.length > MAX_LOG_RECORDS) {
      this.logBuffer.pop();
    }
  }

  private emitLogs(): void {
    this.ngZone.run(() => {
      this.logsSubject.next([...this.logBuffer]);
    });
  }

  private syncWithLogger(): void {
    this.logBuffer = this.logger.getLogs().slice(0, MAX_LOG_RECORDS);
    this.emitLogs();
  }
}
