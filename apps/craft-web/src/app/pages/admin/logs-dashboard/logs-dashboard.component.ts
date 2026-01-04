import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoggerService, LogEntry, LogLevel } from '../../../common/services/logger.service';

@Component({
  selector: 'app-logs-dashboard',
  templateUrl: './logs-dashboard.component.html',
  styleUrls: ['./logs-dashboard.component.scss'],
  standalone: false,
})
export class LogsDashboardComponent implements OnInit, OnDestroy {
  stats: { id: number; icon: string; label: string; value: number; accent: string; hint: string }[] = [];
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
    const total = logs.length;
    this.stats = [
      { id: 1, icon: 'error', label: 'Errors', value: counts.error, accent: 'error', hint: 'Action required' },
      { id: 2, icon: 'warning', label: 'Warnings', value: counts.warn, accent: 'warn', hint: 'Investigate soon' },
      { id: 3, icon: 'info', label: 'Info', value: counts.info, accent: 'info', hint: 'Informational' },
      { id: 4, icon: 'timeline', label: 'Total events', value: total, accent: 'total', hint: 'In memory' },
    ];
  }
}
