import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthorizationService {
  canAccessResource(userRole: string, resource: string): boolean {
    void resource;
    return userRole === 'admin';
  }
}
