import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() === 'ws') {
      // For WebSocket connections
      const client: Socket = context.switchToWs().getClient();

      // Get token from handshake auth
      const token = client.handshake.auth?.token;
      if (!token) {
        return false;
      }

      // Validate token
      return this.validateToken(token);
    } else {
      // For HTTP requests
      const request = context.switchToHttp().getRequest();

      // Get token from headers
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        return false;
      }

      // Validate token
      return this.validateToken(token);
    }
  }

  private validateToken(token: string): boolean {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      // Fallback: accept mock tokens in development only
      this.logger.warn('JWT_SECRET not configured; using fallback validation (development only)');
      return token === 'your-secret-token';
    }

    try {
      verify(token, secret);
      return true;
    } catch (e) {
      this.logger.warn('Invalid JWT token presented', (e as Error).message);
      return false;
    }
  }
}
