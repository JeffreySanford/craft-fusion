import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { LoggerService } from './logger.service';
import { ApiService } from './api.service';

export interface UserActivity {
  type: 'click' | 'pageView' | 'formInteraction' | 'login' | 'logout' | 'error' | 'custom' | 'guestLogin';
  timestamp: number;
  details?: {
    path?: string;
    element?: string;
    formId?: string;
    error?: any;
    metadata?: any;
    userType?: 'guest' | 'authenticated';
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  };
}

export interface UserProfile {
  username: string;
  email?: string;
  roles?: string[];
  lastActive?: Date;
  preferences?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class UserTrackingService {
  private activities: UserActivity[] = [];
  private currentUser$ = new BehaviorSubject<UserProfile | null>(null);
  private sessionStartTime: number = Date.now();
  private MAX_ACTIVITIES_TO_STORE = 1000;
  private clientIpAddress: string | null = null;

  constructor(
    private logger: LoggerService,
    private apiService: ApiService
  ) {
    this.logger.registerService('UserTrackingService');
    this.logger.info('UserTrackingService initialized', {
      sessionStartTime: new Date(this.sessionStartTime),
      userAgent: navigator.userAgent
    });
    
    // Get client IP on initialization
    this.getClientIp();
  }

  /**
   * Get client IP address for tracking
   */
  private getClientIp(): void {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        this.clientIpAddress = data.ip;
        this.logger.debug('Client IP detected for tracking', { 
          ipAddress: this.clientIpAddress 
        });
      })
      .catch(error => {
        this.logger.warn('Failed to retrieve client IP', { error: error.message });
      });
  }

  /**
   * Track a user activity
   */
  track(activity: UserActivity | Partial<UserActivity>): void {
    // Ensure activity has required properties
    const fullActivity: UserActivity = {
      type: activity.type || 'custom',
      timestamp: activity.timestamp || Date.now(),
      details: {
        ...activity.details || {},
        ipAddress: activity.details?.ipAddress || this.clientIpAddress || 'unknown',
        userAgent: activity.details?.userAgent || navigator.userAgent,
        referrer: activity.details?.referrer || document.referrer || 'direct',
        path: activity.details?.path || window.location.pathname
      }
    };

    // Special handling for guest logins
    if (fullActivity.type === 'login' && fullActivity.details?.userType === 'guest') {
      this.logger.info('Guest user activity tracked', {
        type: 'guestLogin',
        ipAddress: fullActivity.details.ipAddress,
        path: fullActivity.details.path,
        referrer: fullActivity.details.referrer,
        timestamp: new Date(fullActivity.timestamp) // Fix: Use Date object
      });
    }

    // Store activity
    this.activities.push(fullActivity);
    this.logger.debug('User activity tracked', { 
      type: fullActivity.type,
      timestamp: new Date(fullActivity.timestamp), // Fix: Use Date object
      ipAddress: fullActivity.details?.ipAddress // Fix: Add optional chaining
    });

    // Trim activities if they exceed the maximum
    if (this.activities.length > this.MAX_ACTIVITIES_TO_STORE) {
      this.activities = this.activities.slice(-this.MAX_ACTIVITIES_TO_STORE);
    }

    // Optionally send to backend depending on activity importance
    if (this.shouldSendToBackend(fullActivity)) {
      this.sendActivityToBackend(fullActivity);
    }
  }

  /**
   * Get the current user profile
   */
  getCurrentUser(): Observable<UserProfile | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Set the current user profile with enhanced logging
   */
  setCurrentUser(user: UserProfile | null): void {
    this.currentUser$.next(user);
    if (user) {
      this.logger.info('User profile updated', { 
        username: user.username,
        roles: user.roles,
        timestamp: new Date(), // Fix: Use Date object
        ipAddress: this.clientIpAddress || 'unknown'
      });
    } else {
      this.logger.info('User profile cleared', {
        timestamp: new Date(), // Fix: Use Date object
        ipAddress: this.clientIpAddress || 'unknown'
      });
    }
  }

  /**
   * Get all tracked activities
   */
  getActivities(): UserActivity[] {
    return [...this.activities];
  }

  /**
   * Get activities filtered by type
   */
  getActivitiesByType(type: string): UserActivity[] {
    return this.activities.filter(activity => activity.type === type);
  }

  /**
   * Get activities within a time range
   */
  getActivitiesInTimeRange(startTime: number, endTime: number): UserActivity[] {
    return this.activities.filter(
      activity => activity.timestamp >= startTime && activity.timestamp <= endTime
    );
  }

  /**
   * Get the current session duration in milliseconds
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Clear all tracked activities
   */
  clearActivities(): void {
    this.activities = [];
    this.logger.info('User activities cleared');
  }

  /**
   * Helper method to determine if an activity should be sent to backend
   */
  private shouldSendToBackend(activity: UserActivity): boolean {
    // Always send important events like login/logout immediately
    if (['login', 'logout', 'error', 'guestLogin'].includes(activity.type)) {
      return true;
    }

    // For other events, batch them or only send periodically
    return false;
  }

  /**
   * Send activity to backend with enhanced logging
   */
  private sendActivityToBackend(activity: UserActivity): void {
    this.apiService.post('user/activity', {
      ...activity,
      sessionStartTime: this.sessionStartTime
    })
      .subscribe({
        next: () => {
          this.logger.debug('Activity sent to backend', { 
            activityType: activity.type,
            timestamp: new Date(activity.timestamp) // Fix: Use Date object
          });
        },
        error: (err) => {
          this.logger.warn('Failed to send activity to backend', { 
            error: err.message || 'Unknown error',
            activity: activity.type,
            timestamp: new Date(activity.timestamp) // Fix: Use Date object
          });
        }
      });
  }
}
