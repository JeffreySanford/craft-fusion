import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (!roles) {
      // No roles specified, allow access
      return true;
    }

    if (context.getType() === 'ws') {
      // For WebSocket connections
      const client: Socket = context.switchToWs().getClient();
      
      // Get user role from socket handshake/client data
      // In a real application, you'd retrieve this from JWT or session
      const userRole = client.handshake.auth?.role || 'guest';
      
      return roles.includes(userRole);
    } else {
      // For HTTP requests
      const request = context.switchToHttp().getRequest();
      
      // Get user role from request object
      // In a real application, you'd retrieve this from JWT or session
      const userRole = request.user?.role || 'guest';
      
      return roles.includes(userRole);
    }
  }
}
