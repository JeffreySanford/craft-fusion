import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles: string[];
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable()
export class AuthenticationService {
  login(username: string): LoginResponse {
    // Mock user data based on username
    const user: User = {
      id: username === 'guest' ? '1' : username === 'test' ? '2' : '3',
      username: username,
      firstName: username === 'guest' ? 'Guest' : username === 'test' ? 'Test' : 'Admin',
      lastName: 'User',
      email: `${username}@example.com`,
      role: username === 'guest' ? 'guest' : username === 'test' ? 'user' : 'admin',
      roles: [username === 'guest' ? 'guest' : username === 'test' ? 'user' : 'admin']
    };

    return {
      token: `jwt-token-for-${username}-${Date.now()}`,
      user: user
    };
  }
}
