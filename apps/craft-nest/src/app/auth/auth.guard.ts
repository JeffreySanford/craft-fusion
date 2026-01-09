import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_COOKIE } from './authentication/authentication.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const type = context.getType();

    if (type === 'ws') {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractSocketToken(client);
      return this.verifyToken(token, client);
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractHeaderToken(request);
    return this.verifyToken(token, request);
  }

  private extractSocketToken(client: Socket): string | null {
    const cookieHeader = client.handshake.headers?.cookie;
    const cookies = this.parseCookieHeader(cookieHeader);
    return cookies[ACCESS_TOKEN_COOKIE] ?? null;
  }

  private extractHeaderToken(request: any): string | null {
    const header = request.headers?.authorization;
    if (header) {
      return header.startsWith('Bearer ') ? header.slice(7) : header;
    }

    const cookies = this.parseCookieHeader(request.headers?.cookie);
    return cookies[ACCESS_TOKEN_COOKIE] ?? null;
  }

  private verifyToken(token: string | null, target: { user?: unknown } | Socket) {
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify(token);
      if (this.isSocket(target)) {
        target.data.user = payload;
      } else {
        (target as { user?: unknown }).user = payload;
      }
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private isSocket(target: unknown): target is Socket {
    return !!(target && typeof target === 'object' && 'data' in target);
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
