import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataVisualizationsComponent } from './data-visualizations.component';
import { BarComponent } from './bar/bar.component';
import { LineComponent } from './line/line.component';
import { FintechComponent } from './fintech/fintech.component';
import { MapComponent } from './map/map.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    DataVisualizationsComponent,
    BarComponent,
    LineComponent,
    FintechComponent,
    MapComponent,
    IonicModule
  ]
})
export class DataVisualizationsModule { }
