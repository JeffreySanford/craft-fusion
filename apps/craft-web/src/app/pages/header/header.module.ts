import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './header.component';
import { MaterialModule } from '../../material.module';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ProfileModule } from './profile/profile.module';
import { SettingsModule } from './settings/settings.module';
import { HeaderRoutingModule } from './header-routing.module';

@NgModule({
  declarations: [
    HeaderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    RouterModule,
    HeaderRoutingModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    ProfileModule,
    SettingsModule
  ],
  exports: [HeaderComponent]
})
export class HeaderModule { }
