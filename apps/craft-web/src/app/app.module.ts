import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MaterialModule } from './material.module';
import { appRoutes } from './app.routes';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { HeaderModule } from './pages/header/header.module';
import { FooterModule } from './pages/footer/footer.module'; // Ensure FooterModule is imported

// Import other modules
import { DataVisualizationsModule } from './projects/data-visualizations/data-visualizations.module';
import { SpaceVideoModule } from './projects/space-video/space-video.module';
import { TableModule } from './projects/table/table.module';
import { PeasantKitchenModule } from './projects/peasant-kitchen/peasant-kitchen.module';
import { BusyService } from './common/services/busy.service';
import { ResumeComponent } from './pages/resume/resume.component';
import { BookModule } from './projects/book/book.module';
import { SharedPipesModule } from './common/pipes/shared-pipes.module';
import { UserMenuModule } from './common/components/user-menu/user-menu.module';

// Import interceptors
import { UserStateInterceptor } from './common/interceptors/user-state.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { AuthInterceptor } from './common/interceptors/auth.interceptor';
import { LoggingHttpInterceptor } from './common/interceptors/logging.interceptor';
import { ApiLoggerInterceptor } from './common/interceptors/api-logger.interceptor';
import { AuthInterceptorService } from './common/services/auth-interceptor.service';

// Import services
import { ApiService } from './common/services/api.service';
import { HttpClientWrapperService } from './common/services/http-client-wrapper.service';
import { UserStateService } from './common/services/user-state.service'; 
import { LoggerService } from './common/services/logger.service';
import { PerformanceMetricsService } from './common/services/performance-metrics.service';
import { ApiLoggerService } from './common/services/api-logger.service';
import { UserFacadeService } from './common/facades/user-facade.service';
import { HealthService } from './common/services/health.service';
import { AppInitializationService, initializeApp } from './common/services/app-initialization.service';
import { VideoBackgroundService } from './common/services/video-background.service';
import { UiStateFacade } from './common/facades/ui-state.facade';
import { EnvironmentService } from './common/services/environment.service';
import { AuthenticationService } from './common/services/authentication.service';

// Import video background component from its proper module
import { VideoBackgroundModule } from './common/components/video-background/video-background.module';

// Common imports
import { ThemeSwitcherComponent } from './common/components/theme-switcher/theme-switcher.component';
import { NotificationService } from './common/services/notification.service';
import { UserState } from './common/interfaces/user-state.interface';
import { ThemeService } from './common/services/theme.service';
import { LayoutService } from './common/services/layout.service';

// Import LandingModule
import { LandingModule } from './pages/landing/landing.module';

@NgModule({
  declarations: [
    AppComponent,
    ResumeComponent,
    ThemeSwitcherComponent,
    ThemeSwitcherComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule, // Add CommonModule for ngClass and other directives
    RouterModule.forRoot(appRoutes),
    MaterialModule,
    FormsModule,
    LandingModule, // Replace LandingModule with LandingComponent
    SidebarModule,
    HeaderModule,
    DataVisualizationsModule,
    PeasantKitchenModule,
    SpaceVideoModule,
    TableModule,
    FooterModule, // Ensure FooterModule is included in imports
    HttpClientModule,
    VideoBackgroundModule, // Import the VideoBackgroundModule
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-center',
      preventDuplicates: true,
    }),
    RouterModule,
    ReactiveFormsModule,
    BookModule,
    SharedPipesModule,
    UserMenuModule // Import the UserMenuModule
  ],
  exports: [
    MaterialModule,
    ReactiveFormsModule,
    RouterModule // Export RouterModule for router-outlet
  ],
  providers: [
    // Core services
    ApiService,
    BusyService,
    ToastrService,
    LayoutService,
    ThemeService,
    UserFacadeService,
    VideoBackgroundService,
    UiStateFacade,
    HealthService,
    EnvironmentService, // Fixed syntax error, removed equals sign
    
    // APP_INITIALIZER for application startup
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializationService],
      multi: true
    },
    
    // Animations provider
    provideAnimations(),
    
    // HTTP interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useFactory: (userStateService: UserStateService, injector: Injector) => {
        return new UserStateInterceptor(userStateService, injector);
      },
      deps: [UserStateService, Injector],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useFactory: (injector: Injector) => {
        return new LoggingHttpInterceptor(injector);
      },
      deps: [Injector],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useFactory: (performanceMetricsService: PerformanceMetricsService) => {
        return new MetricsInterceptor(performanceMetricsService);
      },
      deps: [PerformanceMetricsService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useFactory: (injector: Injector) => {
        const authService = injector.get(AuthenticationService);
        const loggerService = injector.get(LoggerService);
        return new AuthInterceptor(authService, loggerService);
      },
      multi: true,
      deps: [Injector]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useFactory: (apiLoggerService: ApiLoggerService, injector: Injector) => {
        return new ApiLoggerInterceptor(apiLoggerService, injector);
      },
      deps: [ApiLoggerService, Injector],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useFactory: (injector: Injector) => new AuthInterceptorService(injector),
      multi: true,
      deps: [Injector]
    },
    HttpClientWrapperService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private logger: LoggerService) {
    this.logger.info('AppModule loaded');
  }
}
