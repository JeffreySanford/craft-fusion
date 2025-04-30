import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LoggerService } from './logger.service';
import { User } from '../interfaces/user.interface';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * Service for handling authorization checks like permissions and roles
 * Works alongside AuthenticationService for role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  // Store cached permissions to reduce API calls
  private permissionsCache: Map<string, string[]> = new Map();

  constructor(
    private authService: AuthenticationService,
    private logger: LoggerService
  ) {
    this.logger.registerService('AuthzService');
    this.logger.info('Authorization Service initialized', {
      cacheSize: 0,
      isAuthUserAvailable: !!this.authService.currentUser
    });
  }

  /**
   * Check if user has a specific role
   * @param requiredRole Role to check against current user
   * @returns Boolean indicating if user has the role
   */
  public hasRole(requiredRole: string): boolean {
    const user = this.authService.currentUser;
    
    const logContext = {
      requiredRole,
      userRole: user?.role || 'none',
      username: user?.username || 'anonymous',
      hasUser: !!user
    };
    
    this.logger.debug('Role check initiated', logContext);
    
    if (!user) {
      this.logger.debug('Role check failed: No authenticated user', logContext);
      return false;
    }
    
    // Handle admin role which usually has all permissions
    if (user.role === 'admin' || user.isAdmin) {
      this.logger.debug(`Role check passed: User is admin, required role was ${requiredRole}`, {
        ...logContext,
        adminOverride: true,
        result: true
      });
      return true;
    }
    
    const hasRole = user.role === requiredRole;
    
    this.logger.debug(`Role check ${hasRole ? 'passed' : 'failed'}`, {
      ...logContext,
      result: hasRole,
      adminOverride: false,
      decisionReason: hasRole ? 'role matched' : 'role did not match'
    });
    
    return hasRole;
  }
  
  /**
   * Check if user has any of the required roles
   * @param requiredRoles Array of accepted roles
   * @returns Boolean indicating if user has any of the roles
   */
  public hasAnyRole(requiredRoles: string[]): boolean {
    const user = this.authService.currentUser;
    const logContext = {
      requiredRoles: requiredRoles.join(','),
      userRole: user?.role || 'none',
      username: user?.username || 'anonymous',
      hasUser: !!user
    };
    
    this.logger.debug('Multiple role check initiated', logContext);
    
    if (!user) {
      this.logger.debug('Multiple role check failed: No authenticated user', logContext);
      return false;
    }
    
    // Admin has all roles
    if (user.role === 'admin' || user.isAdmin) {
      this.logger.debug('Multiple role check passed: User is admin', {
        ...logContext,
        adminOverride: true,
        result: true
      });
      return true;
    }
    
    const hasRole = requiredRoles.includes(user.role);
    
    this.logger.debug(`Multiple role check ${hasRole ? 'passed' : 'failed'}`, {
      ...logContext,
      result: hasRole,
      roleFound: hasRole ? user.role : 'none',
      decisionReason: hasRole ? 'role in required list' : 'role not in required list'
    });
    
    return hasRole;
  }
  
  /**
   * Check if user has a specific permission
   * Uses permissions array from user object if available
   * @param permission Permission to check
   * @returns Observable<boolean> indicating if user has the permission
   */
  public hasPermission(permission: string): Observable<boolean> {
    const user = this.authService.currentUser;
    const logContext = {
      permission,
      username: user?.username || 'anonymous',
      userRole: user?.role || 'none',
      hasUser: !!user,
      hasCachedPermissions: user ? this.permissionsCache.has(user.id.toString()) : false
    };
    
    this.logger.debug('Permission check initiated', logContext);
    
    if (!user) {
      this.logger.debug('Permission check failed: No authenticated user', logContext);
      return of(false);
    }
    
    // Admin has all permissions
    if (user.role === 'admin' || user.isAdmin) {
      this.logger.debug('Permission check passed: User is admin', {
        ...logContext,
        adminOverride: true,
        result: true
      });
      return of(true);
    }
    
    // Check cached permissions first
    if (this.permissionsCache.has(user.id.toString())) {
      const permissions = this.permissionsCache.get(user.id.toString()) || [];
      const hasPermission = permissions.includes(permission);
      
      this.logger.debug(`Permission check from cache ${hasPermission ? 'passed' : 'failed'}`, {
        ...logContext,
        cachedPermissions: permissions.join(','),
        result: hasPermission,
        source: 'cache',
        decisionReason: hasPermission ? 'permission found in cached list' : 'permission not found in cached list'
      });
      
      return of(hasPermission);
    }
    
    // If user has permissions array, use it directly
    if (user.permissions) {
      const hasPermission = user.permissions.includes(permission);
      this.permissionsCache.set(user.id.toString(), user.permissions);
      
      this.logger.debug(`Permission check from user object ${hasPermission ? 'passed' : 'failed'}`, {
        ...logContext,
        userPermissions: user.permissions.join(','),
        result: hasPermission,
        source: 'user object',
        cacheUpdated: true,
        decisionReason: hasPermission ? 'permission found in user permissions' : 'permission not found in user permissions'
      });
      
      return of(hasPermission);
    }
    
    // Fallback when offline - map common permissions to roles
    if (this.authService.isOffline) {
      this.logger.debug('Using offline permission mapping due to network state', {
        ...logContext,
        source: 'offline mapping'
      });
      return this.getOfflinePermissions(user, permission);
    }
    
    // Otherwise fetch permissions from API
    this.logger.debug('Fetching permissions from API', {
      ...logContext,
      source: 'api'
    });
    
    return this.fetchUserPermissions(user.id.toString()).pipe(
      map(permissions => {
        // Cache the permissions
        this.permissionsCache.set(user.id.toString(), permissions);
        const hasPermission = permissions.includes(permission);
        
        this.logger.debug(`Permission check from API ${hasPermission ? 'passed' : 'failed'}`, {
          ...logContext,
          fetchedPermissions: permissions.join(','),
          result: hasPermission,
          cacheUpdated: true,
          decisionReason: hasPermission ? 'permission found in API response' : 'permission not found in API response'
        });
        
        return hasPermission;
      }),
      catchError((error) => {
        // On error, fall back to role-based permission check
        this.logger.warn('Error fetching permissions from API, using fallback', {
          ...logContext,
          error: error.message,
          status: error.status,
          fallbackUsed: 'offline permissions'
        });
        
        return this.getOfflinePermissions(user, permission);
      })
    );
  }
  
  /**
   * Check if current user can access a protected resource
   * @param roles Array of roles that can access the resource
   * @returns Boolean indicating if user has access
   */
  public canAccess(roles: string[]): boolean {
    const logContext = {
      requiredRoles: roles?.join(',') || 'none',
      hasRoles: !!roles && roles.length > 0
    };
    
    // No roles means public access
    if (!roles || roles.length === 0) {
      this.logger.debug('Access check passed: No roles required (public resource)', {
        ...logContext,
        result: true,
        decisionReason: 'public resource'
      });
      return true;
    }
    
    const hasAccess = this.hasAnyRole(roles);
    
    this.logger.debug(`Access check ${hasAccess ? 'passed' : 'failed'}`, {
      ...logContext,
      result: hasAccess,
      username: this.authService.currentUser?.username || 'anonymous',
      userRole: this.authService.currentUser?.role || 'none',
      decisionReason: hasAccess ? 'user has required role' : 'user does not have required role'
    });
    
    return hasAccess;
  }
  
  /**
   * Process a request with user information
   * Used for server-side rendering or API middleware
   * @param request The request with potential user info
   * @returns The processed request with user data
   */
  public processRequest(request: RequestWithUser): RequestWithUser {
    const user = this.authService.currentUser;
    
    const logContext = {
      hasUser: !!user,
      username: user?.username || 'anonymous',
      requestHadUser: !!request.user,
      operation: !!request.user ? 'updated' : 'added'
    };
    
    this.logger.debug('Processing request with user information', logContext);
    
    if (user) {
      request.user = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        roles: [user.role]
      };
      
      this.logger.debug('User information added to request', {
        ...logContext,
        userId: user.id.toString(),
        roles: [user.role].join(',')
      });
    } else {
      this.logger.debug('No user information available to add to request');
    }
    
    return request;
  }
  
  /**
   * Clear the permissions cache, usually after logout
   */
  public clearPermissionsCache(): void {
    const cacheSize = this.permissionsCache.size;
    const cacheKeys = Array.from(this.permissionsCache.keys());
    
    this.permissionsCache.clear();
    
    this.logger.debug('Permissions cache cleared', {
      previousSize: cacheSize,
      clearedKeys: cacheKeys.join(','),
      currentSize: 0
    });
  }
  
  /**
   * Map offline permissions based on role when server is unavailable
   */
  private getOfflinePermissions(user: User, permission: string): Observable<boolean> {
    // Define basic permissions for common roles
    const rolePermissions = {
      'admin': ['read', 'write', 'delete', 'manage_users', 'view_reports', 'export_data'],
      'manager': ['read', 'write', 'view_reports'],
      'user': ['read']
    };
    
    const userRole = user.role || 'user';
    const permissions = rolePermissions[userRole as keyof typeof rolePermissions] || ['read'];
    const hasPermission = permissions.includes(permission);
    
    // Cache these permissions
    this.permissionsCache.set(user.id.toString(), permissions);
    
    this.logger.debug(`Offline permission check ${hasPermission ? 'passed' : 'failed'}`, {
      permission,
      username: user.username,
      userRole,
      offlinePermissions: permissions.join(','),
      result: hasPermission,
      source: 'offline mapping',
      cacheUpdated: true,
      decisionReason: hasPermission ? 'permission found in offline mapping' : 'permission not found in offline mapping'
    });
    
    return of(hasPermission);
  }
  
  /**
   * Fetch user permissions from API
   * @param userId User ID to fetch permissions for
   */
  private fetchUserPermissions(userId: string): Observable<string[]> {
    // If we're offline, don't even try to fetch permissions
    if (this.authService.isOffline) {
      this.logger.debug('Skipping API permissions fetch - system is offline', {
        userId
      });
      return of([]);
    }
    
    this.logger.debug('Fetching user permissions from API', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    // This would normally be an API call
    // For now, we'll just handle some common permissions for testing
    return of(['read', 'write']).pipe(
      tap(permissions => {
        this.logger.debug('Retrieved permissions from API', {
          userId,
          permissions: permissions.join(','),
          count: permissions.length
        });
      })
    );
  }
}
