import { Route } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { AdminGuard } from './common/guards/admin.guard';
import { AuthGuard } from './common/guards/auth.guard';

export const appRoutes: Route[] = [
  // Default route redirects to landing
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  
  // Landing page as main entry point - using standalone component
  { path: 'landing', component: LandingComponent, data: { title: 'Welcome' } },
  
  // Resume page
  { path: 'resume', component: ResumeComponent, data: { title: 'Resume' } },
  
  // Settings routes with auth protection
  {
    path: 'settings',
    loadChildren: () => import('./pages/header/settings/settings.module').then(m => m.SettingsModule),
    canActivate: [AuthGuard],
    data: { 
      title: 'Settings',
      securitySensitive: true  // Mark as security-sensitive for auth guard
    }
  },
  
  // Security settings direct route with auth protection
  {
    path: 'security-settings',
    loadChildren: () => import('./pages/header/settings/settings.module').then(m => m.SettingsModule),
    canActivate: [AuthGuard],
    data: { 
      title: 'Security Settings',
      securitySensitive: true  // Mark as security-sensitive for auth guard
    }
  },
  
  // Lazy-loaded feature modules
  {
    path: 'projects/data-visualizations',
    loadChildren: () => import('./projects/data-visualizations/data-visualizations.module').then(m => m.DataVisualizationsModule),
    data: { title: 'Data Visualizations' }
  },
  {
    path: 'projects/space-video',
    loadChildren: () => import('./projects/space-video/space-video.module').then(m => m.SpaceVideoModule),
    data: { title: 'Space Video' }
  },
  {
    path: 'projects/table',
    loadChildren: () => import('./projects/table/table.module').then(m => m.TableModule),
    data: { title: 'Table' }
  },
  {
    path: 'projects/peasant-kitchen',
    loadChildren: () => import('./projects/peasant-kitchen/peasant-kitchen.module').then(m => m.PeasantKitchenModule),
    data: { title: 'Peasant Kitchen' }
  },
  {
    path: 'projects/book',
    loadChildren: () => import('./projects/book/book.module').then(m => m.BookModule),
    data: { title: 'Book' }
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AdminGuard],
    data: { title: 'Admin' }
  },
  {
    path: 'reports',
    loadChildren: () => import('./pages/reports/reports.module').then(m => m.ReportsModule),
    canActivate: [AuthGuard],
    data: { title: 'Reports' }
  },
  
  // Fallback route for unknown paths
  { path: '**', redirectTo: '/landing' }
];
