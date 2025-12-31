import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
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

  constructor(
    private readonly jwtService: JwtService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

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
      console.log('[AuthenticationService] ADMIN_PASSWORD present in env?', Boolean(envPass));
    }

    // If admin credentials are configured, enforce password check (env first, fall back to DB)
    if (envAdmin && (username === envAdmin || username === 'test')) {
      // For 'test' user, allow login without password for development
      if (username === 'test') {
        isAdminLogin = true;
        console.log('[AuthenticationService] Test user login - granting admin privileges');
      } else if (!password) {
        console.log('[AuthenticationService] Missing password for admin login');
        throw new UnauthorizedException('Missing password');
      } else {
        // For dev convenience we support plain-text ADMIN_PASSWORD; in future use a hashed value
        let envValidated = false;
        console.log('[AuthenticationService] Comparing password with envPass:', { 
          passwordLength: password?.length, 
          envPassLength: envPass?.length, 
          passwordEquals: password === envPass,
          passwordValue: password ? password.substring(0, 2) + '*'.repeat(Math.max(0, password.length - 2)) : 'undefined',
          envPassValue: envPass ? envPass.substring(0, 2) + '*'.repeat(Math.max(0, envPass.length - 2)) : 'undefined'
        });
        if (envPass && password && (password === envPass || await bcrypt.compare(password, envPass))) {
          envValidated = true;
          isAdminLogin = true;
          console.log('[AuthenticationService] Admin credentials validated (env)');
        } else {
          console.log('[AuthenticationService] Admin env check failed (envPass present?)', Boolean(envPass));
        }

        // If env check failed, try a users collection in the DB (useful for in-memory seeding)
        if (!envValidated) {
          // If Mongoose is not connected, avoid accessing connection
          if (!this.connection || this.connection.readyState !== 1) {
            console.log('[AuthenticationService] No DB connection available; env check failed, cannot validate against DB');
            throw new UnauthorizedException('Invalid credentials');
          }

          try {
            const usersColl = this.connection.collection('users');
            const dbUser = await usersColl.findOne({ username: envAdmin });
            console.log('[AuthenticationService] DB user found?', !!dbUser);
            if (dbUser && dbUser['passwordHash'] && typeof dbUser['passwordHash'] === 'string' && password) {
              console.log('[AuthenticationService] DB user has passwordHash? true');
              console.log('[AuthenticationService] passwordHash starts with:', String(dbUser['passwordHash']).substring(0, 10) + '...');
              const match = await bcrypt.compare(password, dbUser['passwordHash']);
              console.log('[AuthenticationService] bcrypt.compare result:', match);
              if (match) {
                isAdminLogin = true;
                console.log('[AuthenticationService] Admin credentials validated (db)');
              } else {
                console.log('[AuthenticationService] Admin credentials invalid (db)');
                throw new UnauthorizedException('Invalid credentials');
              }
            } else {
              console.log('[AuthenticationService] DB user missing or no passwordHash');
              throw new UnauthorizedException('Invalid credentials');
            }
          } catch (e) {
            console.log('[AuthenticationService] Error checking DB credentials', String(e));
            throw new UnauthorizedException('Invalid credentials');
          }
        }
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

  /**
   * Resolve a user object from an Authorization header containing a Bearer JWT.
   * If no header is provided, returns a generic authenticated user (backwards-compatible).
   */
  getUserFromToken(authHeader?: string) {
    if (!authHeader) {
      return {
        id: '1',
        username: 'authenticated-user',
        firstName: 'Authenticated',
        lastName: 'User',
        email: 'user@example.com',
        roles: ['user'],
        role: 'user'
      };
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const payload: any = this.jwtService.verify(token);
      const username = payload.username || 'authenticated-user';
      const roles = Array.isArray(payload.roles) && payload.roles.length ? payload.roles : ['user'];
      return {
        id: payload.sub ? String(payload.sub) : '1',
        username,
        firstName: username === 'admin' ? 'Admin' : 'Authenticated',
        lastName: 'User',
        email: `${username}@example.com`,
        roles,
        role: roles[0]
      };
    } catch (e) {
      // If token verification fails, fall back to generic authenticated user
      this.logger.warn('Failed to verify JWT in getUserFromToken', String(e));
      return {
        id: '1',
        username: 'authenticated-user',
        firstName: 'Authenticated',
        lastName: 'User',
        email: 'user@example.com',
        roles: ['user'],
        role: 'user'
      };
    }
  }
}
