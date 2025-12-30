import { Controller, Post, Body, HttpCode, HttpStatus, Get, Headers } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password?: string }) {
    // Accept username + password; controller surfaces Unauthorized for invalid creds
    return this.authService.login(body.username, body.password);
  }

  @Get('user')
  @HttpCode(HttpStatus.OK)
  getUser(@Headers('authorization') authorization?: string) {
    // If an Authorization header with a Bearer token is provided, resolve the
    // actual user from the JWT. Otherwise return a generic authenticated user.
    return this.authService.getUserFromToken(authorization);
  }
}
