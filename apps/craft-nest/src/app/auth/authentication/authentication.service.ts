import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

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
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Login with username and optional password. If ADMIN_USERNAME/ADMIN_PASSWORD
   * are set in the environment the service will validate against them.
   */
  async login(username: string, password?: string): Promise<LoginResponse> {
    console.log('[AuthenticationService] login called', { username });

    const envAdmin = process.env['ADMIN_USERNAME'];
    const envPass = process.env['ADMIN_PASSWORD'];

    let isAdminLogin = false;

    if (envAdmin) {
      console.log('[AuthenticationService] ADMIN_USERNAME is present in env');
    }

    // If admin credentials are configured, enforce password check
    if (envAdmin && username === envAdmin) {
      if (!password) {
        console.log('[AuthenticationService] Missing password for admin login');
        throw new UnauthorizedException('Missing password');
      }

      // For dev convenience we support plain-text ADMIN_PASSWORD; in future use a hashed value
      if (envPass && (password === envPass || await bcrypt.compare(password, envPass))) {
        isAdminLogin = true;
        console.log('[AuthenticationService] Admin credentials validated');
      } else {
        console.log('[AuthenticationService] Admin credentials invalid');
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Mock user data based on username
    const user: User = {
      id: username === 'guest' ? '1' : username === 'test' ? '2' : '3',
      username: username,
      firstName: username === 'guest' ? 'Guest' : username === 'test' ? 'Test' : 'Admin',
      lastName: 'User',
      email: `${username}@example.com`,
      role: isAdminLogin ? 'admin' : (username === 'guest' ? 'guest' : username === 'test' ? 'user' : 'user'),
      roles: [isAdminLogin ? 'admin' : (username === 'guest' ? 'guest' : username === 'test' ? 'user' : 'user')]
    };

    // Sign a JWT token using JwtService
    const payload = { sub: user.id, username: user.username, roles: user.roles };
    const token = this.jwtService.sign(payload);

    console.log('[AuthenticationService] Token generated', { tokenLength: token.length, isAdmin: isAdminLogin });
    this.logger.debug('JWT generated for user', { username: user.username, isAdmin: isAdminLogin });

    return {
      token: token,
      user: user
    };
  }
}
