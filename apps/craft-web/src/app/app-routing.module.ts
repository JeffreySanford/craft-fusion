import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreloadAllModules } from '@angular/router';
import { AuthGuard } from './common/guards/auth.guard';
import { AdminGuard } from './common/guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadChildren: () => import('./pages/landing/landing.module').then(m => m.LandingModule) 
  },
  { 
    path: 'admin', 
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, AdminGuard],
    data: { title: 'Admin Dashboard' }
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/header/header.module').then(m => m.HeaderModule),
    data: { title: 'User Profile' }
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/header/header.module').then(m => m.HeaderModule),
    data: { title: 'Settings' }
  },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      // Avoid errors when navigating
      onSameUrlNavigation: 'reload',
      // Helps with debugging
      enableTracing: false
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }