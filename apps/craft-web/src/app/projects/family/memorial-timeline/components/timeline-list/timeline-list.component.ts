import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TimelineEvent } from '../../models/timeline-event.model';

@Component({
  selector: 'app-timeline-list',
  templateUrl: './timeline-list.component.html',
  styleUrls: ['./timeline-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,                                         
})
export class TimelineListComponent {
  @Input() events: TimelineEvent[] | null = [];

  trackById(index: number, event: TimelineEvent): string {
    return event.id;
  }

  isJeffreyHistoricalEvent(event: TimelineEvent): boolean {
    return event.type === 'historical' &&
           (event.title.toLowerCase().includes('jeffrey') ||
            event.description.toLowerCase().includes('jeffrey'));
  }

  getFormattedDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
