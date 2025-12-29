import { NgModule, provideAppInitializer, inject } from '@angular/core';
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
import { NgxSpinnerModule } from 'ngx-spinner';
import { SocketClientService } from './common/services/socket-client.service';
import { AuthenticationService } from './common/services/authentication.service';

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
    NgxSpinnerModule // Add NgxSpinnerModule
  ],
  providers: [
    AuthenticationService,
    provideAppInitializer(() => {
      const router = inject(Router);
      router.events.subscribe(event => {
        console.log('Router event:', event);
      });
      const logger = inject(LoggerService);
      
      // Register the Router with the logger, return a hot observable that emits the router instance
      // This is a workaround to ensure the logger has access to the router instance
      // and can log navigation events
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
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
