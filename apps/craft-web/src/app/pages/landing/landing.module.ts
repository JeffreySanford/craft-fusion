import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { LandingComponent } from './landing.component';

@NgModule({
  declarations: [
    LandingComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: LandingComponent }
    ]),
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    RouterModule
  ]
})
export class LandingModule { }
