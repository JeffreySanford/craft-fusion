import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AuthenticationService } from './authentication.service';
import { AuthorizationService } from './authorization.service';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  providers: [AuthService, AuthenticationService, AuthorizationService],
})
export class AuthModule {}
