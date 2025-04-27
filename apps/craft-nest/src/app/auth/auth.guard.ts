import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class AuthGuard implements CanActivate {
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
      
      // Validate token (implement your validation logic)
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
    // Implement your token validation logic here
    // This is just a placeholder - replace with actual validation
    return token === 'your-secret-token';
  }
}
