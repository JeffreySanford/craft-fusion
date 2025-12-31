import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ServiceRegistryService } from './service-registry.service';
import { LoggerService } from './logger.service';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { BusyService } from './busy.service';
import { SessionService } from './session.service';
import { UserStateService } from './user-state.service';
import { ThemeService } from './theme.service';
import { ApiDiagnosticsService } from './api-diagnostics.service';
import { SocketClientService } from './socket-client.service';
import { UserActivityService } from './user-activity.service';

/**
 * Module for common services used throughout the application.
 * Uses the singleton pattern to ensure services are only provided once.
 */
@NgModule({
  imports: [HttpClientModule],
  providers: [
    ServiceRegistryService,
    LoggerService,
    ApiService,
    NotificationService,
    BusyService,
    SessionService,
    UserStateService,
    ThemeService,
    ApiDiagnosticsService,
    SocketClientService,
    UserActivityService,
  ],
})
export class CommonServicesModule {
  /**
   * Ensures CommonServicesModule is only imported in the AppModule
   * Prevents multiple instances of services
   */
  constructor(@Optional() @SkipSelf() parentModule?: CommonServicesModule) {
    if (parentModule) {
      throw new Error('CommonServicesModule is already loaded. Import it only in AppModule');
    }
  }
}
