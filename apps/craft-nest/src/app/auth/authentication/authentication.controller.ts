import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
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
  getUser() {
    // Return a mock user for now since this is mainly used for token validation
    return {
      id: '1',
      username: 'authenticated-user',
      firstName: 'Authenticated',
      lastName: 'User',
      email: 'user@example.com',
      roles: ['user']
    };
  }
}
