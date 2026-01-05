import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { TimelineEvent, TimelineEventType } from '../../models/timeline-event.model';
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
  timelineEvents$: Observable<TimelineEvent[]>;
  filteredEvents$: Observable<TimelineEvent[]>;
  private filter$ = new BehaviorSubject<'all' | TimelineEventType | 'jeffrey-historical'>('all');
  selectedFilter: 'all' | TimelineEventType | 'jeffrey-historical' = 'all';

  private destroy$ = new Subject<void>();

  constructor(private timelineService: TimelineService) {
    this.timelineEvents$ = this.timelineService.events$;
    this.filteredEvents$ = combineLatest([this.timelineEvents$, this.filter$]).pipe(
      map(([events, filter]) => {
        if (filter === 'all') {
          return events;
        }
        if (filter === 'jeffrey-historical') {
          return events.filter(event =>
            event.type === 'historical' &&
            (event.title.toLowerCase().includes('jeffrey') ||
             event.description.toLowerCase().includes('jeffrey'))
          );
        }
        return events.filter(event => event.type === filter);
      }),
    );
  }

  ngOnInit(): void {

    this.timelineService
      .loadInitialEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: error => {
          console.error('Error loading timeline events:', error);
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

  onFilterChange(filter: 'all' | TimelineEventType | 'jeffrey-historical'): void {
    this.selectedFilter = filter;
    this.filter$.next(filter);
  }
}
