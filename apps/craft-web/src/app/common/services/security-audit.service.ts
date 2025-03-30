import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { AuthenticationService } from './authentication.service';

export interface SecurityAuditEvent {
  eventType: string;
  severity: 'info' | 'warning' | 'critical';
  details: any;
  userId?: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  tokenId?: string; // JWT ID for tracking specific tokens
  resourceType?: string; // Type of resource (JWT, User, API, etc.)
}

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH_SUCCESS = 'token_refresh_success',
  TOKEN_REFRESH_FAILURE = 'token_refresh_failure',
  
  // JWT events
  TOKEN_CREATED = 'token_created',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_REVOKED = 'token_revoked',
  TOKEN_VALIDATED = 'token_validated',
  TOKEN_VALIDATION_FAILED = 'token_validation_failed',
  
  // Access control events
  PERMISSION_DENIED = 'permission_denied',
  ADMIN_ACCESS = 'admin_access',
  SETTINGS_CHANGED = 'settings_changed',
  SECURITY_LEVEL_CHANGED = 'security_level_changed',
  
  // Suspicious activities
  SUSPICIOUS_TOKEN_USAGE = 'suspicious_token_usage',
  FINGERPRINT_MISMATCH = 'fingerprint_mismatch',
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  CSRF_ATTACK_ATTEMPT = 'csrf_attack_attempt'
}

@Injectable({
  providedIn: 'root'
})
export class SecurityAuditService {
  private readonly LOCAL_STORAGE_KEY = 'security_audit_events';
  private readonly MAX_LOCAL_EVENTS = 500;
  private enableLocalStorage = true;
  
  // Observable for realtime audit logs
  private auditEvents$ = new BehaviorSubject<SecurityAuditEvent[]>([]);
  
  // Track failed login attempts to detect brute force attacks
  private failedLoginAttempts = new Map<string, { count: number, lastAttempt: number }>();
  
  constructor(
    private http: HttpClient,
    private logger: LoggerService,
    private authService: AuthenticationService
  ) {
    this.logger.registerService('SecurityAuditService');
    
    // Load initial events from storage
    this.auditEvents$.next(this.getLocalEvents());
  }
  
  /**
   * Get observable of security audit events
   */
  getAuditEvents(): Observable<SecurityAuditEvent[]> {
    return this.auditEvents$.asObservable();
  }
  
  /**
   * Log a security-related event
   */
  logEvent(eventType: string, severity: 'info' | 'warning' | 'critical', details: any): Observable<any> {
    const user = this.authService.getCurrentUser().pipe(
      map(user => user?.id),
      catchError(() => of(undefined))
    );
    
    return user.pipe(
      map(userId => {
        const event: SecurityAuditEvent = {
          eventType,
          severity,
          details,
          userId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          resourceType: details.resourceType || 'generic'
        };
        
        // Track token ID if available
        if (details.tokenId) {
          event.tokenId = details.tokenId;
        }
        
        // Log to console in development
        this.logger.info('Security audit event', event);
        
        // Store locally if enabled
        if (this.enableLocalStorage) {
          this.storeEventLocally(event);
        }
        
        // Update the observable with new events
        const currentEvents = this.auditEvents$.getValue();
        this.auditEvents$.next([...currentEvents, event]);
        
        // Check for security patterns based on event type
        this.analyzeSecurityPatterns(event);
        
        // Send to server in a real app
        // return this.http.post('/api/security/audit', event).pipe(...)
        
        return of({ success: true, event });
      })
    );
  }
  
  /**
   * Analyze security patterns for possible threats
   */
  private analyzeSecurityPatterns(event: SecurityAuditEvent): void {
    // Check for multiple failed logins
    if (event.eventType === AuditEventType.LOGIN_FAILURE) {
      const username = event.details?.username;
      if (username) {
        const attempts = this.failedLoginAttempts.get(username) || { count: 0, lastAttempt: 0 };
        
        // Reset counter after 30 minutes
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - attempts.lastAttempt > thirtyMinutes) {
          attempts.count = 0;
        }
        
        attempts.count++;
        attempts.lastAttempt = Date.now();
        this.failedLoginAttempts.set(username, attempts);
        
        // Log suspicious activity after 5 failed attempts
        if (attempts.count >= 5) {
          this.logEvent(
            AuditEventType.MULTIPLE_FAILED_LOGINS, 
            'warning', 
            { username, attemptCount: attempts.count }
          ).subscribe();
        }
      }
    }
    
