import { Component, OnInit } from '@angular/core';
import { TimelineService } from '../../services/timeline.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimelineEvent } from '../../models/timeline-event.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-memorial-timeline',
  templateUrl: './memorial-timeline.component.html',
  styleUrls: ['./memorial-timeline.component.scss'],
  standalone: false, // Explicitly set standalone to false
})
export class MemorialTimelineComponent implements OnInit {
  timelineEvents$: Observable<TimelineEvent[]>;
  filteredEvents$: Observable<TimelineEvent[]>;
  private filter$ = new BehaviorSubject<string>('all');
  loading = true;

  constructor(
    private timelineService: TimelineService,
    private router: Router,
  ) {
    this.timelineEvents$ = this.timelineService.events$;
    this.filteredEvents$ = combineLatest([this.timelineEvents$, this.filter$]).pipe(
      map(([events, filter]) => {
        if (!events) return [];
        if (filter === 'all') return events;
        if (filter === 'jeffrey-ai') return events.filter(e => e.title.toLowerCase().includes('jeffrey'));
        return events.filter(e => e.type === filter);
      }),
    );
  }

  ngOnInit(): void {
    // Load initial events from API (including seeded events in dev)
    this.timelineService.loadInitialEvents().subscribe(() => {
      this.timelineService.connect();
      this.loading = false;
    });
  }

  onFilterChange(value: string) {
    if (value === 'jeffrey-ai') {
      // Navigate to the dedicated AI route
      this.router.navigate(['projects', 'family', 'memorial-timeline', 'jeffrey-ai']);
    } else {
      this.filter$.next(value);
    }
  }

  ngOnDestroy(): void {
    this.timelineService.disconnect();
  }
}
