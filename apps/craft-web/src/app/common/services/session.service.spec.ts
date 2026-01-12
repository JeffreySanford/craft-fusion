import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SessionService } from './session.service';
import { LoggerService } from './logger.service';
import { User } from './user.interface';

describe('SessionService', () => {
  let service: SessionService;
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionService, LoggerService]
    });
    service = TestBed.inject(SessionService);
    logger = TestBed.inject(LoggerService);
    sessionStorage.clear();
    logger.clearMetrics();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should track metrics for setUserSession', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: '',
      roles: ['user'],
      role: 'user'
    };

    service.setUserSession(mockUser);
    const metrics = logger.getServiceMetrics();
    const sessionMetrics = metrics.filter(m => m.serviceName === 'SessionService');
    expect(sessionMetrics.length).toBeGreaterThan(0);
  });

  it('should track metrics for validateToken', async () => {
    sessionStorage.setItem('username', 'testtoken');
    
    const isValid = await firstValueFrom(service.validateToken('testtoken'));
    expect(isValid).toBe(true);
    
    // Give a small delay for metrics to be recorded
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const metrics = logger.getServiceMetrics();
    const validateMetrics = metrics.filter(m => m.serviceName === 'SessionService');
    expect(validateMetrics.length).toBeGreaterThan(0);
  });
});
