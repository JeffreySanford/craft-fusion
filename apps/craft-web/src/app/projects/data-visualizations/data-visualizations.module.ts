import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataVisualizationsComponent } from './data-visualizations.component';
import { BarComponent } from './bar/bar.component';
import { LineComponent } from './line/line.component';
import { FinanceComponent } from './financial/finance.component';
import { MaterialModule } from '../../material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FireAlertComponent } from './alert/fire-alert.component';
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
import { FinanceModule } from './financial/finance.module';
import { ComponentsModule } from '../../common/components/components.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterModule, Routes } from '@angular/router';

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
  declarations: [DataVisualizationsComponent, BarComponent, LineComponent, FireAlertComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(dataVisualizationsRoutes),
    MaterialModule,
    DragDropModule,
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
  providers: [MapboxService, ChartLayoutService],
})
export class DataVisualizationsModule {}
