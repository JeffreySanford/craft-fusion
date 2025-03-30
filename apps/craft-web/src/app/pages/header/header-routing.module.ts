import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
  { 
    path: 'profile', 
    component: ProfileComponent,
    data: { title: 'User Profile' }
  },
  { 
    path: 'settings', 
    component: SettingsComponent,
    data: { title: 'Settings' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HeaderRoutingModule { }
