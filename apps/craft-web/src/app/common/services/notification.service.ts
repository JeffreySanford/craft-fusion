import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar, private logger: LoggerService) {
    this.logger.registerService('NotificationService');
  }

  showSuccess(message: string, action: string = 'Close') {
    const callId = this.logger.startServiceCall('NotificationService', 'SHOW', '/notification/success');
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar'],
    });
    this.logger.endServiceCall(callId, 200);
  }

  showError(message: string, action: string = 'Close', error?: any) {
    const callId = this.logger.startServiceCall('NotificationService', 'SHOW', '/notification/error');
    if (error) {
      // Keep a lightweight console log for developers; avoid leaking secrets in production
      // The NotificationService is intentionally lightweight to avoid introducing heavy deps
      // eslint-disable-next-line no-console
      console.error(error);
    }
    this.snackBar.open(message, action, {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar'],
    });
    this.logger.endServiceCall(callId, 200);
  }

  showWarning(message: string, action: string = 'Close') {
    const callId = this.logger.startServiceCall('NotificationService', 'SHOW', '/notification/warning');
    this.snackBar.open(message, action, {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['warning-snackbar'],
    });
    this.logger.endServiceCall(callId, 200);
  }

  showInfo(message: string, action: string = 'Close') {
    const callId = this.logger.startServiceCall('NotificationService', 'SHOW', '/notification/info');
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['info-snackbar'],
    });
    this.logger.endServiceCall(callId, 200);
  }
}
