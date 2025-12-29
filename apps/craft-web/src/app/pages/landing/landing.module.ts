import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingComponent } from './landing.component';

import { MaterialButtonsComponent } from './material-buttons/material-buttons.component';
import { MaterialIconsComponent } from './material-icons/material-icons.component';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [LandingComponent, MaterialButtonsComponent, MaterialIconsComponent],
  imports: [CommonModule, MaterialModule, RouterModule.forChild([{ path: '', component: LandingComponent }])],
  exports: [LandingComponent, MaterialButtonsComponent, MaterialIconsComponent],
  providers: [],
})
export class LandingModule {}
