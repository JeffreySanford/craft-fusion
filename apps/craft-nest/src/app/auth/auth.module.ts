import { Module } from '@nestjs/common';
import { RbacGuard } from './rbac.guard';
import { AuthenticationModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    AuthenticationModule,
    AuthorizationModule
  ],
  providers: [RbacGuard],
  exports: [
    AuthenticationModule, 
    AuthorizationModule,
    RbacGuard
  ],
})
export class AuthModule {}
