import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { LoggerService, LogEntry, LogLevel } from '../../../common/services/logger.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  standalone: false
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  filterForm: FormGroup;
  
  displayedColumns: string[] = ['timestamp', 'level', 'component', 'message', 'details'];
  
  // Filter options
  logLevels = [
    { value: LogLevel.DEBUG, viewValue: 'Debug' },
    { value: LogLevel.INFO, viewValue: 'Info' },
    { value: LogLevel.WARN, viewValue: 'Warning' },
    { value: LogLevel.ERROR, viewValue: 'Error' }
  ];
  
  componentOptions: string[] = [];
  refreshSubscription?: Subscription;
  autoRefresh = true;
  
  constructor(
    private loggerService: LoggerService,
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
    this.fetchLogs();
    
    // Set up auto refresh
    this.refreshSubscription = interval(5000).subscribe(() => {
      if (this.autoRefresh) {
        this.fetchLogs();
      }
    });
    
    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.autoRefresh = this.filterForm.get('autoRefresh')?.value;
      this.applyFilters();
    });
    
    this.loggerService.logAdded$.subscribe(() => {
      if (this.autoRefresh) {
        this.fetchLogs();
      }
    });
  }
  
  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  fetchLogs() {
    this.logs = this.loggerService.getLogs();
    this.updateComponentOptions();
    this.applyFilters();
  }
  
  updateComponentOptions() {
    // Extract unique component names
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
      // Apply level filter
      if (filters.level && log.level !== filters.level) {
        return false;
      }
      
      // Apply component filter
      if (filters.component && log.component !== filters.component) {
        return false;
      }
      
      // Apply message filter
      if (filters.message && 
          !log.message.toLowerCase().includes(filters.message.toLowerCase())) {
        return false;
      }
      
      // Apply date filters
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (log.timestamp < startDate) {
          return false;
        }
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (log.timestamp > endDate) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by timestamp descending (newest first)
    this.filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
  }
  
  clearLogs() {
    this.loggerService.clearLogs();
    this.fetchLogs();
  }
  
  formatDetails(details: any): string {
    if (!details) return '';
    try {
      return JSON.stringify(details, null, 2);
    } catch (error) {
      return String(details);
    }
  }
}
