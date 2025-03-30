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

// Import form modules
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import pipes and services
import { SharedPipesModule } from '../../common/pipes/shared-pipes.module';
import { ThemeService } from '../../common/services/theme.service';
import { LayoutService } from '../../common/services/layout.service';
import { ApiService } from '../../common/services/api.service';
import { HttpClientModule } from '@angular/common/http';
import { LoggerHelperService } from '../../common/services/logger-helper.service';

// Define routes for lazy loading child components
const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
  },
  { path: ':tab', component: AdminComponent }
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
    SharedPipesModule,
    HttpClientModule
  ],
  providers: [
    ThemeService,
    LayoutService,
    ApiService,
    LoggerHelperService
  ]
})
export class AdminModule { }
