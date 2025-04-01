import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LineChartComponent } from './line-chart.component';

@NgModule({
  declarations: [LineChartComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  exports: [LineChartComponent]
})
export class LineChartModule {}
