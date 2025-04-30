import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Import Angular Material modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Import components
import { TimelinePageComponent } from './components/timeline-page/timeline-page.component';
import { TimelineListComponent } from './components/timeline-list/timeline-list.component';
import { TimelineItemComponent } from './components/timeline-item/timeline-item.component';
import { MemorialTimelineComponent } from './components/memorial-timeline/memorial-timeline.component';

@NgModule({
  declarations: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent,
    MemorialTimelineComponent // Added the missing component
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule // Added for mat-spinner
  ],
  exports: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent,
    MemorialTimelineComponent // Export the component
  ]
})
export class MemorialTimelineModule { }
