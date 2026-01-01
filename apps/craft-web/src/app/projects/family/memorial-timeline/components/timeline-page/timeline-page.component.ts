import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';                              
import { takeUntil } from 'rxjs/operators';
import { TimelineEvent } from '../../models/timeline-event.model';                         
import { TimelineService } from '../../services/timeline.service';

@Component({
  selector: 'app-timeline-page',
  templateUrl: './timeline-page.component.html',
  styleUrls: ['./timeline-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,                                         
})
export class TimelinePageComponent implements OnInit, OnDestroy {

  loading: boolean = true;                            
  timelineEvents$: Observable<TimelineEvent[]> = of([]);                                                     

  private destroy$ = new Subject<void>();

  constructor(private timelineService: TimelineService) {}

  ngOnInit(): void {

    this.timelineService
      .loadInitialEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: events => {
          this.timelineEvents$ = of(events);
          this.loading = false;
        },
        error: error => {
          console.error('Error loading timeline events:', error);
          this.timelineEvents$ = of([]);
          this.loading = false;
        },
      });

    this.timelineService.connect();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timelineService.disconnect();
  }
}
