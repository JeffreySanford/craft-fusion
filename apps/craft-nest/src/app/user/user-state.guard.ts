import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class UserStateGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const guestAllowed = this.reflector.get<boolean>('guestAllowed', context.getHandler());
    
    // Check if the user is authenticated
    const isAuthenticated = request.headers.authorization !== undefined;
    
    // If guest access is allowed, then anyone can access this endpoint
    if (guestAllowed) {
      // If guest request, add guest flag to request
      if (!isAuthenticated) {
        request.isGuest = true;
        request.guestId = this.getOrCreateGuestId(request);
      }
      return true;
    }
    
    // Otherwise, only allow authenticated users
    return isAuthenticated;
  }
  
  private getOrCreateGuestId(request: Request): string {
    // Check for existing guest ID in cookies
    const guestId = request.cookies?.guestId;
    
    // If no guest ID exists, we'd normally create and set one
    // This simplified version just returns a placeholder
    return guestId || `guest-${Date.now()}`;
  }
}
