import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { LoggerService } from '../../services/logger.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-server-status',
  template: `
    <div class="server-status" *ngIf="showStatus">
      <div class="status-indicator" [class.online]="isServerOnline" [class.offline]="!isServerOnline">
        <span class="status-text">Backend server: {{ isServerOnline ? 'Online' : 'Offline' }}</span>
        <button mat-button *ngIf="!isServerOnline" (click)="checkServerStatus()">Retry Connection</button>
      </div>
    </div>
  `,
  styles: [
    `
      .server-status {
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 1000;
      }
      .status-indicator {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .online {
        background-color: rgba(76, 175, 80, 0.8);
        color: white;
      }
      .offline {
        background-color: rgba(244, 67, 54, 0.8);
        color: white;
      }
      .status-text {
        font-weight: 500;
      }
    `,
  ],
  standalone: false, // Explicitly marking as non-standalone
})
export class ServerStatusComponent implements OnInit, OnDestroy {
  public isServerOnline = false;
  public showStatus = !environment.production;

  private destroy$ = new Subject<void>();
  private checkInterval = 30000; // 30 seconds

  constructor(
    private apiService: ApiService,
    private logger: LoggerService,
  ) {
    this.logger.registerService('ServerStatusComponent');
  }

  ngOnInit(): void {
    // Only show in non-production environments
    if (!environment.production) {
      this.checkServerStatus();

      // Set up periodic checks
      interval(this.checkInterval)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.performCheck()),
        )
        .subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public checkServerStatus(): void {
    this.performCheck().subscribe();
  }

  private performCheck() {
    this.logger.debug('Checking server status');

    return this.apiService.get('health').pipe(
      catchError(err => {
        this.isServerOnline = false;
        this.logger.warn('Backend server is offline', {
          error: err.message || 'Unknown error',
          status: err.status || 'unknown',
        });
        return [];
      }),
    );
  }
}
