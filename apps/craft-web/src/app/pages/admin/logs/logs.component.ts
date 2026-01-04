import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LogEntry, LogLevel } from '../../../common/services/logger.service';
import { LogBridgeService } from './log-bridge.service';

interface SummaryTile {
  label: string;
  value: number;
  meta: string;
  variant: 'error' | 'warn' | 'info' | 'debug';
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],

  standalone: false,
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  filterForm: FormGroup;

  displayedColumns: string[] = ['timestamp', 'level', 'component', 'message', 'details'];

  logLevels = [
    { value: LogLevel.DEBUG, viewValue: 'Debug' },
    { value: LogLevel.INFO, viewValue: 'Info' },
    { value: LogLevel.WARN, viewValue: 'Warning' },
    { value: LogLevel.ERROR, viewValue: 'Error' }
  ];
  componentOptions: string[] = [];
  autoRefresh = true;
  summaryTiles: SummaryTile[] = [];

  private logsSubscription?: Subscription;
  private filterSubscription?: Subscription;

  constructor(
    private logBridge: LogBridgeService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      level: [''],
      component: [''],
      message: [''],
      startDate: [''],
      endDate: [''],
      autoRefresh: [true]
    });
  }

  ngOnInit() {
    this.filterSubscription = this.filterForm.valueChanges.subscribe(() => {
      this.autoRefresh = Boolean(this.filterForm.get('autoRefresh')?.value);
      this.applyFilters();
    });

    this.logBridge.startMonitoring();
    this.logsSubscription = this.logBridge.logs$.subscribe(logs => {
      this.logs = logs;
      this.updateComponentOptions();
      if (this.autoRefresh) {
        this.applyFilters();
      }
    });
  }

  ngOnDestroy() {
    this.logsSubscription?.unsubscribe();
    this.filterSubscription?.unsubscribe();
    this.logBridge.stopMonitoring();
  }

  fetchLogs() {
    this.logBridge.refresh();
    this.applyFilters();
  }

  updateComponentOptions() {
    const componentSet = new Set<string>();
    this.logs.forEach(log => {
      if (log.component) {
        componentSet.add(log.component);
      }
    });
    this.componentOptions = Array.from(componentSet);
  }

  applyFilters() {
    const filters = this.filterForm.value;

    this.filteredLogs = this.logs.filter(log => {
      if (filters.level && log.level !== filters.level) {
        return false;
      }

      if (filters.component && log.component !== filters.component) {
        return false;
      }

      if (filters.message &&
          !log.message.toLowerCase().includes(filters.message.toLowerCase())) {
        return false;
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (log.timestamp < startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (log.timestamp > endDate) {
          return false;
        }
      }

      return true;
    });

    this.filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    this.updateLogSummary(this.filteredLogs);
  }

  clearFilters() {
    this.filterForm.patchValue({
      level: '',
      component: '',
      message: '',
      startDate: '',
      endDate: ''
    });
  }

  getLevelClass(level: LogLevel): string {
    return this.getLogLevelClass(level);
  }

  getLogLevelClass(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'log-level-debug';
      case LogLevel.INFO: return 'log-level-info';
      case LogLevel.WARN: return 'log-level-warn';
      case LogLevel.ERROR: return 'log-level-error';
      default: return '';
    }
  }

  getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARNING';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    this.filterForm.patchValue({ autoRefresh: this.autoRefresh }, { emitEvent: false });
    this.applyFilters();
  }

  clearLogs() {
    this.logBridge.clear();
    this.logs = [];
    this.filteredLogs = [];
    this.summaryTiles = [];
    this.componentOptions = [];
    this.filterForm.patchValue({
      level: '',
      component: '',
      message: '',
      startDate: '',
      endDate: ''
    }, { emitEvent: false });
  }

  formatDetails(details: unknown): string {
    if (!details) return '';
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  }

  private updateLogSummary(logs: LogEntry[]) {
    const counts = logs.reduce(
      (acc, log) => {
        switch (log.level) {
          case LogLevel.ERROR:
            acc.error += 1;
            break;
          case LogLevel.WARN:
            acc.warn += 1;
            break;
          case LogLevel.INFO:
            acc.info += 1;
            break;
          case LogLevel.DEBUG:
            acc.debug += 1;
            break;
        }
        return acc;
      },
      { error: 0, warn: 0, info: 0, debug: 0 }
    );
    this.summaryTiles = [
      { label: 'Errors', value: counts.error, meta: 'Critical issues', variant: 'error' },
      { label: 'Warnings', value: counts.warn, meta: 'Needs attention', variant: 'warn' },
      { label: 'Info', value: counts.info, meta: 'System chatter', variant: 'info' },
      { label: 'Debug', value: counts.debug, meta: 'Development traces', variant: 'debug' },
    ];
  }
}
