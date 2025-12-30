import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminMaterialModule } from './admin-material.module';
import { ServicesDashboardComponent } from './services-dashboard/services-dashboard.component';
import { LogsComponent } from './logs/logs.component';
import { LogsDashboardComponent } from './logs-dashboard/logs-dashboard.component';
import { AdminComponent } from './admin.component';
import { AdminLandingComponent } from './admin-landing/admin-landing.component';
import { SecurityDashboardComponent } from './security-dashboard/security-dashboard.component';
import { SystemPerformanceComponent } from './system-performance/system-performance.component';
import { PerformanceDashboardComponent } from './performance-dashboard/performance-dashboard.component';

import { RouterModule } from '@angular/router';

import { ComponentsModule } from '../../components/components.module';
import { AuthService } from '../../common/services/auth/auth.service';


@NgModule({
  declarations: [
    AdminComponent,
    ServicesDashboardComponent,
    LogsComponent,
    LogsDashboardComponent,
    AdminLandingComponent,
    SecurityDashboardComponent,
    SystemPerformanceComponent,
    PerformanceDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminMaterialModule,
    ComponentsModule, // Import ComponentsModule to access LoggerDisplayComponent
    
    RouterModule.forChild([
      { path: '', component: AdminComponent }
    ])
  ],
  exports: [
  ],
  providers: [
    { provide: 'AuthService', useExisting: AuthService }
  ]
})
export class AdminModule { }
