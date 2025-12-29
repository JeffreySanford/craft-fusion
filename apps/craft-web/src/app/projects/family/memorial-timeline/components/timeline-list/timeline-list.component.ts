import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineEvent } from '../../models/timeline-event.model';

@Component({
  selector: 'app-timeline-list',
  templateUrl: './timeline-list.component.html',
  styleUrls: ['./timeline-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // Ensure standalone is explicitly false
})
export class TimelineListComponent {
  @Input() events: TimelineEvent[] | null = [];

  trackById(index: number, event: TimelineEvent): string {
    return event.id;
  }

  getFormattedDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
