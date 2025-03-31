import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LandingComponent } from './landing.component';
import { VideoBackgroundModule } from '../../common/components/video-background/video-background.module';
import { ThemeSwitcherModule } from '../../common/components/theme-switcher/theme-switcher.module';
import { MockDataIndicatorModule } from '../../common/components/mock-data-indicator/mock-data-indicator.module';
// Import our newly created feature modules
import { MaterialButtonsModule } from './material-buttons/material-buttons.module';
import { MaterialIconsModule } from './material-icons/material-icons.module';
import { MaterialAnimationsModule } from './material-animations/material-animations.module';

@NgModule({
  declarations: [
    LandingComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    MaterialButtonsModule,
    MaterialIconsModule,
    MaterialAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    VideoBackgroundModule,
    ThemeSwitcherModule,
    MockDataIndicatorModule
  ],
  exports: [
    LandingComponent
  ]
})
export class LandingModule { }
