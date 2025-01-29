import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataVisualizationsComponent } from './data-visualizations.component';
import { BarComponent } from './bar/bar.component';
import { LineComponent } from './line/line.component';
import { FinanceComponent } from './financial/finance.component';
import { MaterialModule } from '../../material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FireAlertComponent } from './alert/fire-alert.component';
import { FlightAwareService } from '../../common/services/flightaware.service';
import { FlightRadarService } from '../../common/services/flightradar.service';
import { AlphaVantageService } from '../../common/services/alpha-vantage.service';

@NgModule({
  declarations: [
    DataVisualizationsComponent, BarComponent, LineComponent, FinanceComponent,
    FireAlertComponent, FinanceComponent],
  imports: [CommonModule, MaterialModule, DragDropModule],
  exports: [DataVisualizationsComponent],
  providers: [AlphaVantageService, FlightAwareService, FlightRadarService],
})
export class DataVisualizationsModule {}
