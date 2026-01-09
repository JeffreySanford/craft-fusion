import { Controller, Post, Body, HttpStatus, HttpCode, Get, Req, Res } from '@nestjs/common';
import { Request, Response, CookieOptions } from 'express';
import { AuthenticationService, LoginResponse } from './authentication.service';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './authentication.constants';

interface AuthStatusPayload {
  user: AuthenticatedUser;
  expiresIn: number;
  refreshExpiresIn: number;
}

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password?: string }, @Res({ passthrough: true }) res: Response) {
    const authResponse = await this.authService.login(body.username, body.password);
    this.setAuthCookies(res, authResponse);
    return this.mapToPayload(authResponse);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.readCookie(req, REFRESH_TOKEN_COOKIE);
    const authResponse = await this.authService.refreshTokens(refreshToken);
    this.setAuthCookies(res, authResponse);
    return this.mapToPayload(authResponse);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.readCookie(req, REFRESH_TOKEN_COOKIE);
    await this.authService.revokeRefreshToken(refreshToken);
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get('user')
  @HttpCode(HttpStatus.OK)
  getUser(@Req() req: Request) {
    const token = (req.headers.authorization as string | undefined) ?? this.readCookie(req, ACCESS_TOKEN_COOKIE);
    const user = this.authService.getUserFromToken(token ?? '');
    return {
      user,
      expiresIn: this.authService.getAccessTokenExpiry(),
      refreshExpiresIn: this.getRefreshTokenExpiry(),
    };
  }

  private setAuthCookies(res: Response, response: LoginResponse): void {
    const secure = process.env['NODE_ENV'] === 'production';
    const accessOptions: CookieOptions = {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: response.expiresIn * 1000,
      path: '/',
    };
    const refreshOptions: CookieOptions = {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: response.refreshExpiresIn * 1000,
      path: '/',
    };

    res.cookie(ACCESS_TOKEN_COOKIE, response.accessToken, accessOptions);
    res.cookie(REFRESH_TOKEN_COOKIE, response.refreshToken, refreshOptions);
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private mapToPayload(response: LoginResponse): AuthStatusPayload {
    return {
      user: response.user,
      expiresIn: response.expiresIn,
      refreshExpiresIn: response.refreshExpiresIn,
    };
  }

  private getRefreshTokenExpiry(): number {
    const configured = Number(process.env['REFRESH_TOKEN_EXPIRATION'] ?? 604800);
    return Number.isNaN(configured) ? 604800 : configured;
  }

  private readCookie(req: Request, name: string): string | undefined {
    const header = req.headers.cookie;
    const cookies = this.parseCookieHeader(header);
    return cookies[name];
  }

  private parseCookieHeader(header?: string): Record<string, string> {
    if (!header) {
      return {};
    }

    return header.split(';').reduce<Record<string, string>>((acc, pair) => {
      const [key, ...rest] = pair.split('=');
      const trimmedKey = key?.trim();
      if (!trimmedKey) {
        return acc;
      }
      const value = rest.join('=').trim();
      acc[trimmedKey] = decodeURIComponent(value);
      return acc;
    }, {});
  }
}
