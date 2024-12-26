import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { IonicModule } from '@ionic/angular';
import { MaterialModule } from './material.module';
import { appRoutes } from './app.routes';
import { LandingModule } from './pages/landing/landing.module';
import { AppComponent } from './app.component';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { HeaderModule } from './pages/header/header.module';
import { DataVisualizationsModule } from './projects/data-visualizations/data-visualizations.module';
import { SpaceVideoModule } from './projects/space-video/space-video.module';
import { FooterModule } from './pages/footer/footer/footer.module';
import { TableModule } from './projects/table/table.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PeasantKitchenModule } from './projects/peasant-kitchen/peasant-kitchen.module';
import { ResumeComponent } from './pages/resume/resume.component';
import { BusyService } from './common/services/busy.service';
import { ToastrService } from 'ngx-toastr';

@NgModule({
  declarations: [
    AppComponent,
    ResumeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    FormsModule,
    MaterialModule,
    RouterModule.forRoot(appRoutes),
    LandingModule,
    SidebarModule,
    HeaderModule,
    DataVisualizationsModule,
    PeasantKitchenModule,
    SpaceVideoModule,
    TableModule,
    FooterModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-center',
      preventDuplicates: true,
    })
  ],
  exports: [
    MaterialModule,
    IonicModule
  ],
  providers: [
    provideAnimationsAsync(),
    BusyService,
    ToastrService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
