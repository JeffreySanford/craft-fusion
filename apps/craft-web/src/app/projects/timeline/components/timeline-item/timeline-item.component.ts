import { Component, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { TimelineEvent } from '../../models/timeline-event.model';

type TimelineSide = 'left' | 'right';

interface TitleLines {
  primary: string;
  secondary?: string;
}

@Component({
  selector: 'app-timeline-item',
  templateUrl: './timeline-item.component.html',
  styleUrls: ['./timeline-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,                                         
})
export class TimelineItemComponent {
  @Input() side: TimelineSide = 'left';
  expanded = false;

  private _event: TimelineEvent = {
    id: '',
    title: '',
    date: new Date(),
    description: '',
  };
  titleLines: TitleLines = { primary: '' };

  @HostBinding('class.timeline-event--historical')
  get isHistorical(): boolean {
    return this.event?.type === 'historical';
  }

  @HostBinding('class.timeline-event--personal')
  get isPersonal(): boolean {
    return this.event?.type === 'personal';
  }

  @HostBinding('class.timeline-event--family')
  get isFamily(): boolean {
    return this.event?.type === 'family';
  }

  @HostBinding('class.timeline-event--project')
  get isProject(): boolean {
    return this.event?.type === 'project';
  }

  @HostBinding('class.timeline-event--anniversary')
  get isAnniversary(): boolean {
    return this.event?.type === 'anniversary';
  }

  @HostBinding('class.timeline-event--timeline')
  get isTimeline(): boolean {
    return this.event?.type === 'timeline';
  }

  @HostBinding('class.timeline-item--left')
  get isLeftSide(): boolean {
    return this.side === 'left';
  }

  @HostBinding('class.timeline-item--right')
  get isRightSide(): boolean {
    return this.side === 'right';
  }

  @Input()
  set event(value: TimelineEvent) {
    this._event = value;
    this.titleLines = this.buildTitleLines(value?.title ?? '');
  }

  get event(): TimelineEvent {
    return this._event;
  }

  get formattedDate(): string {
    if (!this.event?.date) {
      return '';
    }

    return new Date(this.event.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  get hasDescription(): boolean {
    return !!this.event?.description?.trim();
  }

  get typeLabel(): string | null {
    if (!this.event?.type) {
      return null;
    }

    return `${this.event.type.charAt(0).toUpperCase()}${this.event.type.slice(1)}`;
  }

  get cardTypeClass(): string {
    if (!this.event?.type) {
      return '';
    }

    return `timeline-item-card--${this.event.type}`;
  }

  get cardStateClass(): string {
    return this.expanded ? 'timeline-item-card--expanded' : 'timeline-item-card--collapsed';
  }

  get iconName(): string {
    switch (this.event?.type) {
      case 'historical':
        return 'history';
      case 'personal':
        return 'person';
      case 'timeline':
        return 'schedule';
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

  private buildTitleLines(title: string): TitleLines {
    const normalized = title.trim();
    if (!normalized) {
      return { primary: 'Untitled Event' };
    }

    const lower = normalized.toLowerCase();
    const atIndex = lower.lastIndexOf(' at ');
    if (atIndex > 0) {
      const primary = normalized.slice(0, atIndex).trim();
      const secondary = normalized.slice(atIndex + 4).trim();
      if (primary && secondary) {
        return { primary, secondary };
      }
    }

    const dashIndex = normalized.indexOf(' - ');
    if (dashIndex > 0) {
      const primary = normalized.slice(0, dashIndex).trim();
      const secondary = normalized.slice(dashIndex + 3).trim();
      if (primary && secondary) {
        return { primary, secondary };
      }
    }

    return { primary: normalized };
  }
}
