import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingComponent } from './landing.component';

import { MaterialButtonsComponent } from './material-buttons/material-buttons.component';
import { MaterialIconsComponent } from './material-icons/material-icons.component';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [LandingComponent, MaterialButtonsComponent, MaterialIconsComponent],
  imports: [CommonModule, MaterialModule],
  exports: [],
  providers: [],
})
export class LandingModule {}
