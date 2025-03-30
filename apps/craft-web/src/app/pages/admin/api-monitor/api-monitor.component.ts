import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiLoggerService, ApiLogEntry } from '../../../common/services/api-logger.service';
import { ThemeService } from '../../../common/services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../common/services/notification.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-api-monitor',
  templateUrl: './api-monitor.component.html',
  styleUrls: ['./api-monitor.component.scss'],
  standalone: false
})
export class ApiMonitorComponent implements OnInit, OnDestroy {
  themeClass = '';
  apiLogs: ApiLogEntry[] = [];
  filteredLogs: ApiLogEntry[] = [];
  selectedApiCall: ApiLogEntry | null = null;
  searchTerm = '';
  
  // Display options
  showSuccessRequests = true;
  showErrorRequests = true;
  showWarningRequests = true;
  sortNewestFirst = true;
  
  // Stats
  totalRequests = 0;
  successfulRequests = 0;
  failedRequests = 0;
  averageResponseTime = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private apiLoggerService: ApiLoggerService,
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private http: HttpClient // Add HttpClient for making test API calls
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });

    // Get existing logs
    this.refreshLogs();
    
    // Subscribe to new logs
    this.apiLoggerService.getLogStream()
      .pipe(takeUntil(this.destroy$))
      .subscribe(log => {
        this.apiLogs.unshift(log); // Add to beginning
        this.applyFilters();
        this.updateStats();
      });
      
    // Make sure we have some API logs - make real API calls if needed
    setTimeout(() => {
      if (this.apiLogs.length === 0) {
        this.triggerRealApiCalls();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  refreshLogs(): void {
    this.apiLogs = this.apiLoggerService.getLogs();
    this.applyFilters();
    this.updateStats();
  }

  clearLogs(): void {
    this.apiLoggerService.clearLogs();
    this.apiLogs = [];
    this.filteredLogs = [];
    this.selectedApiCall = null;
    this.updateStats();
    this.notificationService.showSuccess('API logs cleared', 'Success');
  }

  viewApiCallDetails(log: ApiLogEntry): void {
    this.selectedApiCall = log;
  }

  closeDetails(): void {
    this.selectedApiCall = null;
  }

  applyFilters(): void {
    let filtered = [...this.apiLogs];
    
    // Apply status filters
    filtered = filtered.filter(log => {
      const status = log.response?.status || 0;
      
      if (status >= 400 && !this.showErrorRequests) return false;
      if (status >= 300 && status < 400 && !this.showWarningRequests) return false;
      if (status >= 200 && status < 300 && !this.showSuccessRequests) return false;
      
      return true;
    });
    
    // Apply search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.request.url.toLowerCase().includes(term) || 
        log.request.method.toLowerCase().includes(term)
      );
    }
    
    // Apply sort
    if (this.sortNewestFirst) {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    this.filteredLogs = filtered;
  }

  updateStats(): void {
    this.totalRequests = this.apiLogs.length;
    
    this.successfulRequests = this.apiLogs.filter(log => {
      const status = log.response?.status || 0;
      return status >= 200 && status < 300;
    }).length;
    
    this.failedRequests = this.apiLogs.filter(log => {
      const status = log.response?.status || 0;
      return status >= 400;
    }).length;
    
    // Calculate average response time
    const totalTime = this.apiLogs.reduce((sum, log) => sum + log.responseTime, 0);
    this.averageResponseTime = this.apiLogs.length > 0 
      ? Math.round(totalTime / this.apiLogs.length * 10) / 10 
      : 0;
  }
  
  toggleFilter(filter: 'success' | 'warning' | 'error'): void {
    if (filter === 'success') {
      this.showSuccessRequests = !this.showSuccessRequests;
    } else if (filter === 'warning') {
      this.showWarningRequests = !this.showWarningRequests;
    } else if (filter === 'error') {
      this.showErrorRequests = !this.showErrorRequests;
    }
    
    this.applyFilters();
  }
  
  toggleSort(): void {
    this.sortNewestFirst = !this.sortNewestFirst;
    this.applyFilters();
  }
  
  getStatusClass(status: number | undefined): string {
    if (!status) return 'status-unknown';
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-warning';
    return 'status-error';
  }
  
  formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} sec ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  formatJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Trigger real API calls to generate log entries
   * Changed from private to public to be accessible from the template
   */
  public triggerRealApiCalls(): void {
    // Make some sample API requests to generate real logs through the interceptor
    this.http.get('/api/users').subscribe({
      next: (response) => console.log('Users API call successful'),
      error: (err) => console.log('Users API call failed, but still logged')
    });

    this.http.get('/api/dashboard/stats').subscribe({
      next: (response) => console.log('Dashboard stats API call successful'),
      error: (err) => console.log('Dashboard stats API call failed, but still logged')
    });
    
    // Try a POST request too
    this.http.post('/api/events', {
      name: 'api-monitor-initialized',
      timestamp: new Date()
    }).subscribe({
      next: (response) => console.log('POST API call successful'),
      error: (err) => console.log('POST API call failed, but still logged')
    });
    
    // No more need for mock data
    this.notificationService.showSuccess('Making real API calls to populate monitor', 'API Monitor');
  }

  /**
   * Generate sample data only if we can't get real API calls
   * Changed from private to public to be accessible from template
   */
  public generateSampleLogs(): void {
    // First try making real API calls
    this.triggerRealApiCalls();
    
    // If we still don't have any logs after a short delay, then use mock data
    setTimeout(() => {
      if (this.apiLogs.length === 0) {
        // Generate some example API calls
        const urls = [
          '/api/users',
          '/api/products',
          '/api/orders',
          '/api/auth/login',
          '/api/settings',
          '/api/dashboard/stats'
        ];
        
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];
        
        // Generate 10 random API calls with varying statuses
        for (let i = 0; i < 10; i++) {
          const url = urls[Math.floor(Math.random() * urls.length)];
          const method = methods[Math.floor(Math.random() * methods.length)];
          
          // Create a log entry with "realistic" timestamps spaced out over last hour
          const log = this.apiLoggerService.generateMockLog(url, method);
          log.timestamp = Date.now() - (i * Math.floor(Math.random() * 360000)); // Up to 1 hour ago
          
          // Add to service and local array
          this.apiLogs.push(log);
        }
        
        // Sort and update
        this.applyFilters();
        this.updateStats();
        
        this.notificationService.showSuccess('Using sample data - no real API calls detected', 'API Monitor');
      }
    }, 2000);
  }
}
