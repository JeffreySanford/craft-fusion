import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { LoggerService, LogEntry, LogLevel, LogLevelInfo } from '../../../common/services/logger.service';
import { ThemeService } from '../../../common/services/theme.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiLoggerService } from '../../../common/services/api-logger.service';
import { PerformanceMetricsService } from '../../../common/services/performance-metrics.service';
import { LoggerHelperService } from '../../../common/services/logger-helper.service';

interface LogCategory {
  name: string;
  count: number;
  color: string;
  icon: string;
  entries: LogEntry[];
}

interface MetricsSnapshot {
  apiCalls: number;
  avgResponseTime: number;
  errorRate: number;
  highestLatency: number;
  slowestEndpoints: {endpoint: string, avgTime: number}[];
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,  // IMPORTANT: This app uses the traditional module-based approach, not standalone components

})
export class LogsComponent implements OnInit, OnDestroy {
  themeClass = '';
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  categories: LogCategory[] = [];
  
  // View control
  viewAsTiles = false;
  searchTerm = '';
  selectedLevel: string | null = null;
  selectedCategory: string | null = null;
  
  // Log level mappings for UI
  logLevels = [
    { value: LogLevel.ERROR, label: 'Error', icon: 'error', color: '#FF6384' },
    { value: LogLevel.WARNING, label: 'Warning', icon: 'warning', color: '#FFCE56' },
    { value: LogLevel.INFO, label: 'Info', icon: 'info', color: '#36A2EB' },
    { value: LogLevel.DEBUG, label: 'Debug', icon: 'code', color: '#4BC0C0' },
    { value: LogLevel.PERFORMANCE, label: 'Performance', icon: 'speed', color: '#9966FF' }
  ];
  
  // Default category colors and icons
  private defaultCategoryStyles = [
    { color: '#FF6384', icon: 'security' }, // Security
    { color: '#36A2EB', icon: 'api' }, // API
    { color: '#4BC0C0', icon: 'storage' }, // Database
    { color: '#FFCE56', icon: 'account_circle' }, // User
    { color: '#9966FF', icon: 'devices' }, // System
    { color: '#FF9F40', icon: 'memory' }, // Performance
    { color: '#8884D8', icon: 'notifications' }, // Notifications
    { color: '#82CA9D', icon: 'construction' }, // Core
    { color: '#A4DE79', icon: 'public' }, // Network
  ];
  
  private destroy$ = new Subject<void>();

  // Metrics data
  metricsSnapshot: MetricsSnapshot = {
    apiCalls: 0,
    avgResponseTime: 0,
    errorRate: 0,
    highestLatency: 0,
    slowestEndpoints: []
  };
  
  // View modes
  displayMode: 'all' | 'logs' | 'metrics' | 'api' = 'all';
  
  // Add filter for performance metrics
  showPerformanceMetrics = true;
  showApiLogs = true;
  
  // API response time thresholds for visualization
  responseTimeThresholds = {
    good: 200,    // < 200ms is good
    medium: 500,   // < 500ms is medium
    poor: 1000     // > 1000ms is poor
  };

  constructor(
    private loggerService: LoggerService,
    private themeService: ThemeService,
    private apiLoggerService: ApiLoggerService,
    private performanceMetricsService: PerformanceMetricsService,
    private cdRef: ChangeDetectorRef,
    private loggerHelper: LoggerHelperService
  ) {
    this.loggerService.registerService('LogsComponent');
  }

