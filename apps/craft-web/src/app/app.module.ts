import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { ComponentsModule } from './components/components.module';
import { MaterialModule } from './material.module';
import { LandingModule } from './pages/landing/landing.module';
import { AdminModule } from './pages/admin/admin.module';
import { PeasantKitchenModule } from './projects/peasant-kitchen/peasant-kitchen.module';
import { HeaderModule } from './pages/header/header.module';
import { SidebarModule } from './pages/sidebar/sidebar.module';
import { FooterModule } from './pages/footer/footer.module';

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
    ComponentsModule,
    MaterialModule,
    LandingModule,
    AdminModule,
    PeasantKitchenModule,
    HeaderModule,
    SidebarModule,
    FooterModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
