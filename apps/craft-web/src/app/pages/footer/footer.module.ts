import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FooterComponent } from './footer.component';
import { LineChartModule } from '../../common/components/line-chart/line-chart.module';

@NgModule({
  declarations: [
    FooterComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    LineChartModule
  ],
  exports: [
    FooterComponent
  ]
})
export class FooterModule { }
