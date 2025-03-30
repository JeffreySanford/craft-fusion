import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';
import { ApiService } from './api.service';
import { UserTrackingService } from './user-tracking.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { UserFacadeService } from '../facades/user-facade.service';
import { AuthenticationService } from './authentication.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {
  constructor(
    private logger: LoggerService,
    private apiService: ApiService,
    private userTrackingService: UserTrackingService,
    private performanceMetricsService: PerformanceMetricsService,
    private userFacade: UserFacadeService,
    private authService: AuthenticationService,
    private http: HttpClient,
    private notification: NotificationService
  ) {
    this.logger.registerService('AppInitializationService');
  }

  /**
   * Initialize application - called by APP_INITIALIZER
   */
  initializeApp(): Observable<boolean> {
    this.logger.info('Initializing application', {
      startupTime: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer || 'direct'
    });
    
    // Log detailed application startup information
    this.logApplicationStartup();
    
    // Start performance metrics tracking
    this.performanceMetricsService.startMetricsSimulation();
    this.performanceMetricsService.startFramerateSampling();
    
    // Check API server status
    return this.checkApiStatus();
  }

  /**
   * Log detailed application startup information
   */
  private logApplicationStartup(): void {
    // Get authentication status
    const hasToken = !!this.authService.getAccessToken();

    this.logger.info('Application startup', {
      authenticated: hasToken,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Log performance metrics
    if (window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domComplete - perfData.domLoading;

      this.logger.info('Application performance metrics', {
        pageLoadTime: `${pageLoadTime}ms`,
        domReadyTime: `${domReadyTime}ms`,
        timestamp: new Date()
      });
    }

    // Check if this is the first visit
    const isFirstVisit = !localStorage.getItem('app_visited');
    if (isFirstVisit) {
      localStorage.setItem('app_visited', 'true');
      this.logger.info('First application visit detected', {
        timestamp: new Date()
      });
      
      // Can perform first-visit specific actions here
    }
    
    // Track page load in tracking service
    this.userTrackingService.track({
      type: 'pageView',
      details: { 
        path: window.location.pathname,
        referrer: document.referrer || 'direct'
      }
    });
  }

  /**
   * Check API connectivity
   */
  private checkApiStatus(): Observable<boolean> {
    return this.apiService.checkApiStatus().pipe(
      tap(status => {
        this.logger.info('API status check completed', { 
          status: status.status,
          timestamp: new Date()
        });
        
        if (status.status === 'offline') {
          this.notification.showWarning('Backend server is currently unavailable. Using offline mode.');
        }
      }),
      map(() => true),
      catchError(error => {
        this.logger.error('API status check failed', { 
          error: error.message || 'Unknown error',
          timestamp: new Date()
        });
        // Continue initialization even if API check fails
        return of(true);
      })
    );
  }
}
