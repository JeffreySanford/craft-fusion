import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingComponent } from './landing.component';
import { MaterialModule } from '../../material.module';
import { MaterialButtonsComponent } from './material-buttons/material-buttons.component';
import { MaterialIconsComponent } from './material-icons/material-icons.component';

@NgModule({
  declarations: [
    LandingComponent
  ],
  imports: [
    CommonModule,
    MaterialIconsComponent,
    MaterialButtonsComponent
  ],
  exports: [
    LandingComponent
  ],
  providers: []
})

export class LandingModule {}
