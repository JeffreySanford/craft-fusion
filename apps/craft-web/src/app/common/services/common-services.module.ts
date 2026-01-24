import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ServiceRegistryService } from './service-registry.service';
import { LoggerService } from './logger.service';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { BusyService } from './busy.service';
import { SessionService } from './session.service';
import { UserStateService } from './user-state.service';
import { ApiDiagnosticsService } from './api-diagnostics.service';
import { SocketClientService } from './socket-client.service';
import { UserActivityService } from './user-activity.service';
import { DataSimulationService } from './data-simulation.service';

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
    ApiDiagnosticsService,
    SocketClientService,
    UserActivityService,
    DataSimulationService,
  ],
})
export class CommonServicesModule {

  constructor(@Optional() @SkipSelf() parentModule?: CommonServicesModule) {
    if (parentModule) {
      throw new Error('CommonServicesModule is already loaded. Import it only in AppModule');
    }
  }
}
