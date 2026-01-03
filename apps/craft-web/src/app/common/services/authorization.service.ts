import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, tap, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LoggerService } from './logger.service';
import { User } from '../interfaces/user.interface';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { ApiService } from './api.service';

export enum Permission {

  VIEW_USERS = 'users:view',
  CREATE_USERS = 'users:create',
  EDIT_USERS = 'users:edit',
  DELETE_USERS = 'users:delete',

  VIEW_CONTENT = 'content:view',
  CREATE_CONTENT = 'content:create',
  EDIT_CONTENT = 'content:edit',
  DELETE_CONTENT = 'content:delete',

  VIEW_SETTINGS = 'settings:view',
  EDIT_SETTINGS = 'settings:edit',

  VIEW_REPORTS = 'reports:view',
  EXPORT_REPORTS = 'reports:export',

  ADMIN_ACCESS = 'admin:access',
}

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

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {

  private permissionsCache = new Map<string, Map<string, boolean>>();

  private permissionsSubject = new BehaviorSubject<Map<string, boolean>>(new Map());

  public readonly permissions$ = this.permissionsSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => {

      return JSON.stringify(Array.from(prev.entries())) === JSON.stringify(Array.from(curr.entries()));
    }),
    shareReplay(1),
  );

  private readonly roleDefinitions = new Map<string, RoleDefinition>([
    [
      'admin',
      {
        name: 'Administrator',
        description: 'Full system access',
        permissions: Object.values(Permission),                   
      },
    ],
    [
      'manager',
      {
        name: 'Manager',
        description: 'Department or team manager',
        permissions: [
          Permission.VIEW_USERS,
          Permission.VIEW_CONTENT,
          Permission.CREATE_CONTENT,
          Permission.EDIT_CONTENT,
          Permission.VIEW_REPORTS,
          Permission.EXPORT_REPORTS,
          Permission.VIEW_SETTINGS,
        ],
      },
    ],
    [
      'editor',
      {
        name: 'Content Editor',
        description: 'Can create and edit content',
        permissions: [Permission.VIEW_CONTENT, Permission.CREATE_CONTENT, Permission.EDIT_CONTENT, Permission.VIEW_REPORTS],
      },
    ],
    [
      'user',
      {
        name: 'Standard User',
        description: 'Basic system access',
        permissions: [Permission.VIEW_CONTENT, Permission.VIEW_REPORTS],
      },
    ],
    [
      'guest',
      {
        name: 'Guest',
        description: 'Limited read-only access',
        permissions: [Permission.VIEW_CONTENT],
      },
    ],
  ]);

  constructor(
    private authService: AuthenticationService,
    private apiService: ApiService,
    private logger: LoggerService,
  ) {
    this.logger.registerService('AuthzService');
    this.logger.info('Authorization Service initialized', {
      cacheSize: 0,
      availableRoles: Array.from(this.roleDefinitions.keys()).join(', '),
      isAuthUserAvailable: !!this.authService.currentUser,
    });

    this.authService.currentUser$
      .pipe(
        tap(user => {
          if (!user || !user.id) {

            this.clearPermissionsCache();
            this.permissionsSubject.next(new Map());
          } else {

            this.loadUserPermissions(user);
          }
        }),
      )
      .subscribe();
  }

  public getRoleName(role: string): string {
    return this.roleDefinitions.get(role)?.name || role;
  }

  public getRoleDescription(role: string): string {
    return this.roleDefinitions.get(role)?.description || '';
  }

  public getAvailableRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }

  public hasRole(requiredRole: string): boolean {
    const user = this.authService.currentUser;

    const logContext = {
      requiredRole,
      userRoles: user?.roles?.join(', ') || 'none',
      username: user?.username || 'anonymous',
      hasUser: !!user,
    };

    this.logger.debug('Role check initiated', logContext);

    if (!user || !user.roles) {
      this.logger.debug('Role check failed: No authenticated user or no roles', logContext);
      return false;
    }

    if (user.roles.includes('admin')) {
      this.logger.debug(`Role check passed: User is admin, required role was ${requiredRole}`, {
        ...logContext,
        adminOverride: true,
        result: true,
      });
      return true;
    }

    const hasRole = user.roles.includes(requiredRole);

    this.logger.debug(`Role check ${hasRole ? 'passed' : 'failed'}`, {
      ...logContext,
      result: hasRole,
      adminOverride: false,
      decisionReason: hasRole ? 'role matched' : 'role did not match',
    });

    return hasRole;
  }

  public hasAnyRole(requiredRoles: string[]): boolean {
    const user = this.authService.currentUser;
    const logContext = {
      requiredRoles: requiredRoles.join(','),
      userRoles: user?.roles?.join(', ') || 'none',
      username: user?.username || 'anonymous',
      hasUser: !!user,
    };

    this.logger.debug('Multiple role check initiated', logContext);

    if (!user || !user.roles) {
      this.logger.debug('Multiple role check failed: No authenticated user or no roles', logContext);
      return false;
    }

    if (user.roles.includes('admin')) {
      this.logger.debug('Multiple role check passed: User is admin', {
        ...logContext,
        adminOverride: true,
        result: true,
      });
      return true;
    }

    const hasAnyRole = requiredRoles.some(role => user.roles.includes(role));

    this.logger.debug(`Multiple role check ${hasAnyRole ? 'passed' : 'failed'}`, {
      ...logContext,
      result: hasAnyRole,
      matchingRoles: requiredRoles.filter(role => user.roles.includes(role)).join(','),
      decisionReason: hasAnyRole ? 'user has one of the required roles' : 'user does not have any required roles',
    });

    return hasAnyRole;
  }

  public hasPermission(permission: string): Observable<boolean> {
    return combineLatest([this.authService.currentUser$, this.permissions$]).pipe(
      map(([user, permissions]) => {

        if (!user) {
          return false;
        }

        if (permissions.has(permission)) {
          return permissions.get(permission) || false;
        }

        if (user.roles?.includes('admin')) {
          return true;
        }

        if (user.roles && user.roles.length > 0) {

          const userPermissions = new Set<string>();

          for (const role of user.roles) {
            const rolePerms = this.roleDefinitions.get(role)?.permissions || [];
            rolePerms.forEach(p => userPermissions.add(p));
          }

          return userPermissions.has(permission);
        }

        return false;
      }),
      tap(result => {
        this.logger.debug(`Permission check for ${permission}`, {
          permission,
          result,
          username: this.authService.currentUser?.username || 'anonymous',
          userRoles: this.authService.currentUser?.roles?.join(', ') || 'none',
        });
      }),
    );
  }

  public hasPermission$(permission: string): Observable<boolean> {
    return this.hasPermission(permission);
  }

  public hasAllPermissions(permissions: string[]): Observable<boolean> {
    if (!permissions || permissions.length === 0) {
      return of(true);                           
    }

    return combineLatest(permissions.map(permission => this.hasPermission(permission))).pipe(
      map(results => results.every(Boolean)),
      tap(result => {
        this.logger.debug(`Checking multiple permissions`, {
          permissions: permissions.join(', '),
          result,
          username: this.authService.currentUser?.username || 'anonymous',
        });
      }),
    );
  }

  public hasAnyPermission(permissions: string[]): Observable<boolean> {
    if (!permissions || permissions.length === 0) {
      return of(false);                            
    }

    return combineLatest(permissions.map(permission => this.hasPermission(permission))).pipe(
      map(results => results.some(Boolean)),
      tap(result => {
        this.logger.debug(`Checking if user has any permission`, {
          permissions: permissions.join(', '),
          result,
          username: this.authService.currentUser?.username || 'anonymous',
        });
      }),
    );
  }

  public canAccess(roles: string[]): boolean {

    if (!roles || roles.length === 0) {
      return true;
    }

    return this.hasAnyRole(roles);
  }

  public canAccessWithPermission(permissions: string | string[]): Observable<boolean> {
    const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
    return this.hasAnyPermission(permissionsArray);
  }

  public processRequest(request: RequestWithUser): RequestWithUser {
    const user = this.authService.currentUser;

    if (user) {
      request.user = {
        id: user.id.toString(),
        username: user.username,
        email: user.email || '',
        roles: user.roles || [],
      };

      this.logger.debug('User information added to request', {
        userId: user.id.toString(),
        roles: user.roles?.join(',') || 'none',
      });
    }

    return request;
  }

  public clearPermissionsCache(): void {
    const cacheSize = this.permissionsCache.size;

    this.permissionsCache.clear();
    this.permissionsSubject.next(new Map());

    this.logger.debug('Permissions cache cleared', {
      previousSize: cacheSize,
      currentSize: 0,
    });
  }

  private loadUserPermissions(user: User): void {
    if (!user || !user.id) {
      return;
    }

    if (user.roles?.includes('admin')) {
      const adminPermissions = new Map<string, boolean>();

      Object.values(Permission).forEach(permission => {
        adminPermissions.set(permission, true);
      });

      this.permissionsSubject.next(adminPermissions);
      this.logger.debug('Admin user detected, granting all permissions', {
        username: user.username,
        userId: user.id,
      });

      return;
    }

    if (user.permissions && user.permissions.length > 0) {
      const permissions = new Map<string, boolean>();

      user.permissions.forEach(permission => {
        permissions.set(permission, true);
      });

      if (user.roles) {
        user.roles.forEach(role => {
          const rolePerms = this.roleDefinitions.get(role)?.permissions || [];
          rolePerms.forEach(permission => {
            permissions.set(permission, true);
          });
        });
      }

      this.permissionsSubject.next(permissions);
      this.logger.debug('Permissions loaded from user object', {
        userId: user.id,
        username: user.username,
        permissionCount: permissions.size,
      });

      return;
    }

    if (this.authService.isOffline) {
      this.logger.debug('Using role-based permissions in offline mode', {
        userId: user.id,
        username: user.username,
      });

      this.loadRoleBasedPermissions(user);
      return;
    }

    this.fetchUserPermissions(user.id.toString()).subscribe();
  }

  private loadRoleBasedPermissions(user: User): void {
    if (!user || !user.roles || user.roles.length === 0) {
      return;
    }

    const permissions = new Map<string, boolean>();

    user.roles.forEach(role => {
      const rolePerms = this.roleDefinitions.get(role)?.permissions || [];
      rolePerms.forEach(permission => {
        permissions.set(permission, true);
      });
    });

    this.permissionsSubject.next(permissions);

    this.logger.debug('Role-based permissions loaded', {
      userId: user.id,
      username: user.username,
      roles: user.roles.join(', '),
      permissionCount: permissions.size,
    });
  }

  private fetchUserPermissions(userId: string): Observable<Map<string, boolean>> {

    if (this.authService.isOffline) {
      return of(new Map<string, boolean>());
    }

    this.logger.debug('Fetching user permissions from API', {
      userId,
      timestamp: new Date().toISOString(),
    });

    const permissionsToCheck = Object.values(Permission);

    return this.simulatePermissionCheck(userId, permissionsToCheck).pipe(
      map(response => {
        const permissions = new Map<string, boolean>();

        Object.entries(response.permissions).forEach(([permission, isGranted]) => {
          permissions.set(permission, isGranted);
        });

        this.permissionsSubject.next(permissions);

        this.permissionsCache.set(userId, permissions);

        this.logger.debug('Retrieved permissions from API', {
          userId,
          permissionCount: permissions.size,
          timestamp: response.timestamp,
        });

        return permissions;
      }),
      catchError(error => {
        this.logger.error('Failed to fetch permissions from API', {
          error: error.message,
          status: error.status || 'unknown',
          userId,
        });

        const user = this.authService.currentUser;
        if (user) {
          this.loadRoleBasedPermissions(user);
        }

        return of(this.permissionsSubject.value);
      }),
    );
  }

  private simulatePermissionCheck(userId: string, permissions: string[]): Observable<PermissionCheckResponse> {

    const user = this.authService.currentUser;

    if (!user) {
      return of({
        userId,
        permissions: {},
        timestamp: new Date().toISOString(),
      });
    }

    const response: PermissionCheckResponse = {
      userId,
      permissions: {},
      timestamp: new Date().toISOString(),
    };

    const userRoles = user.roles || [];

    permissions.forEach(permission => {

      if (userRoles.includes('admin')) {
        Object.assign(response.permissions, { [permission]: true });
        return;
      }

      let isGranted = false;

      for (const role of userRoles) {
        const roleDefinition = this.roleDefinitions.get(role);
        if (roleDefinition && roleDefinition.permissions.includes(permission as Permission)) {
          isGranted = true;
          break;
        }
      }

      Object.assign(response.permissions, { [permission]: isGranted });
    });

    return of(response).pipe(
      tap(() =>
        this.logger.debug('Permission check response prepared', {
          userId,
          permissionCount: Object.keys(response.permissions).length,
          timestamp: response.timestamp,
        }),
      ),
    );
  }
}
