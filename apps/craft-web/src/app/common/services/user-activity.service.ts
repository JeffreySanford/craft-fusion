import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserActivity {
  timestamp: number;
  type: 'pageview' | 'click' | 'scroll' | 'input' | 'hover' | 'other';
  target?: string;
  value?: any;
  page?: string;
  position?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserActivityService {
  private userActivities: UserActivity[] = [];
  private sessionStartTime = Date.now();
  private lastActivityTime = Date.now();
  private pageViewDurations: {[page: string]: number} = {};
  private currentPage = '';
  private activeUserCount = Math.floor(Math.random() * 50) + 10; // Simulate 10-60 active users

  constructor(
    private router: Router, 
    private logger: LoggerService
  ) {
    this.initRouterTracking();
    this.initUserInteractionTracking();
    this.startTrackingNavigation(); // Start tracking immediately
    
    this.logger.info('User activity tracking initialized');
  }

  private initRouterTracking(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const now = Date.now();
      
      // Calculate duration for previous page
      if (this.currentPage) {
        this.pageViewDurations[this.currentPage] = 
          (this.pageViewDurations[this.currentPage] || 0) + (now - this.lastActivityTime);
      }
      
      this.lastActivityTime = now;
      this.currentPage = event.urlAfterRedirects;
      
      this.trackActivity('pageview', {
        page: event.urlAfterRedirects
      });
      
      this.logger.info(`User navigated to ${event.urlAfterRedirects}`);
    });
  }
  
  private initUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackActivity('click', {
        target: this.getElementDescription(target),
        page: this.currentPage
      });
    });
    
    // Track scrolls (debounced)
    let scrollTimeout: any;
    document.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        this.trackActivity('scroll', {
          position: window.scrollY,
          page: this.currentPage
        });
      }, 300);
    });
    
    // Track form inputs (debounced)
    let inputTimeout: any;
    document.addEventListener('input', (event) => {
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
      
      inputTimeout = setTimeout(() => {
        const target = event.target as HTMLInputElement;
        this.trackActivity('input', {
          target: this.getElementDescription(target),
          page: this.currentPage
        });
      }, 500);
    });
  }
  
  private getElementDescription(element: HTMLElement): string {
    if (!element) return 'unknown';
    
    // Try to get a useful description of the element
    if (element.id) {
      return `#${element.id}`;
    } else if (element.classList && element.classList.length) {
      return `.${Array.from(element.classList).join('.')}`;
    } else {
      return element.tagName.toLowerCase();
    }
  }
  
  trackActivity(type: UserActivity['type'], details: Partial<UserActivity>): void {
    const activity: UserActivity = {
      timestamp: Date.now(),
      type,
      ...details
    };
    
    this.userActivities.push(activity);
    this.lastActivityTime = activity.timestamp;
    
    // Limit the array size to prevent memory issues
    if (this.userActivities.length > 100) {
      this.userActivities.shift();
    }
  }
  
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }
  
  getPageViewDurations(): {[page: string]: number} {
    // Update the current page duration
    if (this.currentPage) {
      this.pageViewDurations[this.currentPage] = 
        (this.pageViewDurations[this.currentPage] || 0) + (Date.now() - this.lastActivityTime);
      this.lastActivityTime = Date.now();
    }
    
    return this.pageViewDurations;
  }
  
  getActivities(): UserActivity[] {
    return this.userActivities;
  }
  
  getActivitySummary(): any {
    const clickCount = this.userActivities.filter(a => a.type === 'click').length;
    const pageViewCount = this.userActivities.filter(a => a.type === 'pageview').length;
    const inputCount = this.userActivities.filter(a => a.type === 'input').length;
    
    return {
      sessionDuration: this.getSessionDuration(),
      pageViews: pageViewCount,
      clicks: clickCount,
      inputs: inputCount,
      pageViewDurations: this.getPageViewDurations()
    };
  }

  private startTrackingNavigation(): void {
    // Remove any checks that require the user to be logged in
  }

  /**
   * Get current active user count
   * @returns Observable with the number of active users
   */
  getActiveUserCount(): Observable<number> {
    // In a real app, this would fetch from a backend
    // Here we're simulating a value
    return of(this.activeUserCount);
  }
  
  /**
   * Get user activity data for the current session
   * @returns Observable with user activity data
   */
  getUserActivityData(): Observable<any[]> {
    // Simulate real-time activity data
    return timer(0, 5000).pipe(
      map(() => this.generateMockActivityData())
    );
  }
  
  /**
   * Generate mock activity data for testing and display
   */
  private generateMockActivityData(): any[] {
    // Generate data for the last 24 hours
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(now.getHours() - (24 - i));
      
      // Generate random user counts between 10 and 60
      const activeUsers = Math.floor(Math.random() * 50) + 10;
      
      // Generate random number of sessions
      const sessions = activeUsers * (Math.random() * 2 + 1);
      
      // Generate random page views
      const pageViews = sessions * (Math.random() * 5 + 3);
      
      data.push({
        timestamp,
        label: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activeUsers,
        sessions: Math.floor(sessions),
        pageViews: Math.floor(pageViews),
        avgSessionDuration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
      });
    }
    
    return data;
  }
  
  /**
   * Get historical user activity data for a specified number of days
   * @param days Number of days to get history for (default: 7)
   * @returns Observable with historical activity data
   */
  getHistoricalUserActivity(days: number = 7): Observable<any[]> {
    // Generate mock historical data
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - i - 1));
      
      // Generate random user activity data
      const activeUsers = Math.floor(Math.random() * 100) + 50;
      data.push({
        date,
        label: date.toLocaleDateString(),
        value: activeUsers,
        sessions: Math.floor(activeUsers * 1.5),
        bounceRate: Math.floor(Math.random() * 30) + 30,
        avgDuration: Math.floor(Math.random() * 240) + 60
      });
    }
    
    return of(data);
  }
}
