import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthRedirectComponent } from './auth-redirect.component';

@NgModule({
  declarations: [AuthRedirectComponent],
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    RouterModule.forChild([
      {
        path: '',
        component: AuthRedirectComponent,
      },
      {
        path: ':mode',
        component: AuthRedirectComponent,
      },
    ]),
  ],
})
export class AuthModule {}
