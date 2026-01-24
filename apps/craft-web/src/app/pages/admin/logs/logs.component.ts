import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogEntry, LogLevel } from '../../../common/services/logger.service';
import { LogBridgeService } from './log-bridge.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  standalone: false,
})
export class LogsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filterLevel: LogLevel | 'ALL' = 'ALL';
  
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];

  displayedColumns: string[] = ['timestamp', 'level', 'component', 'message', 'details'];

  componentOptions: string[] = [];
  autoRefresh = true;

  private logsSubscription?: Subscription;

  constructor(
    private logBridge: LogBridgeService
  ) {}

  ngOnInit() {
    this.logBridge.startMonitoring();
    this.logsSubscription = this.logBridge.logs$.subscribe(logs => {
      this.logs = logs;
      this.updateComponentOptions();
      if (this.autoRefresh) {
        this.applyFilters();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterLevel']) {
      this.applyFilters();
    }
  }

  ngOnDestroy() {
    this.logsSubscription?.unsubscribe();
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
    this.filteredLogs = this.logs
      .filter(log => {
        if (this.filterLevel !== 'ALL' && log.level !== this.filterLevel) {
          return false;
        }
        return true;
      })
      .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getLevelClass(level: LogLevel): string {
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
    this.applyFilters();
  }

  clearLogs() {
    this.logBridge.clear();
    this.logs = [];
    this.filteredLogs = [];
    this.componentOptions = [];
  }

  formatDetails(details: unknown): string {
    if (!details) return '';
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  }
}
