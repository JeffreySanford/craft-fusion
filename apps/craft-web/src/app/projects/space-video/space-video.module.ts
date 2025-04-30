import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpaceVideoComponent } from './space-video.component';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [SpaceVideoComponent],
  imports: [
    CommonModule,
    MaterialModule
  ]
})
export class SpaceVideoModule { }
