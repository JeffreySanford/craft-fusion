import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TimelineEvent } from '../../models/timeline-event.model';

@Component({
  selector: 'app-timeline-item',
  templateUrl: './timeline-item.component.html',
  styleUrls: ['./timeline-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // Ensure standalone is explicitly false
})
export class TimelineItemComponent {
  @Input() event!: TimelineEvent;
  
  get formattedDate(): string {
    return new Date(this.event.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
