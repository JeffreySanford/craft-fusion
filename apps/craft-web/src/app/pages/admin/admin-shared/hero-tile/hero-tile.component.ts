import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export type HeroTileStatus = 'ok' | 'warning' | 'critical';

@Component({
  selector: 'app-hero-tile',
  templateUrl: './hero-tile.component.html',
  styleUrls: ['./hero-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HeroTileComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() subLabel = '';
  @Input() icon = '';
  @Input() status: HeroTileStatus = 'ok';
  @Input() detail = '';
  @Input() delta = 0;
  @Input() showPulse = false;
  @Input() clickable = false;

  @Output() tileClick = new EventEmitter<void>();

  get statusClass(): string {
    return `status-${this.status}`;
  }

  get deltaClass(): string {
    if (this.delta > 0) return 'delta-positive';
    if (this.delta < 0) return 'delta-negative';
    return 'delta-neutral';
  }

  get deltaIcon(): string {
    if (this.delta > 0) return 'trending_up';
    if (this.delta < 0) return 'trending_down';
    return 'trending_flat';
  }

  onTileClick(): void {
    if (this.clickable) {
      this.tileClick.emit();
    }
  }
}
