import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ServicesDashboardComponent } from './services-dashboard/services-dashboard.component';

@NgModule({
  declarations: [
    ServicesDashboardComponent
  ],
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule
  ],
  exports: [
    ServicesDashboardComponent
  ]
})
export class AdminModule { }
