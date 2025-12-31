import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataVisualizationsComponent } from './data-visualizations.component';
import { BarComponent } from './bar/bar.component';
import { LineComponent } from './line/line.component';
import { FinanceComponent } from './financial/finance.component';
import { MaterialModule } from '../../material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FireAlertComponent } from './alert/fire-alert.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FlightRadarService } from '../../common/services/flightradar.service';
import { AlphaVantageService } from '../../common/services/alpha-vantage.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { AnimatedDirectivesModule } from '../../animated-directives.module';
import { MapboxService } from '../../common/services/mapbox.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartLayoutService } from './services/chart-layout.service';
import { TileLimitDialogComponent } from './dialogs/tile-limit-dialog.component';
import { FinanceModule } from './financial/finance.module';
import { ComponentsModule } from '../../common/components/components.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterModule, Routes } from '@angular/router';

// Define routes for the data visualizations module
const dataVisualizationsRoutes: Routes = [
  {
    path: '',
    component: DataVisualizationsComponent,
  },
  {
    path: 'bar',
    component: BarComponent,
  },
  {
    path: 'line',
    component: LineComponent,
  },
  {
    path: 'finance',
    component: FinanceComponent,
  },
];

@NgModule({
  declarations: [DataVisualizationsComponent, BarComponent, LineComponent, FireAlertComponent, TileLimitDialogComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(dataVisualizationsRoutes),
    MaterialModule,
    DragDropModule,
    MatDialogModule,
    MatChipsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatIconModule,
    MatListModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatGridListModule,
    AnimatedDirectivesModule,
    MatTooltipModule,
    FinanceModule,
    ComponentsModule,
  ],
  exports: [DataVisualizationsComponent, RouterModule],
  providers: [AlphaVantageService, FlightRadarService, MapboxService, ChartLayoutService],
})
export class DataVisualizationsModule {}
