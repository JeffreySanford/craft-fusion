import { NgModule, provideAppInitializer, inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { RouterModule, Router, NavigationStart, NavigationCancel, NavigationEnd, NavigationError } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { AppComponent } from './app.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { appRoutes } from './app.routes';
import { MaterialModule } from './material.module';
import { ComponentsModule } from './common/components/components.module';
import { HeaderModule } from './pages/header/header.module';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { FooterModule } from './pages/footer/footer.module';
import { LoggerService } from './common/services/logger.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SocketClientService } from './common/services/socket-client.service';
import { AuthModule } from './common/services/auth/auth.module';
import { CommonServicesModule } from './common/services/common-services.module';
import { DirectivesModule } from './common/directives/directives.module';
import { httpInterceptorProviders } from './common/interceptors';

import { HealthData } from '@craft-fusion/craft-library';

export function socketClientFactory(socketClient: SocketClientService): () => void {
  return () => {
    socketClient.connect();
    const healthMetric: HealthData = {
      status: 'healthy',
      services: { api: true },
      uptime: 0,
      version: 'frontend',
      metrics: {
        uptime: 0,
        memory: { total: 0, free: 0, used: 0, usage: 0 },
        cpu: { loadAvg: [0, 0, 0], usage: 0 },
        process: { pid: 0, memoryUsage: {}, uptime: 0 },
        timestamp: Date.now(),
      },
    };

    socketClient.isConnected$
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        console.info('[AppModule] SocketClientService connected');
        socketClient.emit('health', healthMetric);
      });
  };
}

@NgModule({
  declarations: [AppComponent, ResumeComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    }),
    RouterModule.forRoot(appRoutes, {
      scrollPositionRestoration: 'enabled',                                         
      anchorScrolling: 'enabled',                           
      onSameUrlNavigation: 'reload',                                               
    }),
    MaterialModule,
    ComponentsModule,                                                               
    HeaderModule,
    SidebarModule,
    FooterModule,
    NgxSpinnerModule,
    AuthModule,
    CommonServicesModule,
    DirectivesModule
  ],
  providers: [
    httpInterceptorProviders,
    provideAppInitializer(() => {
      const router = inject(Router);
      const logger = inject(LoggerService);

      router.events.subscribe(event => {
        if (event instanceof NavigationStart) {
          logger.info('Navigation started', event);
        } else if (event instanceof NavigationEnd) {
          logger.info('Navigation ended', event);
        } else if (event instanceof NavigationError) {
          logger.error('Navigation error', event);
          router.navigate(['/error'], { queryParams: { error: event.error } });
        } else if (event instanceof NavigationCancel) {
          logger.info('Navigation cancelled', event);
        }
      });

      logger.registerService('Router');
    }),
    SocketClientService,
    provideAppInitializer(() => {
      const socketClient = inject(SocketClientService);
      socketClientFactory(socketClient)();
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
