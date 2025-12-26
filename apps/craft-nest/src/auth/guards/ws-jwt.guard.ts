import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { verify } from 'jsonwebtoken';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(client.handshake);

    if (!token) {
      throw new WsException('Authentication token not found');
    }

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      // Defend: do not accept tokens when secret is not configured
      this.logger.warn('JWT_SECRET is not configured; rejecting WebSocket authentication');
      throw new WsException('Server misconfiguration');
    }

    try {
      const payload = verify(token, secret) as Record<string, any>;
      client.user = payload;
      return true;
    } catch (e) {
      this.logger.warn('Invalid JWT presented to WebSocket guard', (e as Error).message);
      throw new WsException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(handshake: Record<string, any>): string | undefined {
    const authorization = handshake?.headers?.authorization || handshake?.auth?.token;
    if (!authorization) return undefined;

    // Authorization header format: 'Bearer <token>' or handshake.auth.token direct
    if (typeof authorization === 'string') {
      const [type, token] = authorization.split(' ');
      return type === 'Bearer' ? token : undefined;
    }

    return undefined;
  }
}
