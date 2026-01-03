import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TimelineEvent } from '../../models/timeline-event.model';

@Component({
  selector: 'app-timeline-item',
  templateUrl: './timeline-item.component.html',
  styleUrls: ['./timeline-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,                                         
})
export class TimelineItemComponent {
  @Input() event!: TimelineEvent;
  expanded = false;
  private readonly descriptionPreviewLength = 160;

  get formattedDate(): string {
    return new Date(this.event.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  get hasLongDescription(): boolean {
    return (this.event?.description?.length || 0) > this.descriptionPreviewLength;
  }

  get descriptionPreview(): string {
    if (!this.event?.description) {
      return '';
    }

    const preview = this.event.description.slice(0, this.descriptionPreviewLength).trimEnd();
    return this.hasLongDescription ? `${preview}...` : preview;
  }

  get typeLabel(): string | null {
    if (!this.event?.type) {
      return null;
    }

    return `${this.event.type.charAt(0).toUpperCase()}${this.event.type.slice(1)}`;
  }

  get iconName(): string {
    switch (this.event?.type) {
      case 'historical':
        return 'history';
      case 'personal':
        return 'person';
      case 'family':
        return 'family_restroom';
      case 'project':
        return 'code';
      case 'anniversary':
        return 'event';
      default:
        return 'star';
    }
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }
}
