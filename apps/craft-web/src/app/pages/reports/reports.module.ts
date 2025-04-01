import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [ReportsComponent],
  imports: [
    CommonModule,
    MatCardModule,
    RouterModule.forChild([
      { path: '', component: ReportsComponent }
    ])
  ]
})
export class ReportsModule { }