    // Add more security pattern analysis here
  }
  
  /**
   * Log JWT token lifecycle events
   */
  logTokenEvent(tokenAction: AuditEventType, tokenData: any): Observable<any> {
    return this.logEvent(tokenAction, 'info', {
      resourceType: 'JWT',
      tokenId: tokenData.jti || 'unknown',
      subject: tokenData.sub,
      issued: tokenData.iat,
      expires: tokenData.exp,
      ...tokenData
    });
  }
  
  /**
   * Log a login attempt
   */
  logLoginAttempt(username: string, success: boolean, details?: any): Observable<any> {
    const eventType = success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE;
    const severity = success ? 'info' : 'warning';
    
    return this.logEvent(eventType, severity, { 
      username, 
      resourceType: 'Authentication',
      ...details 
    });
  }
  
  /**
   * Log a permission denial
   */
  logPermissionDenial(resource: string, action: string, details?: any): Observable<any> {
    return this.logEvent(AuditEventType.PERMISSION_DENIED, 'warning', { 
      resource, 
      action, 
      resourceType: 'Authorization',
      ...details 
    });
  }
  
  /**
   * Log a suspicious activity
   */
  logSuspiciousActivity(activityType: AuditEventType, details?: any): Observable<any> {
    return this.logEvent(activityType, 'critical', {
      resourceType: 'Security',
      timestamp: new Date().toISOString(),
      ...details
    });
  }
  
  /**
   * Log token validation
   */
  logTokenValidation(isValid: boolean, tokenData: any): Observable<any> {
    const eventType = isValid ? AuditEventType.TOKEN_VALIDATED : AuditEventType.TOKEN_VALIDATION_FAILED;
    const severity = isValid ? 'info' : 'warning';
    
    return this.logEvent(eventType, severity, {
      resourceType: 'JWT',
      tokenId: tokenData.jti || 'unknown',
      reason: isValid ? 'Valid token' : tokenData.reason || 'Invalid token',
      ...tokenData
    });
  }
  
  /**
   * Log security settings change
   */
  logSecuritySettingsChange(settingName: string, oldValue: any, newValue: any, userId?: string): Observable<any> {
    return this.logEvent(AuditEventType.SETTINGS_CHANGED, 'info', {
      resourceType: 'SecuritySettings',
      setting: settingName,
      oldValue,
      newValue,
      changedBy: userId
    });
  }
  
  /**
   * Get audit events from local storage
   */
  getLocalEvents(): SecurityAuditEvent[] {
    try {
      const eventsJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!eventsJson) return [];
      return JSON.parse(eventsJson);
    } catch (e) {
      this.logger.error('Failed to retrieve local security events', { error: e });
      return [];
    }
  }
  
  /**
   * Get filtered audit events based on criteria
   */
  getFilteredEvents(options: {
    severity?: string[],
    eventTypes?: string[],
    fromDate?: Date,
    toDate?: Date,
    userId?: string,
    resourceType?: string,
    limit?: number
  }): Observable<SecurityAuditEvent[]> {
    // First get all events
    return this.getAuditEvents().pipe(
      map(events => {
        // Apply filters
        return events.filter(event => {
          // Filter by severity
          if (options.severity && options.severity.length > 0) {
            if (!options.severity.includes(event.severity)) return false;
          }
          
          // Filter by event type
          if (options.eventTypes && options.eventTypes.length > 0) {
            if (!options.eventTypes.includes(event.eventType)) return false;
          }
          
          // Filter by date range
          if (options.fromDate && event.timestamp < options.fromDate.getTime()) return false;
          if (options.toDate && event.timestamp > options.toDate.getTime()) return false;
          
          // Filter by user ID
          if (options.userId && event.userId !== options.userId) return false;
          
          // Filter by resource type
          if (options.resourceType && event.resourceType !== options.resourceType) return false;
          
          return true;
        });
      }),
      map(events => {
        // Apply limit if specified
        if (options.limit && options.limit > 0) {
          return events.slice(-options.limit); // Get the most recent events
        }
        return events;
      })
    );
  }
  
  /**
   * Clear local audit events
   */
  clearLocalEvents(): void {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      this.auditEvents$.next([]);
    } catch (e) {
      this.logger.error('Failed to clear local security events', { error: e });
    }
  }
  
  /**
   * Store event in local storage
   */
  private storeEventLocally(event: SecurityAuditEvent): void {
    try {
      let events = this.getLocalEvents();
      
      // Add new event
      events.push(event);
      
      // Keep only the most recent events up to the limit
      if (events.length > this.MAX_LOCAL_EVENTS) {
        events = events.slice(events.length - this.MAX_LOCAL_EVENTS);
      }
      
      // Save back to storage
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      this.logger.error('Failed to store security event locally', { error: e });
    }
  }
  
  /**
   * Export audit logs to JSON file
   */
  exportAuditLogs(): void {
    try {
      const events = this.getLocalEvents();
      const dataStr = JSON.stringify(events, null, 2);
      
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `security-audit-${new Date().toISOString()}.json`);
      document.body.appendChild(a);
      
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      this.logger.error('Failed to export audit logs', { error: e });
    }
  }
}
