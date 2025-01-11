import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataVisualizationsComponent } from './data-visualizations.component';
import { BarComponent } from './bar/bar.component';
import { LineComponent } from './line/line.component';
import { FintechComponent } from './fintech/fintech.component';
import { MapComponent } from './map/map.component';
import { MaterialModule } from '../../material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DataVisualizationService } from './data-visualizations.service';
import { FireAlertComponent } from './alert/fire-alert.component';

@NgModule({
  declarations: [DataVisualizationsComponent, BarComponent, LineComponent, FintechComponent, MapComponent, FireAlertComponent],
  imports: [CommonModule, MaterialModule, DragDropModule],
  exports: [DataVisualizationsComponent],
  providers: [DataVisualizationService],
})
export class DataVisualizationsModule {}
