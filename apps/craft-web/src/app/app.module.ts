import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MaterialModule } from './material.module';
import { appRoutes } from './app.routes';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AppComponent } from './app.component';
import { LandingModule } from './pages/landing/landing.module';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { HeaderModule } from './pages/header/header.module';
import { FooterModule } from './pages/footer/footer.module';
import { DataVisualizationsModule } from './projects/data-visualizations/data-visualizations.module';
import { SpaceVideoModule } from './projects/space-video/space-video.module';
import { TableModule } from './projects/table/table.module';
import { PeasantKitchenModule } from './projects/peasant-kitchen/peasant-kitchen.module';
import { BusyService } from './common/services/busy.service';
import { ResumeComponent } from './pages/resume/resume.component';
import { BookModule } from './projects/book/book.module';
import { UserStateInterceptor } from './common/interceptors/user-state.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { AuthHttpInterceptor } from './common/interceptors/auth.interceptor';
import { ApiService } from './common/services/api.service';
import { CommonServicesModule } from './common/services/common-services.module';
import { AuthModule } from './common/services/auth/auth.module';

@NgModule({
  declarations: [
    AppComponent,
    ResumeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule, // Add HttpClientModule here to provide HttpClient
    RouterModule.forRoot(appRoutes),
    MaterialModule,
    FormsModule,
    LandingModule,
    SidebarModule,
    HeaderModule,
    DataVisualizationsModule,
    PeasantKitchenModule,
    SpaceVideoModule,
    TableModule,
    FooterModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-center',
      preventDuplicates: true,
    }),
    RouterModule,
    ReactiveFormsModule,
    BookModule,
    CommonServicesModule, 
    AuthModule,
    // Note: NotFoundModule is lazy loaded via routes and doesn't need to be imported here
  ],
  exports: [MaterialModule, ReactiveFormsModule],
  providers: [
    ApiService, // Keep class-based injection
    BusyService,
    ToastrService,
    provideAnimations(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UserStateInterceptor,
      multi: true
    },
    provideAnimationsAsync(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MetricsInterceptor,
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true }, // Enable AuthHttpInterceptor
    { provide: 'ApiService', useClass: ApiService } // Add string token injection for UserStateService
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
