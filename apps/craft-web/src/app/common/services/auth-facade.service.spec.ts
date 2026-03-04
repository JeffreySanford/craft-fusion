import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthFacadeService } from './auth-facade.service';
import { AuthenticationService } from './authentication.service';
import { AuthorizationService } from './authorization.service';
import { of, firstValueFrom } from 'rxjs';

describe('AuthFacadeService', () => {
  let service: AuthFacadeService;
  let authService: Partial<AuthenticationService>;
  let authzService: Partial<AuthorizationService>;

  beforeEach(() => {
    authService = {
      isLoggedIn$: of(true),
      isAdmin$: of(false),
      currentUser$: of(null),
      login: vi.fn(),
      logout: vi.fn(),
    } as Partial<AuthenticationService>;
    authzService = {
      hasPermission: vi.fn().mockReturnValue(of(true)),
      canAccess: vi.fn().mockReturnValue(true),
      clearPermissionsCache: vi.fn(),
    } as Partial<AuthorizationService>;

    TestBed.configureTestingModule({
      providers: [
        AuthFacadeService,
        { provide: AuthenticationService, useValue: authService },
        { provide: AuthorizationService, useValue: authzService },
      ],
    });
    service = TestBed.inject(AuthFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should delegate hasPermission', async () => {
    const res = await firstValueFrom(service.hasPermission('foo'));
    expect(res).toBe(true);
  });

  it('should delegate canAccess', () => {
    expect(service.canAccess(['a'])).toBe(true);
  });

  it('logout should clear cache and call auth logout', () => {
    service.logout();
    expect(authzService.clearPermissionsCache).toHaveBeenCalled();
    expect(authService.logout).toHaveBeenCalled();
  });
});
