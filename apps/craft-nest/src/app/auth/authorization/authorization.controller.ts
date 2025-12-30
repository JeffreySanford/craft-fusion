import { Controller, Get, Query } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';

@Controller('authorize')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get('check')
  checkAccess(@Query('role') role: string) {
    return this.authorizationService.canAccessResource(role);
  }
}
