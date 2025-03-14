import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
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
import { QuantumFisherInformationComponent } from './quantum-fisher-information/quantum-fisher-information.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list'; // Add this for mat-list-item
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { AnimatedDirectivesModule } from '../../animated-directives.module';
import { KatexModule } from "./quantum-fisher-information/katex/katex.module";
import { MapboxService } from '../../common/services/mapbox.service'; // Update import path
import { MatTooltipModule } from '@angular/material/tooltip';

// Define routes for the data visualizations module
const dataVisualizationsRoutes: Routes = [
  { 
    path: '', 
    component: DataVisualizationsComponent 
  },
  { 
    path: 'quantum-fisher', 
    component: QuantumFisherInformationComponent 
  },
  { 
    path: 'bar', 
    component: BarComponent 
  },
  { 
    path: 'line', 
    component: LineComponent 
  },
  { 
    path: 'finance', 
    component: FinanceComponent 
  }
];

@NgModule({
  declarations: [
    DataVisualizationsComponent, 
    BarComponent, 
    LineComponent, 
    FinanceComponent, 
    FireAlertComponent, 
    QuantumFisherInformationComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(dataVisualizationsRoutes), // Add RouterModule with routes
    MaterialModule,
    DragDropModule,
    MatDialogModule,
    MatChipsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatIconModule,
    MatListModule, // Add this for mat-list components
    FormsModule,
    MatTabsModule,
    MatCardModule,
    AnimatedDirectivesModule,
    KatexModule,
    MatTooltipModule
  ],
  exports: [
    DataVisualizationsComponent,
    QuantumFisherInformationComponent, // Export the component so it can be used outside this module
    RouterModule // Export RouterModule
  ],
  providers: [AlphaVantageService, FlightRadarService, MapboxService],
})
export class DataVisualizationsModule {}
