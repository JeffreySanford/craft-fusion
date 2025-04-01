import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PerformanceComponent } from './performance/performance.component';
import { LogsComponent } from './logs/logs.component';
import { SecurityComponent } from './security/security.component';
import { ApiMonitorComponent } from './api-monitor/api-monitor.component';

// Import Material modules
import { MaterialModule } from '../../material.module';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

// Import form modules
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import pipes and services
import { SharedPipesModule } from '../../common/pipes/shared-pipes.module';
import { ThemeService } from '../../common/services/theme.service';
import { LayoutService } from '../../common/services/layout.service';
import { ApiService } from '../../common/services/api.service';
import { HttpClientModule } from '@angular/common/http';
import { LoggerHelperService } from '../../common/services/logger-helper.service';

// Import custom modules
import { LineChartModule } from '../../common/components/line-chart/line-chart.module';

// Define routes for lazy loading child components
const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
  },
  { path: ':tab', component: AdminComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AdminComponent,
    DashboardComponent,
    PerformanceComponent,
    LogsComponent,
    SecurityComponent,
    ApiMonitorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSelectModule,
    MatChipsModule,
    SharedPipesModule,
    HttpClientModule,
    LineChartModule
  ],
  providers: [
    ThemeService,
    LayoutService,
    ApiService,
    LoggerHelperService
  ],
  exports: [
    RouterModule
  ]
})
export class AdminModule { }
