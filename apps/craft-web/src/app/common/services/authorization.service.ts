import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, tap, shareReplay, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LoggerService } from './logger.service';
import { User } from '../interfaces/user.interface';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { ApiService } from './api.service';

/**
 * Permission levels that can be used throughout the application
 */
export enum Permission {
  // User management
  VIEW_USERS = 'users:view',
  CREATE_USERS = 'users:create',
  EDIT_USERS = 'users:edit',
  DELETE_USERS = 'users:delete',
  
  // Content management
  VIEW_CONTENT = 'content:view',
  CREATE_CONTENT = 'content:create',
  EDIT_CONTENT = 'content:edit',
  DELETE_CONTENT = 'content:delete',
  
  // Settings management
  VIEW_SETTINGS = 'settings:view',
  EDIT_SETTINGS = 'settings:edit',
  
  // Reports and analytics
  VIEW_REPORTS = 'reports:view',
  EXPORT_REPORTS = 'reports:export',
  
  // System administration
  ADMIN_ACCESS = 'admin:access'
}

/**
 * User role definitions with associated permissions
 */
export interface RoleDefinition {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface PermissionCheckRequest {
  userId: string | number;
  permissions: Permission[];
}

export interface PermissionCheckResponse {
  userId: string | number;
  permissions: {
    [key: string]: boolean;
  };
  timestamp: string;
}

/**
 * Service for handling authorization checks like permissions and roles
 * Works alongside AuthenticationService for role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  // Store cached permissions to reduce API calls
  private permissionsCache = new Map<string, Map<string, boolean>>();
  
  // Subject for permissions updates
  private permissionsSubject = new BehaviorSubject<Map<string, boolean>>(new Map());
  
  // Observable for permissions that components can subscribe to
  public readonly permissions$ = this.permissionsSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => {
      // Compare Maps by serializing them
      return JSON.stringify(Array.from(prev.entries())) === JSON.stringify(Array.from(curr.entries()));
    }),
    shareReplay(1)
  );
  
  // Role definitions for different user types
  private readonly roleDefinitions: Record<string, RoleDefinition> = {
    'admin': {
      name: 'Administrator',
      description: 'Full system access',
      permissions: Object.values(Permission) // All permissions
    },
    'manager': {
      name: 'Manager',
      description: 'Department or team manager',
      permissions: [
        Permission.VIEW_USERS,
        Permission.VIEW_CONTENT,
        Permission.CREATE_CONTENT,
        Permission.EDIT_CONTENT,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_REPORTS,
        Permission.VIEW_SETTINGS
      ]
    },
    'editor': {
      name: 'Content Editor',
      description: 'Can create and edit content',
      permissions: [
        Permission.VIEW_CONTENT,
        Permission.CREATE_CONTENT,
        Permission.EDIT_CONTENT,
        Permission.VIEW_REPORTS
      ]
    },
    'user': {
      name: 'Standard User',
      description: 'Basic system access',
      permissions: [
        Permission.VIEW_CONTENT,
        Permission.VIEW_REPORTS
      ]
    },
    'guest': {
      name: 'Guest',
      description: 'Limited read-only access',
      permissions: [
        Permission.VIEW_CONTENT
      ]
    }
  };

  constructor(
    private authService: AuthenticationService,
    private apiService: ApiService,
    private logger: LoggerService
  ) {
    this.logger.registerService('AuthzService');
    this.logger.info('Authorization Service initialized', {
      cacheSize: 0,
      availableRoles: Object.keys(this.roleDefinitions).join(', '),
      isAuthUserAvailable: !!this.authService.currentUser
    });
    
    // Listen for authentication state changes
    this.authService.currentUser$.pipe(
      tap(user => {
        if (!user || !user.id) {
          // User logged out, clear permissions
          this.clearPermissionsCache();
          this.permissionsSubject.next(new Map());
        } else {
          // User logged in or changed, load permissions
          this.loadUserPermissions(user);
        }
      })
    ).subscribe();
  }

  /**
   * Get the name of a role
   * @param role Role identifier
   * @returns Display name of the role
   */
  public getRoleName(role: string): string {
    return this.roleDefinitions[role]?.name || role;
  }

