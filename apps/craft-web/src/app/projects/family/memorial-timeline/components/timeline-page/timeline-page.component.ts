import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Observable, of, Subject } from 'rxjs'; // Import Observable and 'of'
import { takeUntil } from 'rxjs/operators';
import { TimelineEvent } from '../../models/timeline-event.model'; // Assuming model exists
import { TimelineService } from '../../services/timeline.service';

@Component({
  selector: 'app-timeline-page',
  templateUrl: './timeline-page.component.html',
  styleUrls: ['./timeline-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false, // Ensure standalone is explicitly false
})
export class TimelinePageComponent implements OnInit, OnDestroy {
  // Add missing properties
  loading: boolean = true; // Initialize loading state
  timelineEvents$: Observable<TimelineEvent[]> = of([]); // Initialize with an empty observable or fetch data

  private destroy$ = new Subject<void>();

  constructor(private timelineService: TimelineService) {}

  ngOnInit(): void {
    // Load initial timeline events
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

    // Connect to WebSocket for real-time updates
    this.timelineService.connect();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timelineService.disconnect();
  }
}
