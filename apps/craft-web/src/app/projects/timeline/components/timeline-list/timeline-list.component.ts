import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { scaleTime } from 'd3-scale';
import { TimelineEvent } from '../../models/timeline-event.model';

type TimelineSide = 'left' | 'right';

interface TimelineListEntry {
  yearLabel?: number;
  event?: TimelineEvent;
  side?: TimelineSide;
}

interface MiniTimelineMarker {
  id: string;
  position: number;
  icon: string;
  title: string;
  dateLabel: string;
  animationDelay: string;
}

const TIMELINE_LIST_TEMPLATE = `
<div class="timeline-list">
  <ng-container *ngIf="timelineEntries.length > 0; else noEvents">
    <div class="timeline-list-scroll">
      <div class="timeline-list-content">
        <ng-container *ngFor="let entry of timelineEntries; trackBy: trackById; let i = index">
        <div *ngIf="entry.yearLabel" class="timeline-year">
          <span>{{ entry.yearLabel }}</span>
        </div>
        <div
          *ngIf="entry.event"
          class="timeline-entry"
          [attr.id]="'timeline-event-' + entry.event.id">
          <app-timeline-item
            [event]="entry.event"
            [side]="entry.side ?? 'left'"
            class="animate-fade-in"
            [appSparkle]="isJeffreyHistoricalEvent(entry.event)"
            [style.animation-delay.ms]="i * 200">
          </app-timeline-item>
        </div>
      </ng-container>
    </div>
  </div>

    <div *ngIf="miniTimelineMarkers.length" class="timeline-mini-strip" aria-label="Mini timeline overview">
      <div class="timeline-mini-strip__header">
        <p class="timeline-mini-strip__eyebrow">Life capsule</p>
        <span class="timeline-mini-strip__range">{{ miniTimelineRangeLabel }}</span>
      </div>

        <div class="timeline-mini-strip__track">
          <div class="timeline-mini-strip__glow"></div>
          <div class="timeline-mini-strip__line"></div>
          <button
            *ngFor="let marker of miniTimelineMarkers; let idx = index"
            type="button"
            class="timeline-mini-strip__marker"
            [class.timeline-mini-strip__marker--above]="idx % 2 === 0"
            [style.left.%]="marker.position"
            [style.animation-delay]="marker.animationDelay"
            [attr.title]="marker.title + ' · ' + marker.dateLabel"
            [attr.aria-label]="marker.title + ' ' + marker.dateLabel"
            (click)="scrollToEvent(marker.id)">
            <span class="timeline-mini-strip__marker-dot"></span>
          </button>
        </div>

    </div>
  </ng-container>

  <ng-template #noEvents>
    <div class="no-events-container">
      <mat-icon>event_busy</mat-icon>
      <p>No timeline events found.</p>
    </div>
  </ng-template>
</div>
`;

@Component({
  selector: 'app-timeline-list',
  template: TIMELINE_LIST_TEMPLATE,
  styleUrls: ['./timeline-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,                                         
})
export class TimelineListComponent {
  private _events: TimelineEvent[] = [];
  timelineEntries: TimelineListEntry[] = [];
  miniTimelineMarkers: MiniTimelineMarker[] = [];
  miniTimelineRangeLabel = '';

  @Input()
  set events(value: TimelineEvent[] | null) {
    this._events = value ?? [];
    this.timelineEntries = this.buildTimelineEntries(this._events);
    this.miniTimelineMarkers = this.createMiniTimelineMarkers(this._events);
  }

  get events(): TimelineEvent[] {
    return this._events;
  }

  trackById(index: number, entry: TimelineListEntry): string {
    return entry.event?.id ?? `year-${entry.yearLabel}-${index}`;
  }

  isJeffreyHistoricalEvent(event: TimelineEvent): boolean {
    return event.type === 'historical' &&
      (event.title.toLowerCase().includes('jeffrey') ||
        event.description.toLowerCase().includes('jeffrey'));
  }

  private buildTimelineEntries(events: TimelineEvent[]): TimelineListEntry[] {
    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const entries: TimelineListEntry[] = [];
    let currentYear: number | null = null;
    let side: TimelineSide = 'left';

    sorted.forEach(event => {
      const year = new Date(event.date).getFullYear();
      if (year !== currentYear) {
        currentYear = year;
        entries.push({ yearLabel: year });
      }

      entries.push({ event, side });
      side = side === 'left' ? 'right' : 'left';
    });
    return entries;
  }

  getFormattedDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private createMiniTimelineMarkers(events: TimelineEvent[]): MiniTimelineMarker[] {
    if (!events.length) {
      this.miniTimelineRangeLabel = '';
      return [];
    }

    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const timestamps = sorted.map(event => new Date(event.date).getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    const padding = 12 * 24 * 60 * 60 * 1000;
    const domainStart = min === max ? min - padding : min;
    const domainEnd = min === max ? max + padding : max;
    const scale = scaleTime().domain([new Date(domainStart), new Date(domainEnd)]).range([0, 100]);

    this.miniTimelineRangeLabel = `${new Date(min).toLocaleDateString('en-US', { year: 'numeric' })} – ${new Date(
      max,
    ).toLocaleDateString('en-US', { year: 'numeric' })}`;

    return sorted.map((event, index) => ({
      id: event.id ?? `marker-${index}`,
      position: scale(new Date(event.date)),
      icon: this.getSummaryIcon(event.type),
      title: event.title,
      dateLabel: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      animationDelay: `${index * 80}ms`,
    }));
  }

  scrollToEvent(eventId: string): void {
    if (!eventId) {
      return;
    }

    const element = document.getElementById(`timeline-event-${eventId}`);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private getSummaryIcon(type?: TimelineEvent['type']): string {
    switch (type) {
      case 'historical':
        return 'history';
      case 'personal':
        return 'person';
      case 'family':
        return 'groups';
      case 'project':
        return 'code';
      case 'anniversary':
        return 'event';
      case 'professional':
        return 'work';
      case 'education':
        return 'school';
      default:
        return 'star';
    }
  }
}
