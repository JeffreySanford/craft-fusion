import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ServerStatusComponent } from './server-status/server-status.component';
import { NonD3ChartComponent } from '../charts/non-d3-chart.component';

@NgModule({
  declarations: [
    ServerStatusComponent, // Component must be non-standalone to be declared here
    NonD3ChartComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule
  ],
  exports: [
    ServerStatusComponent,
    NonD3ChartComponent
  ]
})
export class ComponentsModule { }
