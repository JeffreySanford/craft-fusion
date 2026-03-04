import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthorizationService } from './authorization.service';
import { AuthenticationService } from './authentication.service';
import { LoggerService } from './logger.service';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let authService: Partial<AuthenticationService>;

  beforeEach(() => {
    const userSubject = new (require('rxjs').BehaviorSubject)(null);
    authService = {
      currentUser: { id: 1, username: 'user', roles: ['user'], name: '', firstName: '', lastName: '', email: '', password: '' },
      currentUser$: userSubject.asObservable(),
    } as Partial<AuthenticationService>;

    TestBed.configureTestingModule({
      providers: [
        AuthorizationService,
        { provide: AuthenticationService, useValue: authService },
        LoggerService,
      ],
    });
    service = TestBed.inject(AuthorizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getRoleName returns readable name or key', () => {
    expect(service.getRoleName('admin')).toBe('Administrator');
    expect(service.getRoleName('foo')).toBe('foo');
  });

  it('getAvailableRoles contains entries', () => {
    const roles = service.getAvailableRoles();
    expect(roles.length).toBeGreaterThan(0);
    expect(roles[0]).toHaveProperty('permissions');
  });

  it('hasRole returns false when role not possessed', () => {
    Object.defineProperty(authService, 'currentUser', { value: { id:1, username:'u', roles:['user'], name:'', firstName:'', lastName:'', email:'', password:'' } });
    expect(service.hasRole('admin')).toBe(false);
  });

  it('hasRole returns true when user is admin', () => {
    Object.defineProperty(authService, 'currentUser', { value: { id:1, username:'u', roles:['admin'], name:'', firstName:'', lastName:'', email:'', password:'' } });
    expect(service.hasRole('user')).toBe(true);
  });
});
