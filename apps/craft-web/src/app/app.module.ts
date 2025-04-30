import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { MaterialModule } from './material.module';
import { ComponentsModule } from './common/components/components.module';
import { LandingModule } from './pages/landing/landing.module';
import { AdminModule } from './pages/admin/admin.module';
import { PeasantKitchenModule } from './projects/peasant-kitchen/peasant-kitchen.module';
import { HeaderModule } from './pages/header/header.module';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { FooterModule } from './pages/footer/footer.module';
import { LoggerService } from './common/services/logger.service';

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
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    MaterialModule,
    ComponentsModule, // Import ComponentsModule which exports ServerStatusComponent
    LandingModule,
    AdminModule,
    PeasantKitchenModule,
    HeaderModule,
    SidebarModule,
    FooterModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (router: Router, logger: LoggerService) => {
        return () => {
          // Register the Router with the logger
          logger.registerService('Router');
          return Promise.resolve();
        };
      },
      deps: [Router, LoggerService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
