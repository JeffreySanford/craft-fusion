import { Module } from '@nestjs/common';
import { RbacGuard } from './rbac.guard';
import { AuthGateway } from './auth.gateway';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorizationModule } from './authorization/authorization.module';

@Module({
  imports: [
    AuthenticationModule,
    AuthorizationModule
  ],
  providers: [RbacGuard, AuthGateway],
  exports: [
    AuthenticationModule,
    AuthorizationModule,
    RbacGuard,
    AuthGateway
  ],
})
export class AuthModule {}
