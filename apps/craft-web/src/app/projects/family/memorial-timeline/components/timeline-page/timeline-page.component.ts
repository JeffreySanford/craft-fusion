import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimelineService } from '../../services/timeline.service';
import { TimelineEvent } from '../../models/timeline-event.model';
import { Observable, Subscription } from 'rxjs';
import { LoggerService } from '../../../../../common/services/logger.service';

@Component({
  selector: 'app-timeline-page',
  templateUrl: './timeline-page.component.html',
  styleUrls: ['./timeline-page.component.scss'],
  standalone: false
})
export class TimelinePageComponent implements OnInit, OnDestroy {
  public timelineEvents$: Observable<TimelineEvent[]>;
  public loading = true; // Explicitly make public
  private subscription: Subscription = new Subscription();
  
  constructor(
    private timelineService: TimelineService,
    private logger: LoggerService
  ) {
    this.timelineEvents$ = this.timelineService.events$;
  }
  
  ngOnInit(): void {
    this.timelineService.connect();
    this.subscription.add(
      this.timelineService.loadInitialEvents().subscribe({
        next: () => this.loading = false,
        error: err => {
          this.loading = false;
          this.logger.error('Failed to load timeline events', err);
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.timelineService.disconnect();
    this.subscription.unsubscribe();
  }
}
