import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingRoutingModule } from './landing-routing.module';
import { LandingComponent } from './landing.component';

import { MaterialButtonsComponent } from './material-buttons/material-buttons.component';
import { MaterialIconsComponent } from './material-icons/material-icons.component';

@NgModule({
  declarations: [
    LandingComponent,
    MaterialIconsComponent,
    MaterialButtonsComponent
  ],
  imports: [
    CommonModule,
    LandingRoutingModule
  ],
  exports: [
    LandingComponent
  ],
  providers: []
})

export class LandingModule {}
