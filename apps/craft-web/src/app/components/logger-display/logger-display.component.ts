import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '../../common/services/logger.service';
import { Subscription } from 'rxjs';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

@Component({
  selector: 'app-logger-display',
  templateUrl: './logger-display.component.html',
  styleUrls: ['./logger-display.component.scss', '../../../styles/_variables.scss'],
  standalone: false
})
export class LoggerDisplayComponent implements OnInit, OnDestroy {
  logs: { [level: string]: LogEntry[] } = {
    error: [],
    warn: [],
    info: [],
    log: []
  };
  private logsSubscription!: Subscription;

  constructor(private loggerService: LoggerService) {}

  ngOnInit(): void {
    this.logsSubscription = this.loggerService.logs$.subscribe(logs => {
      this.processLogs(logs);
    });
  }

  ngOnDestroy(): void {
    if (this.logsSubscription) {
      this.logsSubscription.unsubscribe();
    }
  }

  private processLogs(logs: string[]): void {
    this.logs = { error: [], warn: [], info: [], log: [] }; // Reset logs

    logs.forEach(log => {
      const match = log.match(/\[(.*?)\]\s(.*?):\s(.*)/);
      if (match) {
        const timestamp = match[1];
        const level = match[2].toLowerCase();
        const message = match[3];

        const logEntry: LogEntry = { timestamp, level, message };
        if (this.logs[level]) {
          this.logs[level].push(logEntry);
        } else {
          this.logs['info'].push(logEntry); // Default to info if level is unknown
        }
      } else {
        // Handle logs that don't match the expected format
        const logEntry: LogEntry = { timestamp: new Date().toLocaleTimeString(), level: 'info', message: log };
        this.logs['info'].push(logEntry);
      }
    });
  }
}
