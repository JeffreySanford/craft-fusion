import { Routes } from '@angular/router';
import { MaterialIconsComponent } from './pages/landing/material-icons/material-icons.component';
import { MaterialButtonsComponent } from './pages/landing/material-buttons/material-buttons.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { AdminGuard } from './common/guards/admin.guard';
import { AuthGuard } from './common/guards/auth.guard';

export const appRoutes: Routes = [
  { path: 'home', loadChildren: () => import('./pages/landing/landing.module').then(m => m.LandingModule) },
  { path: 'table', loadChildren: () => import('./projects/table/table.module').then(m => m.TableModule) },
  {
    path: 'data-visualizations',
    loadChildren: () => import('./projects/data-visualizations/data-visualizations.module').then(m => m.DataVisualizationsModule),
  },
  {
    path: 'timeline',
    loadChildren: () => import('./projects/timeline/timeline.module').then(m => m.TimelineModule),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: 'peasant-kitchen',
    loadChildren: () => import('./projects/peasant-kitchen/peasant-kitchen.module').then(m => m.PeasantKitchenModule),
  },
  { path: 'space-video', loadChildren: () => import('./projects/space-video/space-video.module').then(m => m.SpaceVideoModule) },
  { path: 'material-icons', component: MaterialIconsComponent },
  { path: 'material-buttons', component: MaterialButtonsComponent },
  {
    path: 'resume',
    component: ResumeComponent,
  },
  {
    path: 'admin',
    loadChildren: () =>
      import(/* webpackChunkName: "admin-module" */ './pages/admin/admin.module').then(
        m => m.AdminModule,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/404' },
];
