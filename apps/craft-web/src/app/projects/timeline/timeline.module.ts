import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../../material.module';
import { DirectivesModule } from '../../common/directives/directives.module';

import { TimelinePageComponent } from './components/timeline-page/timeline-page.component';
import { TimelineListComponent } from './components/timeline-list/timeline-list.component';
import { TimelineItemComponent } from './components/timeline-item/timeline-item.component';

@NgModule({
  declarations: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    DirectivesModule,
    RouterModule.forChild([
      { path: '', component: TimelinePageComponent },
      { path: 'timeline-list', component: TimelineListComponent },
      { path: 'timeline-page', component: TimelinePageComponent },
      { path: '**', redirectTo: '' },
    ]),
  ],
  exports: [
    TimelinePageComponent,
    TimelineListComponent,
    TimelineItemComponent,
  ],
})
export class TimelineModule {}
