import { Component, OnInit } from '@angular/core';
import { TimelineService } from '../../services/timeline.service';
import { Observable } from 'rxjs';
import { TimelineEvent } from '../../models/timeline-event.model';

@Component({
  selector: 'app-memorial-timeline',
  templateUrl: './memorial-timeline.component.html',
  styleUrls: ['./memorial-timeline.component.scss'],
  standalone: false // Explicitly set standalone to false
})
export class MemorialTimelineComponent implements OnInit {
  timelineEvents$: Observable<TimelineEvent[]>;
  loading = true;
  
  constructor(private timelineService: TimelineService) {
    this.timelineEvents$ = this.timelineService.events$;
  }
  
  ngOnInit(): void {
    this.timelineService.connect();
    this.loading = false;
  }
  
  ngOnDestroy(): void {
    this.timelineService.disconnect();
  }
}
