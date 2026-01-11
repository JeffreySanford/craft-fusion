import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoggerService, LogEntry, LogLevel } from '../../../common/services/logger.service';

@Component({
  selector: 'app-logs-dashboard',
  template: `
    <div class="logs-dashboard-root">
      <div class="log-statistics">
        <div class="stat-card" *ngFor="let stat of stats">
          <div class="stat-icon" [appBgColor]="stat.color">
            <mat-icon>{{ stat.icon }}</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
      <app-logs></app-logs>
    </div>
  `,
  styles: [``],
  standalone: false,
})
export class LogsDashboardComponent implements OnInit, OnDestroy {
  stats: { id: number; icon: string; label: string; value: number; color: string }[] = [];
  private sub?: Subscription;

  constructor(private logger: LoggerService) {}

  ngOnInit() {
    this.computeStats();
    this.sub = this.logger.logAdded$.subscribe(() => this.computeStats());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private computeStats() {
    const logs = this.logger.getLogs();
    const counts = { error: 0, warn: 0, info: 0 };
    logs.forEach((l: LogEntry) => {
      if (l.level === LogLevel.ERROR) counts.error++;
      else if (l.level === LogLevel.WARN) counts.warn++;
      else if (l.level === LogLevel.INFO) counts.info++;
    });
    this.stats = [
      { id: 1, icon: 'error', label: 'Errors', value: counts.error, color: 'red' },
      { id: 2, icon: 'warning', label: 'Warnings', value: counts.warn, color: 'orange' },
      { id: 3, icon: 'info', label: 'Info', value: counts.info, color: 'blue' },
    ];
  }
}
