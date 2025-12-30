import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthorizationService {
  canAccessResource(userRole: string): boolean {
    return userRole === 'admin';
  }
}
