import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AuthResponse } from '../user.interface';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly isAuthenticated$: Observable<boolean>;
  readonly isAdmin$: Observable<boolean>;
  readonly isLoggedIn$: Observable<boolean>;

  constructor(
    private authenticationService: AuthenticationService,
    private logger: LoggerService,
  ) {
    this.isAuthenticated$ = this.authenticationService.isLoggedIn$;
    this.isAdmin$ = this.authenticationService.isAdmin$;
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;

    this.logger.registerService('AuthService');
    this.logger.info('Auth Service facade initialized');
  }

  initializeAuthentication(): void {
    this.authenticationService.initializeAuthentication();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.authenticationService.login(username, password);
  }

  logout(): void {
    this.authenticationService.logout();
  }

  getAuthToken(): string | null {
    return this.authenticationService.getAuthToken();
  }
}
