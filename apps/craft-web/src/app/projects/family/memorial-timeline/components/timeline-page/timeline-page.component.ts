import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of } from 'rxjs'; // Import Observable and 'of'
import { TimelineEvent } from '../../models/timeline-event.model'; // Assuming model exists

@Component({
  selector: 'app-timeline-page',
  templateUrl: './timeline-page.component.html',
  styleUrls: ['./timeline-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // Ensure standalone is explicitly false
})
export class TimelinePageComponent implements OnInit {
  // Add missing properties
  loading: boolean = true; // Initialize loading state
  timelineEvents$: Observable<TimelineEvent[]> = of([]); // Initialize with an empty observable or fetch data

  constructor() { }

  ngOnInit(): void {
    // Simulate data loading
    setTimeout(() => {
      // Replace with actual data fetching logic
      // Corrected the 'id' type from number to string to match TimelineEvent model
      this.timelineEvents$ = of([
        { id: '1', date: new Date('1945-08-15'), title: 'Event 1', description: 'Description for event 1', imageUrl: 'path/to/image1.jpg' },
        { id: '2', date: new Date('1969-07-20'), title: 'Event 2', description: 'Description for event 2', imageUrl: 'path/to/image2.jpg' }
      ]);
      this.loading = false;
      // Manually trigger change detection if needed with ChangeDetectionStrategy.OnPush
      // this.cdr.markForCheck(); 
    }, 2000); // Simulate 2 second load time
  }
}
