import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthorizationService {
  canAccessResource(userRole: string, resource: string): boolean {
    return userRole === 'admin';
  }
}
