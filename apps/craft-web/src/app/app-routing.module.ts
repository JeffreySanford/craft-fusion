import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './common/guards/auth.guard';
import { RoleGuard } from './common/guards/role.guard';

const routes: Routes = [

  {
    path: 'timeline',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['timeline', 'admin'] },
    loadChildren: () => import('./projects/timeline/timeline.module').then(m => m.TimelineModule),
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
