import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Import Angular Material modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

// Import components
import { TimelinePageComponent } from './components/timeline-page/timeline-page.component';
import { TimelineListComponent } from './components/timeline-list/timeline-list.component';
import { TimelineItemComponent } from './components/timeline-item/timeline-item.component';
import { MemorialTimelineComponent } from './components/memorial-timeline/memorial-timeline.component';
import { JeffreyAiComponent } from './components/jeffrey-ai/jeffrey-ai.component';

@NgModule({
  declarations: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent,
    MemorialTimelineComponent, // Added the missing component
    JeffreyAiComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterModule.forChild([
      { path: '', component: TimelinePageComponent },
      { path: 'memorial-timeline', component: MemorialTimelineComponent },
      { path: 'memorial-timeline/jeffrey-ai', component: JeffreyAiComponent },
      { path: 'memorial-timeline/:id', component: MemorialTimelineComponent },
      { path: 'timeline-item', component: MemorialTimelineComponent },
      { path: 'timeline-list', component: TimelineListComponent },
      { path: 'timeline-page', component: TimelinePageComponent },
      { path: '**', redirectTo: '' },
    ]),
  ],
  exports: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent,
    MemorialTimelineComponent, // Export the component
  ],
})
export class MemorialTimelineModule {}
