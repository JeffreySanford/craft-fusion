import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpaceVideoComponent } from './space-video.component';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [SpaceVideoComponent],
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule.forChild([
      { path: '', component: SpaceVideoComponent }
    ])
  ],
  exports: [SpaceVideoComponent]
})
export class SpaceVideoModule { }
