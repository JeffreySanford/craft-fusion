import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router, NavigationStart, NavigationCancel, NavigationEnd, NavigationError } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { MaterialModule } from './material.module';
import { ComponentsModule } from './common/components/components.module';
import { HeaderModule } from './pages/header/header.module';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { FooterModule } from './pages/footer/footer.module';
import { LoggerService } from './common/services/logger.service';
import { NgxSpinnerWrapperModule } from './modules/ngx-spinner-wrapper.module';
import { SocketClientService } from './common/services/socket-client.service';

// Import shared types from craft-library
import { HealthData } from '@craft-fusion/craft-library';

export function socketClientFactory(socketClient: SocketClientService): () => void {
  return () => {
    // Initialize the socket client and emit health metric
    socketClient.connect();
    console.info('[AppModule] SocketClientService initialized and connected');
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
        timestamp: Date.now()
      }
    };
    socketClient.emit('health', healthMetric);
  };
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, {
      scrollPositionRestoration: 'enabled', // Restore scroll position on navigation
      anchorScrolling: 'enabled', // Enable anchor scrolling
      onSameUrlNavigation: 'reload' // Reload the component on same URL navigation
    }),
    MaterialModule,
    ComponentsModule, // Import ComponentsModule which exports ServerStatusComponent
    HeaderModule,
    SidebarModule,
    FooterModule,
    NgxSpinnerWrapperModule // Re-exported wrapper for NgxSpinner
  ],
  providers: [
    SocketClientService,
    {
      provide: APP_INITIALIZER,
      useFactory: function appInitializerFactory(router: Router, logger: LoggerService) {
        return () => {
          router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
              logger.info('Navigation started', event);
            } else if (event instanceof NavigationEnd) {
              logger.info('Navigation ended', event);
            } else if (event instanceof NavigationError) {
              logger.error('Navigation error', event);
              // Avoid navigating to a non-existent /error route which can cause navigation loops
              try {
                if (router.url !== '/404') {
                  router.navigate(['/404']);
                }
              } catch (e) {
                logger.warn('Failed to navigate to /404 after navigation error', e);
              }
            } else if (event instanceof NavigationCancel) {
              logger.info('Navigation cancelled', event);
            }
          });

          logger.registerService('Router');
        };
      },
      deps: [Router, LoggerService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: function socketInitializerFactory(socketClient: SocketClientService) {
        return () => socketClientFactory(socketClient)();
      },
      deps: [SocketClientService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
