import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { PeasantKitchenComponent } from './projects/peasant-kitchen/peasant-kitchen.component';
import { SpaceVideoComponent } from './projects/space-video/space-video.component';
import { DataVisualizationsComponent } from './projects/data-visualizations/data-visualizations.component';
import { MaterialIconsComponent } from './pages/landing/material-icons/material-icons.component';
import { MaterialButtonsComponent } from './pages/landing/material-buttons/material-buttons.component';
import { RecipeComponent } from './projects/peasant-kitchen/recipe/recipe.component';
import { RecipesComponent } from './projects/peasant-kitchen/recipes/recipes.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { BookComponent } from './projects/book/book.component';
import { AdminGuard } from './common/guards/admin.guard';
import { AuthGuard } from './common/guards/auth.guard';
import { RoleGuard } from './common/guards/role.guard';
import { PeasantKitchenModule } from './projects/peasant-kitchen/peasant-kitchen.module';

export const appRoutes: Routes = [
  { path: 'home', component: LandingComponent },
  { path: 'table', loadChildren: () => import('./projects/table/table.module').then(m => m.TableModule) },
  { path: 'data-visualizations', component: DataVisualizationsComponent },
  { path: 'book', component: BookComponent },
  { path: 'chat', loadChildren: () => import('./projects/chat/chat.module').then(m => m.ChatModule) },
  {
    path: 'peasant-kitchen', loadChildren: () => import('./projects/peasant-kitchen/peasant-kitchen.module').then(m => m.PeasantKitchenModule),
  },
  { path: 'space-video', component: SpaceVideoComponent },
  { path: 'material-icons', component: MaterialIconsComponent },
  { path: 'material-buttons', component: MaterialButtonsComponent },
  { path: 'resume', component: ResumeComponent },
  { path: 'admin', loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule), canActivate: [AdminGuard] },
  { 
    path: 'family',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['family'] },
    children: [
      {
        path: 'timeline',
        loadChildren: () => import('./projects/family/memorial-timeline/memorial-timeline.module').then(m => m.MemorialTimelineModule)
      }
    ]
  },
  { path: '404', loadChildren: () => import('./pages/not-found/not-found.module').then(m => m.NotFoundModule) },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/404' },
];
