import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { AuthorizationService } from './authorization.service';
import { User, AuthResponse } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthFacadeService {
  constructor(
    private authService: AuthenticationService,
    private authzService: AuthorizationService,
  ) {}

  public get isLoggedIn$(): Observable<boolean> {
    return this.authService.isLoggedIn$;
  }

  public get isAdmin$(): Observable<boolean> {
    return this.authService.isAdmin$;
  }

  public get currentUser$(): Observable<User | null> {
    return this.authService.currentUser$;
  }

  public hasPermission(permission: string): Observable<boolean> {
    return this.authzService.hasPermission(permission);
  }

  public canAccess(roles: string[]): boolean {
    return this.authzService.canAccess(roles);
  }

  public login(username: string, password: string): Observable<AuthResponse> {
    return this.authService.login(username, password);
  }

  public logout(): void {

    this.authzService.clearPermissionsCache();
    this.authService.logout();
  }

  public canAccessWithPermission(permission: string): Observable<boolean> {
    return combineLatest([this.authService.isLoggedIn$, this.authzService.hasPermission(permission)]).pipe(map(([isLoggedIn, hasPermission]) => isLoggedIn && hasPermission));
  }
}
