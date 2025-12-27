import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

export interface AdminMetrics {
  activeUsers: number;
  permissionRequests: number;
  connection: string;
}

@Injectable()
export class AdminService {
  constructor(private usersService: UsersService) {}

  async getMetrics(): Promise<AdminMetrics> {
    // Use UsersService.getAllUsers() as a best-effort data source; return defaults when unavailable
    try {
      const users = await this.usersService.getAllUsers().toPromise();
      const activeUsers = Array.isArray(users) ? users.filter(u => (u as any).isActive).length : 0;
      // permissionRequests: not implemented yet; default to 0
      return {
        activeUsers: activeUsers || 0,
        permissionRequests: 0,
        connection: 'Secure'
      };
    } catch (e) {
      return { activeUsers: 0, permissionRequests: 0, connection: 'Secure' };
    }
  }
}
