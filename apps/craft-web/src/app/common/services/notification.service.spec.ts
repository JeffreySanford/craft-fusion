import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationService } from './notification.service';
import { LoggerService } from './logger.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, NoopAnimationsModule],
      providers: [NotificationService, LoggerService]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call showSuccess without errors', () => {
    expect(() => service.showSuccess('Test success')).not.toThrow();
  });

  it('should call showError without errors', () => {
    expect(() => service.showError('Test error')).not.toThrow();
  });

  it('should call showWarning without errors', () => {
    expect(() => service.showWarning('Test warning')).not.toThrow();
  });

  it('should call showInfo without errors', () => {
    expect(() => service.showInfo('Test info')).not.toThrow();
  });
});
