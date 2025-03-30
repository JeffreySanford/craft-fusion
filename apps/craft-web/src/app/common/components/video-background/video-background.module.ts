import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoBackgroundComponent } from './video-background.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [VideoBackgroundComponent],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  exports: [VideoBackgroundComponent]
})
export class VideoBackgroundModule { }
