import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LoggerService } from './logger.service';

export type SecurityLevel = 'low' | 'moderate' | 'high';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  // Default security level
  private securityLevel: SecurityLevel = 'moderate';

  // Cache user permissions
  private permissionsCache: Map<string, boolean> = new Map();
  
  constructor(
    private authService: AuthenticationService,
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.logger.registerService('AuthorizationService');
    
    // Clear permissions cache when auth state changes
    this.authService.authStateChanged$.subscribe(() => {
      this.clearPermissionsCache();
    });
  }

  // Set application security level
  setSecurityLevel(level: SecurityLevel): void {
    this.securityLevel = level;
    this.logger.info('Security level changed', { level });
    this.clearPermissionsCache();
  }

  // Get current security level
  getSecurityLevel(): SecurityLevel {
    return this.securityLevel;
  }

  // Check if user has a specific permission
  hasPermission(permission: Permission): Observable<boolean> {
    // If not authenticated, no permissions
    if (!this.authService.isLoggedIn()) {
      return of(false);
    }

    // Admin users have all permissions in 'low' security mode
    if (this.securityLevel === 'low' && this.authService.hasRole('admin')) {
      return of(true);
    }

    // Generate cache key
    const cacheKey = `${permission.resource}:${permission.action}`;
    
    // Check cache first
    if (this.permissionsCache.has(cacheKey)) {
      return of(this.permissionsCache.get(cacheKey) as boolean);
    }

    // For demo, implement role-based permissions
    if (this.securityLevel === 'low' || this.securityLevel === 'moderate') {
      let hasPermission = false;
      
      // Simple role-based checks
      if (permission.resource === 'admin' && this.authService.hasRole('admin')) {
        hasPermission = true;
      } else if (permission.resource === 'user' && 
                (this.authService.hasRole('admin') || this.authService.hasRole('user'))) {
        hasPermission = true;
      }
      
      // Cache result
      this.permissionsCache.set(cacheKey, hasPermission);
      return of(hasPermission);
    }

    // For 'high' security level, always verify with the server
    return this.verifyPermissionWithServer(permission).pipe(
      tap(hasPermission => {
        // Cache result
        this.permissionsCache.set(cacheKey, hasPermission);
      })
    );
  }

  // Check multiple permissions (user needs ALL permissions)
  hasPermissions(permissions: Permission[]): Observable<boolean> {
    // if empty array, return true
    if (permissions.length === 0) {
      return of(true);
    }

    // For 'low' security level and admin users, shortcut to true
    if (this.securityLevel === 'low' && this.authService.hasRole('admin')) {
      return of(true);
    }

    // Check all permissions
    const permChecks: Observable<boolean>[] = permissions.map(perm => 
      this.hasPermission(perm)
    );

    // Combine all permission checks with AND logic
    return new Observable<boolean>(observer => {
      let completed = 0;
      let allGranted = true;

      permChecks.forEach(check => {
        check.subscribe({
          next: (hasPermission) => {
            if (!hasPermission) {
              allGranted = false;
            }
            completed++;
            
            if (completed === permChecks.length) {
              observer.next(allGranted);
              observer.complete();
            }
          },
          error: (err) => {
            observer.error(err);
          }
        });
      });
    });
  }

  // Clear the permissions cache
  clearPermissionsCache(): void {
    this.permissionsCache.clear();
    this.logger.debug('Permissions cache cleared');
  }

  // Verify permission with the server (for high security)
  private verifyPermissionWithServer(permission: Permission): Observable<boolean> {
    // In a real app, this would make an API call to verify permissions
    this.logger.debug('Verifying permission with server', { permission });
    
    // For demo, simulate API call
    // return of(Math.random() > 0.2); // 80% chance of success
    
    // In a real app:
    return this.http.post<{granted: boolean}>('/api/auth/verify-permission', permission)
      .pipe(
        map(response => response.granted),
        catchError(err => {
          this.logger.error('Error verifying permission', { error: err, permission });
          return of(false);
        })
      );
  }
}
