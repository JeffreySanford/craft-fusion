import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { AdminComponent } from './admin.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { LoggerDisplayComponent } from '../../components/logger-display/logger-display.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MetricsInterceptor } from '../../common/interceptors/metrics.interceptor';
import { LoggingHttpInterceptor } from '../../common/interceptors/logging.interceptor';
import { BusyHttpInterceptor } from '../../common/interceptors/busy.interceptor';
import { UserStateInterceptor } from '../../common/interceptors/user-state.interceptor';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';

import { LoggerService } from '../../common/services/logger.service';
import { UserStateService } from '../../common/services/user-state.service';
import { UserActivityService } from '../../common/services/user-activity.service';
import { BusyService } from '../../common/services/busy.service';
import { AuthorizationService } from '../../common/services/authorization.service';
import { AdminStateService } from '../../common/services/admin-state.service';

@NgModule({
  declarations: [AdminComponent, LoggerDisplayComponent], // Add AdminComponent to declarations
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: AdminComponent }
    ]),
    MaterialModule,
    MatTabsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatTableModule,
    MatListModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    FormsModule
  ],
  providers: [
    LoggerService,
    UserStateService, 
    UserActivityService,
    BusyService,
    AuthorizationService,
    AdminStateService,
    { provide: HTTP_INTERCEPTORS, useClass: MetricsInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoggingHttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: BusyHttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: UserStateInterceptor, multi: true }
  ]
})
export class AdminModule { }
