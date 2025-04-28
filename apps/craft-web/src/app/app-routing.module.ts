import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './common/guards/auth.guard';
import { RoleGuard } from './common/guards/role.guard';

const routes: Routes = [
  // ... existing routes
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
  // ... other routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
