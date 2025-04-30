import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TimelinePageComponent } from './components/timeline-page/timeline-page.component';
import { TimelineListComponent } from './components/timeline-list/timeline-list.component';
import { TimelineItemComponent } from './components/timeline-item/timeline-item.component';
import { TimelineService } from './services/timeline.service';

@NgModule({
  declarations: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule, // Added MatCardModule for mat-card components
    MatProgressSpinnerModule, // Add the spinner module
    RouterModule.forChild([
      {
        path: '',
        component: TimelinePageComponent,
      }
    ])
  ],
  exports: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent
  ],
  providers: [
    TimelineService
  ]
})
export class MemorialTimelineModule { }
