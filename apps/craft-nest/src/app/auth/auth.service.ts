import { Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { map } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Active users with their roles - for demonstration purposes
  private activeUsers = new BehaviorSubject<Map<string, User>>(new Map());
  
  constructor(private jwtService: JwtService) {
    this.logger.log('Auth service initialized with RBAC support');
    console.log('Auth service ready for connections');
  }

  validateUser(username: string, password: string): Observable<User | null> {
    this.logger.debug(`Attempting to validate user: ${username}`);
    console.log(`Auth attempt for: ${username}`);
    
    // Demo authentication logic - replace with real DB check
    if (username === 'admin' && password === 'admin') {
      const user: User = {
        id: 1,
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        permissions: ['read:all', 'write:all', 'delete:all']
      };
      
      this.addActiveUser(user);
      return of(user);
    } else if (username === 'user' && password === 'user') {
      const user: User = {
        id: 2,
        username: 'user',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
        permissions: ['read:own', 'write:own']
      };
      
      this.addActiveUser(user);
      return of(user);
    }
    
    this.logger.warn(`Failed login attempt for user: ${username}`);
    console.log(`Failed login: ${username}`);
    return of(null);
  }

  generateToken(user: User): string {
    this.logger.debug(`Generating JWT token for user: ${user.username}`);
    
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || []
    };
    
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): Observable<User | null> {
    try {
      this.logger.debug('Verifying JWT token');
      const payload = this.jwtService.verify(token) as JwtPayload;
      
      const user: User = {
        id: payload.sub,
        username: payload.username,
        firstName: '', // These would come from a user service/database
        lastName: '',
        role: payload.role,
        permissions: payload.permissions
      };
      
      return of(user);
    } catch (error) {
      this.logger.error('Token verification failed', error);
      console.error('Invalid token:', error.message);
      return of(null);
    }
  }

  private addActiveUser(user: User): void {
    const activeUsersMap = this.activeUsers.value;
    activeUsersMap.set(user.username, user);
    this.activeUsers.next(new Map(activeUsersMap));
    
    this.logger.log(`User added to active sessions: ${user.username} (${user.role})`);
    console.log(`Active user added: ${user.username}, Role: ${user.role}`);
  }
}
