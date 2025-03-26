import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-data-visualizations',
  templateUrl: './data-visualizations.component.html',
  styleUrls: ['./data-visualizations.component.scss']
})
export class DataVisualizationsComponent implements OnInit, OnDestroy {
  private destroyed = false;

  constructor(
    private viewRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Initialization code
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    // Additional cleanup code
  }

  // Example method where change detection is needed
  someMethod(): void {
    if (!this.destroyed) {
      this.ngZone.run(() => {
        setTimeout(() => {
          if (!this.destroyed) {
            this.viewRef.markForCheck();
          }
        });
      });
    }
  }
}