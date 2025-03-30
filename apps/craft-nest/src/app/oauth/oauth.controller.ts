import { Controller, Get, Post, Body, Query, Redirect, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NestOAuthService } from './nest-oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly nestOAuthService: NestOAuthService) {}

  @Get('nest/authorize')
  @Redirect()
  authorizeNest() {
    const clientId = 'your-client-id';
    const redirectUri = this.nestOAuthService.getRedirectUri();
    const scope = 'read write';
    
    return {
      url: `https://api.nest.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`,
      statusCode: HttpStatus.FOUND
    };
  }

  @Get('nest/callback')
  handleCallback(@Query('code') code: string, @Query('error') error: string): Observable<any> {
    if (error) {
      throw new HttpException(`Authorization failed: ${error}`, HttpStatus.BAD_REQUEST);
    }

    if (!code) {
      throw new HttpException('No authorization code provided', HttpStatus.BAD_REQUEST);
    }

    return this.nestOAuthService.getAccessToken(code).pipe(
      catchError(err => {
        throw new HttpException(`Failed to exchange code for token: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      })
    );
  }

  @Post('nest/token')
  getToken(): Observable<any> {
    return this.nestOAuthService.getClientAccessToken().pipe(
      catchError(err => {
        throw new HttpException(`Failed to get client token: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      })
    );
  }

  @Post('nest/refresh')
  refreshToken(@Body('refresh_token') refreshToken: string): Observable<any> {
    if (!refreshToken) {
      throw new HttpException('No refresh token provided', HttpStatus.BAD_REQUEST);
    }

    return this.nestOAuthService.refreshClientToken(refreshToken).pipe(
      catchError(err => {
        throw new HttpException(`Failed to refresh token: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      })
    );
  }

  @Post('nest/revoke')
  revokeToken(@Body('token') token: string): Observable<any> {
    if (!token) {
      throw new HttpException('No token provided', HttpStatus.BAD_REQUEST);
    }

    return this.nestOAuthService.revokeClientToken(token).pipe(
      map(() => ({ message: 'Token successfully revoked' })),
      catchError(err => {
        throw new HttpException(`Failed to revoke token: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      })
    );
  }
}
