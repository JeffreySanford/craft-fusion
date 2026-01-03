import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, action: string = 'Close') {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar'],
    });
  }

  showError(message: string, action: string = 'Close', error?: any) {
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
  }

  showWarning(message: string, action: string = 'Close') {
    this.snackBar.open(message, action, {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['warning-snackbar'],
    });
  }

  showInfo(message: string, action: string = 'Close') {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['info-snackbar'],
    });
  }
}
