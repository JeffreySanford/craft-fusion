import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '../../common/services/logger.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-logger-display',
  templateUrl: './logger-display.component.html',
  styleUrls: ['./logger-display.component.scss'],
  standalone: false
})
export class LoggerDisplayComponent implements OnInit, OnDestroy {
  logs: string[] = [];
  private logsSubscription!: Subscription;

  constructor(private loggerService: LoggerService) {}

  ngOnInit(): void {
    this.logsSubscription = this.loggerService.logs$.subscribe(logs => {
      this.logs = logs;
    });
  }

  ngOnDestroy(): void {
    if (this.logsSubscription) {
      this.logsSubscription.unsubscribe();
    }
  }
}