  /**
   * Get the description of a role
   * @param role Role identifier
   * @returns Description of the role
   */
  public getRoleDescription(role: string): string {
    return this.roleDefinitions[role]?.description || '';
  }

  /**
   * Get all available roles
   * @returns Array of role definitions
   */
  public getAvailableRoles(): RoleDefinition[] {
    return Object.values(this.roleDefinitions);
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
      userRoles: user?.roles?.join(', ') || 'none',
      username: user?.username || 'anonymous',
      hasUser: !!user
    };
    
    this.logger.debug('Role check initiated', logContext);
    
    if (!user || !user.roles) {
      this.logger.debug('Role check failed: No authenticated user or no roles', logContext);
      return false;
    }
    
    // Admin role has all permissions
    if (user.roles.includes('admin')) {
      this.logger.debug(`Role check passed: User is admin, required role was ${requiredRole}`, {
        ...logContext,
        adminOverride: true,
        result: true
      });
      return true;
    }
    
    const hasRole = user.roles.includes(requiredRole);
    
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
      userRoles: user?.roles?.join(', ') || 'none',
      username: user?.username || 'anonymous',
      hasUser: !!user
    };
    
    this.logger.debug('Multiple role check initiated', logContext);
    
    if (!user || !user.roles) {
      this.logger.debug('Multiple role check failed: No authenticated user or no roles', logContext);
      return false;
    }
    
    // Admin has all roles
    if (user.roles.includes('admin')) {
      this.logger.debug('Multiple role check passed: User is admin', {
        ...logContext,
        adminOverride: true,
        result: true
      });
      return true;
    }
    
    const hasAnyRole = requiredRoles.some(role => user.roles.includes(role));
    
    this.logger.debug(`Multiple role check ${hasAnyRole ? 'passed' : 'failed'}`, {
      ...logContext,
      result: hasAnyRole,
      matchingRoles: requiredRoles.filter(role => user.roles.includes(role)).join(','),
      decisionReason: hasAnyRole ? 'user has one of the required roles' : 'user does not have any required roles'
    });
    
    return hasAnyRole;
  }
  
  /**
   * Check if user has a specific permission
   * @param permission Permission to check
   * @returns Observable<boolean> indicating if user has the permission
   */
  public hasPermission(permission: string): Observable<boolean> {
    return combineLatest([
      this.authService.currentUser$,
      this.permissions$
    ]).pipe(
      map(([user, permissions]) => {
        // No user means no permissions
        if (!user) {
          return false;
        }

        // Check if we have a cached permission result
        if (permissions.has(permission)) {
          return permissions.get(permission) || false;
        }
        
        // Admin always has all permissions
        if (user.roles?.includes('admin')) {
          return true;
        }
        
        // If user has roles defined, check role-based permissions
        if (user.roles && user.roles.length > 0) {
          // Get permissions for all user roles
          const userPermissions = new Set<string>();
          
          for (const role of user.roles) {
            const rolePerms = this.roleDefinitions[role]?.permissions || [];
            rolePerms.forEach(p => userPermissions.add(p));
          }
          
          return userPermissions.has(permission);
        }
        
        // Default deny if we don't have any information
        return false;
      }),
      tap(result => {
        this.logger.debug(`Permission check for ${permission}`, {
          permission,
          result,
          username: this.authService.currentUser?.username || 'anonymous',
          userRoles: this.authService.currentUser?.roles?.join(', ') || 'none'
        });
      })
    );
  }
  
  /**
   * Get an observable that emits whether the user has the specified permission
   * Useful for templates with the async pipe
   */
  public hasPermission$(permission: string): Observable<boolean> {
    return this.hasPermission(permission);
  }

  /**
   * Check if the current user has all of the required permissions
   * @param permissions Array of permissions to check
   * @returns Observable<boolean> that emits true if user has all permissions
   */
  public hasAllPermissions(permissions: string[]): Observable<boolean> {
    if (!permissions || permissions.length === 0) {
      return of(true); // No permissions required
    }

    return combineLatest(
      permissions.map(permission => this.hasPermission(permission))
    ).pipe(
      map(results => results.every(Boolean)),
      tap(result => {
        this.logger.debug(`Checking multiple permissions`, {
          permissions: permissions.join(', '),
          result,
          username: this.authService.currentUser?.username || 'anonymous'
        });
      })
    );
  }

  /**
   * Check if the current user has any of the required permissions
   * @param permissions Array of permissions to check
   * @returns Observable<boolean> that emits true if user has at least one permission
   */
  public hasAnyPermission(permissions: string[]): Observable<boolean> {
    if (!permissions || permissions.length === 0) {
      return of(false); // No permissions specified
    }

    return combineLatest(
      permissions.map(permission => this.hasPermission(permission))
    ).pipe(
      map(results => results.some(Boolean)),
      tap(result => {
        this.logger.debug(`Checking if user has any permission`, {
          permissions: permissions.join(', '),
          result,
          username: this.authService.currentUser?.username || 'anonymous'
        });
      })
    );
  }
  
  /**
   * Check if current user can access a protected resource
   * @param roles Array of roles that can access the resource
   * @returns Boolean indicating if user has access
   */
  public canAccess(roles: string[]): boolean {
    // No roles means public access
    if (!roles || roles.length === 0) {
      return true;
    }
    
    return this.hasAnyRole(roles);
  }

  /**
   * Check if user can access a resource that requires specific permissions
   * @param permissions Permissions required to access the resource
   * @returns Observable<boolean> indicating if user has required permissions
   */
  public canAccessWithPermission(permissions: string | string[]): Observable<boolean> {
    const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
    return this.hasAnyPermission(permissionsArray);
  }
  
  /**
   * Process a request with user information
   * Used for server-side rendering or API middleware
   * @param request The request with potential user info
   * @returns The processed request with user data
   */
  public processRequest(request: RequestWithUser): RequestWithUser {
    const user = this.authService.currentUser;
    
    if (user) {
      request.user = {
        id: user.id.toString(),
        username: user.username,
        email: user.email || '',
        roles: user.roles || []
      };
      
      this.logger.debug('User information added to request', {
        userId: user.id.toString(),
        roles: user.roles?.join(',') || 'none'
      });
    }
    
    return request;
  }
  
  /**
   * Clear the permissions cache, usually after logout
   */
  public clearPermissionsCache(): void {
    const cacheSize = this.permissionsCache.size;
    
    this.permissionsCache.clear();
    this.permissionsSubject.next(new Map());
    
    this.logger.debug('Permissions cache cleared', {
      previousSize: cacheSize,
      currentSize: 0
    });
  }

  /**
   * Load permissions for the current user
   * @param user User to load permissions for
   */
  private loadUserPermissions(user: User): void {
    if (!user || !user.id) {
      return;
    }
    
    // For admin users, we can skip the API call
    if (user.roles?.includes('admin')) {
      const adminPermissions = new Map<string, boolean>();
      
      // All permissions are granted
      Object.values(Permission).forEach(permission => {
        adminPermissions.set(permission, true);
      });
      
      this.permissionsSubject.next(adminPermissions);
      this.logger.debug('Admin user detected, granting all permissions', {
        username: user.username,
        userId: user.id
      });
      
      return;
    }
    
    // Check if we have permissions in the user object
    if (user.permissions && user.permissions.length > 0) {
      const permissions = new Map<string, boolean>();
      
      // Add explicit permissions from user object
      user.permissions.forEach(permission => {
        permissions.set(permission, true);
      });
      
      // Add role-based permissions
      if (user.roles) {
        user.roles.forEach(role => {
          const rolePerms = this.roleDefinitions[role]?.permissions || [];
          rolePerms.forEach(permission => {
            permissions.set(permission, true);
          });
        });
      }
      
      this.permissionsSubject.next(permissions);
      this.logger.debug('Permissions loaded from user object', {
        userId: user.id,
        username: user.username,
        permissionCount: permissions.size
      });
      
      return;
    }
    
    // If offline, use role-based permissions
    if (this.authService.isOffline) {
      this.logger.debug('Using role-based permissions in offline mode', {
        userId: user.id,
        username: user.username
      });
      
      this.loadRoleBasedPermissions(user);
      return;
    }
    
    // Fetch permissions from API
    this.fetchUserPermissions(user.id.toString()).subscribe();
  }
  
  /**
   * Load permissions based on user roles
   */
  private loadRoleBasedPermissions(user: User): void {
    if (!user || !user.roles || user.roles.length === 0) {
      return;
    }
    
    const permissions = new Map<string, boolean>();
    
    // Add permissions based on user roles
    user.roles.forEach(role => {
      const rolePerms = this.roleDefinitions[role]?.permissions || [];
      rolePerms.forEach(permission => {
        permissions.set(permission, true);
      });
    });
    
    this.permissionsSubject.next(permissions);
    
    this.logger.debug('Role-based permissions loaded', {
      userId: user.id,
      username: user.username,
      roles: user.roles.join(', '),
      permissionCount: permissions.size
    });
  }
  
  /**
   * Fetch user permissions from API
   * @param userId User ID to fetch permissions for
   */
  private fetchUserPermissions(userId: string): Observable<Map<string, boolean>> {
    // If we're offline, don't try to fetch permissions
    if (this.authService.isOffline) {
      return of(new Map<string, boolean>());
    }
    
    this.logger.debug('Fetching user permissions from API', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    // In a real app, this would call the API
    // For demo purposes, we'll simulate a response
    const permissionsToCheck = Object.values(Permission);
    
    // Call the API endpoint for permission check
    return this.simulatePermissionCheck(userId, permissionsToCheck).pipe(
      map(response => {
        const permissions = new Map<string, boolean>();
        
        Object.entries(response.permissions).forEach(([permission, isGranted]) => {
          permissions.set(permission, isGranted);
        });
        
        // Update the permissions subject
        this.permissionsSubject.next(permissions);
        
        // Store in cache
        this.permissionsCache.set(userId, permissions);
        
        this.logger.debug('Retrieved permissions from API', {
          userId,
          permissionCount: permissions.size,
          timestamp: response.timestamp
        });
        
        return permissions;
      }),
      catchError(error => {
        this.logger.error('Failed to fetch permissions from API', {
          error: error.message,
          status: error.status || 'unknown',
          userId
        });
        
        // Fall back to role-based permissions
        const user = this.authService.currentUser;
        if (user) {
          this.loadRoleBasedPermissions(user);
        }
        
        return of(this.permissionsSubject.value);
      })
    );
  }
  
  /**
   * Simulate a permission check response (would be a real API call)
   * @param userId User ID to check permissions for
   * @param permissions Permissions to check
   */
  private simulatePermissionCheck(userId: string, permissions: string[]): Observable<PermissionCheckResponse> {
    // This simulates what would normally be an API call
    const user = this.authService.currentUser;
    
    if (!user) {
      return of({
        userId,
        permissions: {},
        timestamp: new Date().toISOString()
      });
    }
    
    const response: PermissionCheckResponse = {
      userId,
      permissions: {},
      timestamp: new Date().toISOString()
    };
    
    // Simulate permission check based on user roles
    const userRoles = user.roles || [];
    
    permissions.forEach(permission => {
      // For admin users, all permissions are granted
      if (userRoles.includes('admin')) {
        response.permissions[permission] = true;
        return;
      }
      
      // For other roles, check if any role grants this permission
      let isGranted = false;
      
      for (const role of userRoles) {
        const roleDefinition = this.roleDefinitions[role];
        if (roleDefinition && roleDefinition.permissions.includes(permission as Permission)) {
          isGranted = true;
          break;
        }
      }
      
      response.permissions[permission] = isGranted;
    });
    
    // Add a slight delay to simulate network latency
    return of(response).pipe(
      tap(() => this.logger.debug('Permission check response prepared', {
        userId,
        permissionCount: Object.keys(response.permissions).length,
        timestamp: response.timestamp
      }))
    );
  }
}
