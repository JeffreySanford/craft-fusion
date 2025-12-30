import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { verify } from 'jsonwebtoken';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(client.handshake);
    
    if (!token) {
      throw new WsException('Authentication token not found');
    }
    
    try {
      // Replace 'your_jwt_secret' with actual secret from config
      const payload = verify(token, 'your_jwt_secret');
      client.user = payload;
      return true;
    } catch (e) {
      throw new WsException('Invalid authentication token');
    }
  }
  
  private extractTokenFromHeader(handshake: Record<string, any>): string | undefined {
    const authorization = handshake?.['headers']?.authorization;
    if (!authorization) return undefined;
    
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
