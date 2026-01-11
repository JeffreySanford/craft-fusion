import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FamilyTimelineComponent } from './family-timeline/family-timeline.component';

const routes: Routes = [
  {
    path: '',
    component: FamilyTimelineComponent
  }
];

@NgModule({
  declarations: [
    FamilyTimelineComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    FamilyTimelineComponent
  ]
})
export class FamilyModule { }
