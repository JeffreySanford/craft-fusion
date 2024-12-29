import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { IonicModule } from '@ionic/angular';
import { MaterialModule } from './material.module';
import { appRoutes } from './app.routes';

import { AppComponent } from './app.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { LandingModule } from './pages/landing/landing.module';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { HeaderModule } from './pages/header/header.module';
import { FooterModule } from './pages/footer/footer.module';
import { DataVisualizationsModule } from './projects/data-visualizations/data-visualizations.module';
import { SpaceVideoModule } from './projects/space-video/space-video.module';
import { TableModule } from './projects/table/table.module';
import { PeasantKitchenModule } from './projects/peasant-kitchen/peasant-kitchen.module';
import { BusyService } from './common/services/busy.service';

@NgModule({
  declarations: [
    AppComponent,
    ResumeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoutes),
    MaterialModule,
    IonicModule.forRoot(),
    FormsModule,
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
    }),
    RouterModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  // Add this line to detect circular imports
  constructor() {
    console.log('AppModule loaded');
  }
}