  ngOnInit(): void {
    this.loggerService.info('Logs component initialized');
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });
    
    // Subscribe to multiple data sources
    combineLatest([
      this.loggerService.logs$,
      this.apiLoggerService.summary$,
      this.performanceMetricsService.apiPerformance$
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([logs, apiSummary, performanceSummary]) => {
      // Process general logs
      this.logs = [...logs];
      
      // Update metrics snapshot
      this.metricsSnapshot = {
        apiCalls: apiSummary.totalCalls,
        avgResponseTime: apiSummary.avgResponseTime,
        errorRate: apiSummary.errorRate,
        highestLatency: apiSummary.maxResponseTime,
        slowestEndpoints: apiSummary.slowestEndpoints || []
      };
      
      // Add performance metrics to log display if they're not already included
      this.enhanceLogsWithMetrics();
      
      // Apply filters
      this.applyFilters();
      this.buildCategories();
    });
    
    // Generate sample logs if none exist
    if (this.logs.length === 0) {
      setTimeout(() => {
        this.generateSampleLogs();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleView(): void {
    this.viewAsTiles = !this.viewAsTiles;
  }

  applyFilters(): void {
    let filtered = [...this.logs];
    const searchTerm = this.searchTerm?.toLowerCase() || '';
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        (log.message && log.message.toLowerCase().includes(searchTerm)) ||
        (log.category && log.category.toLowerCase().includes(searchTerm)) ||
        (log.source && log.source.toLowerCase().includes(searchTerm)) ||
        (log.content && typeof log.content === 'string' && log.content.toLowerCase().includes(searchTerm)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply level filter
    if (this.selectedLevel) {
      // If it's a string that can be parsed as a number, convert it
      if (!isNaN(Number(this.selectedLevel))) {
        const levelNum = parseInt(this.selectedLevel as string, 10);
        filtered = filtered.filter(log => this.getLogLevelValue(log.level) === levelNum);
      } else {
        // Just compare string to string
        filtered = filtered.filter(log => log.level === this.selectedLevel);
      }
    }
    
    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(log => log.category === this.selectedCategory);
    }
    
    // Filter performance metrics vs regular logs
    if (!this.showPerformanceMetrics) {
      filtered = filtered.filter(log => log.level !== 'performance');
    }
    
    // Filter API logs
    if (!this.showApiLogs) {
      filtered = filtered.filter(log => !log.category || !log.category.toLowerCase().includes('api'));
    }
    
    this.filteredLogs = filtered;
  }

  private getLogLevelValue(level: string): number {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARNING;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      case 'performance': return LogLevel.PERFORMANCE;
      default: return LogLevel.INFO;
    }
  }
  
  buildCategories(): void {
    // Reset categories
    this.categories = [];
    
    // Group logs by category
    const categoryMap = new Map<string, LogEntry[]>();
    
    this.filteredLogs.forEach(log => {
      const category = log.category || 'uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)?.push(log);
    });
    
    // Build category objects
    let index = 0;
    categoryMap.forEach((entries, name) => {
      // Get or assign a style for this category
      const style = this.getCategoryStyle(name, index);
      index++;
      this.categories.push({
        name,
        count: entries.length,
        color: style.color,
        icon: style.icon,
        entries
      });
    });
    
    // Sort categories by count (highest first)
    this.categories.sort((a, b) => b.count - a.count);
  }
  
  getCategoryStyle(category: string, index: number): { color: string, icon: string } {
    // Predefined mappings for common categories
    const mappings: {[key: string]: {color: string, icon: string}} = {
      'security': { color: '#FF6384', icon: 'security' },
      'api': { color: '#36A2EB', icon: 'api' },
      'database': { color: '#4BC0C0', icon: 'storage' },
      'user': { color: '#FFCE56', icon: 'person' },
      'system': { color: '#9966FF', icon: 'computer' },
      'performance': { color: '#FF9F40', icon: 'speed' },
      'authentication': { color: '#8884D8', icon: 'lock' },
      'network': { color: '#82CA9D', icon: 'wifi' },
      'uncategorized': { color: '#A9A9A9', icon: 'help' }
    };
    
    // Check if we have a predefined mapping
    for (const key in mappings) {
      if (category.toLowerCase().includes(key)) {
        return mappings[key];
      }
    }
    
    // Otherwise use the default styles in rotation
    return this.defaultCategoryStyles[index % this.defaultCategoryStyles.length];
  }
  
  setLevelFilter(level: number | null): void {
    this.selectedLevel = level !== null ? level.toString() : null;
    this.applyFilters();
    this.buildCategories();
  }
  
  setCategoryFilter(category: string | null): void {
    this.selectedCategory = category;
    this.applyFilters();
    this.buildCategories();
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLevel = null;
    this.selectedCategory = null;
    this.applyFilters();
    this.buildCategories();
  }
  
  setDisplayMode(mode: 'all' | 'logs' | 'metrics' | 'api'): void {
    this.displayMode = mode;
    this.applyFilters();
    this.buildCategories();
  }
  
  togglePerformanceMetrics(): void {
    this.showPerformanceMetrics = !this.showPerformanceMetrics;
    this.applyFilters();
    this.buildCategories();
  }
  
  toggleApiLogs(): void {
    this.showApiLogs = !this.showApiLogs;
    this.applyFilters();
    this.buildCategories();
  }
  
  getResponseTimeClass(time: number): string {
    if (time < this.responseTimeThresholds.good) return 'response-good';
    if (time < this.responseTimeThresholds.medium) return 'response-medium';
    if (time < this.responseTimeThresholds.poor) return 'response-poor';
    return 'response-critical';
  }
  
  getPerformanceValueClass(metric: { name: string, value: any, unit?: string }): string {
    // Make sure value is a number, or return empty class
    if (typeof metric.value !== 'number') {
      return '';
    }
    
    const value = metric.value;
    const name = metric.name.toLowerCase();
    
    // CPU load metrics
    if (name.includes('cpu') || name.includes('processor')) {
      if (value > 80) return 'value-critical';
      if (value > 60) return 'value-warning';
      return 'value-good';
    }
    
    // Memory usage metrics
    if (name.includes('memory') || name.includes('ram')) {
      if (value > 85) return 'value-critical';
      if (value > 70) return 'value-warning';
      return 'value-good';
    }
    
    // Response time metrics
    if (name.includes('time') || name.includes('latency') || name.includes('duration')) {
      if (value > 500) return 'value-critical';
      if (value > 200) return 'value-warning';
      return 'value-good';
    }
    
    // Default behavior based just on magnitude
    if (value > 90) return 'value-critical';
    if (value > 70) return 'value-warning';
    return 'value-normal';
  }

  getLogLevelInfo(level: LogLevel): {label: string, icon: string, color: string} {
    const levelInfo = this.logLevels.find(l => l.value === level);
    return levelInfo || { label: 'Unknown', icon: 'help', color: '#A9A9A9' };
  }

  /**
   * Get log level info for a string level
   */
  getLogLevelInfoForString(level: string): LogLevelInfo {
    // Convert string level to LogLevel enum
    let logLevel: LogLevel;
    
    switch(level.toLowerCase()) {
      case 'error': logLevel = LogLevel.ERROR; break;
      case 'warn': logLevel = LogLevel.WARNING; break;
      case 'info': logLevel = LogLevel.INFO; break;
      case 'debug': logLevel = LogLevel.DEBUG; break;
      case 'performance': logLevel = LogLevel.PERFORMANCE; break;
      default: logLevel = LogLevel.INFO; // default
    }
    
    return this.loggerService.getLogLevelInfo(logLevel);
  }

  refreshLogs(): void {
    // In a real app, this might trigger a re-fetch of logs
    this.loggerService.clearLogs();
    this.generateSampleLogs();
  }
  
  formatTimeAgo(timestamp: Date | number): string {
    return this.loggerHelper.formatTimeAgo(timestamp);
  }
  
  private enhanceLogsWithMetrics(): void {
    // Find API logs that have corresponding metrics
    const apiLogs = this.logs.filter(log => 
      log.category?.toLowerCase().includes('api') || 
      log.source?.toLowerCase().includes('api') ||
      log.message?.toLowerCase().includes('api')
    );
    
    // If we have API logs but they don't have metrics attached, enhance them
    apiLogs.forEach(log => {
      if (!log.metrics && log.content) {
        try {
          const content = log.content;
          if (typeof content === 'object' && content.responseTime) {
            // Create metrics entry for this API log
            log.metrics = [
              { name: 'Response Time', value: content.responseTime, unit: 'ms' }
            ];
            // Add status code if available
            if (content.status) {
              log.metrics.push({ name: 'Status', value: content.status, unit: '' });
            }
          }
        } catch (e) {
          // Unable to parse metrics, ignore
        }
      }
    });
  }
  
  private logMatchesSearch(log: LogEntry, term: string): boolean {
    return (
      (log.message && log.message.toLowerCase().includes(term)) ||
      (log.category && log.category.toLowerCase().includes(term)) ||
      (log.source && log.source.toLowerCase().includes(term)) ||
      // Use optional chaining to avoid errors when content is undefined
      (log.content && typeof log.content === 'string' && log.content.toLowerCase().includes(term)) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(term))
    );
  }

  private generateSampleLogs(): void {
    const categories = ['security', 'api', 'database', 'user', 'system', 'performance'];
    const levels = [LogLevel.ERROR, LogLevel.WARNING, LogLevel.INFO, LogLevel.DEBUG, LogLevel.PERFORMANCE];
    const messages = [
      'User login successful',
      'Failed database connection',
      'API request completed',
      'System startup complete',
      'Security scan initiated',
      'Performance metrics collected',
      'User session expired',
      'Data export completed',
      'Configuration updated',
      'Cache cleared'
    ];
    
    // Generate 20 sample logs
    for (let i = 0; i < 20; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Create timestamp within the last 24 hours
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 24 * 60));
      
      if (level === LogLevel.ERROR) {
        this.loggerService.error(message, { 
          category,
          timestamp,
          source: 'SampleGenerator',
          details: { sampleData: true, id: i }
        });
      } else if (level === LogLevel.WARNING) {
        this.loggerService.warn(message, { 
          category,
          timestamp,
          source: 'SampleGenerator',
          details: { sampleData: true, id: i }
        });
      } else if (level === LogLevel.PERFORMANCE) {
        this.loggerService.performance(message, [
          { name: 'CPU', value: Math.random() * 100, unit: '%' },
          { name: 'Memory', value: Math.random() * 100, unit: '%' }
        ], { 
          category,
          timestamp,
          source: 'SampleGenerator',
          details: { sampleData: true, id: i }
        });
      } else if (level === LogLevel.DEBUG) {
        this.loggerService.debug(message, { 
          category,
          timestamp,
          source: 'SampleGenerator',
          details: { sampleData: true, id: i }
        });
      } else {
        this.loggerService.info(message, { 
          category,
          timestamp,
          source: 'SampleGenerator',
          details: { sampleData: true, id: i }
        });
      }
    }
  }

  generateSampleMetrics(category: string): void {
    this.loggerService.performance('Sample metrics generated', [
      { name: 'CPU Load', value: Math.round(Math.random() * 100), unit: '%' },
      { name: 'Memory Usage', value: Math.round(Math.random() * 100), unit: '%' },
      { name: 'Response Time', value: Math.round(Math.random() * 800), unit: 'ms' }
    ], {
      category,
      source: 'LogsComponent',
      details: { sampleData: true, id: Math.random() }
    });
  }
}
