import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // If user data already exists in socket, they're authenticated
      if (client.data.user) {
        return true;
      }
      
      // Get token from query params or headers
      const token = 
        client.handshake.query.token as string || 
        client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }
      
      // Verify JWT
      const payload = this.jwtService.verify(token);
      
      // Check if user has family role
      if (!payload.roles || !payload.roles.includes('family')) {
        throw new WsException('Forbidden: Missing required role');
      }
      
      // Store user data in socket
      client.data.user = payload;
      
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      this.logger.error(`WebSocket authentication error: ${errorMessage}`);
      throw new WsException(`Authentication error: ${errorMessage}`);
    }
  }
}
