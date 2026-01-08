import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../../material.module';
import { AnimatedDirectivesModule } from '../../animated-directives.module';

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
    MemorialTimelineComponent,
    JeffreyAiComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    AnimatedDirectivesModule,
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
    MemorialTimelineComponent,
  ],
})
export class TimelineModule {}
