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
  permissions?: string[]; // Ensure permissions is marked as optional
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  permissions: string[]; // This expects a non-optional array
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
    this.logger.debug(`Authentication attempt initiated`, { 
      username,
      timestamp: new Date().toISOString()
    });
    
    // Demo authentication logic - replace with real DB check
    if (username === 'admin' && password === 'admin') {
      const user: User = {
        id: 1,
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        permissions: ['read:all', 'write:all', 'delete:all'] // Define permissions explicitly here
      };
      
      this.addActiveUser(user);
      this.logger.log(`Authentication successful`, {
        username,
        role: user.role,
        permissions: user.permissions?.join(',') || 'none', // Fixed: Use optional chaining
        loginAttemptResult: 'success'
      });
      
      return of(user);
    } else if (username === 'user' && password === 'user') {
      const user: User = {
        id: 2,
        username: 'user',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
        permissions: ['read:own', 'write:own'] // Define permissions explicitly here
      };
      
      this.addActiveUser(user);
      this.logger.log(`Authentication successful`, {
        username,
        role: user.role,
        permissions: user.permissions?.join(',') || 'none', // Fixed: Use optional chaining
        loginAttemptResult: 'success'
      });
      
      return of(user);
    }
    
    this.logger.warn(`Authentication failed - invalid credentials`, { 
      username,
      loginAttemptResult: 'failure',
      reason: 'Invalid username or password'
    });
    
    return of(null);
  }

  generateToken(user: User): string {
    this.logger.debug(`Generating JWT token for user`, {
      username: user.username,
      userId: user.id,
      role: user.role
    });
    
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [] // Fixed: Use nullish coalescing to provide default empty array
    };
    
    const token = this.jwtService.sign(payload);
    
    this.logger.debug(`JWT token generated successfully`, {
      username: user.username,
      tokenLength: token.length,
      expiresIn: '1h' // This should match your actual JWT expiration config
    });
    
    return token;
  }

  verifyToken(token: string): Observable<User | null> {
    try {
      this.logger.debug('Verifying JWT token');
      const payload = this.jwtService.verify(token) as JwtPayload;
      
      this.logger.debug('Token verified successfully', {
        username: payload.username,
        role: payload.role,
        tokenSubject: payload.sub
      });
      
      const user: User = {
        id: payload.sub,
        username: payload.username,
        firstName: '', // These would come from a user service/database
        lastName: '',
        role: payload.role,
        permissions: payload.permissions || [] // Fixed: Use nullish coalescing for safety
      };
      
      return of(user);
    } catch (error: unknown) {
      const typedError = error as Error;
      this.logger.error(`Token verification failed`, {
        error: typedError.message,
        stack: typedError.stack?.split('\n')[0]
      });
      
      return of(null);
    }
  }

  private addActiveUser(user: User): void {
    const currentUsers = this.activeUsers.value;
    currentUsers.set(user.username, user);
    this.activeUsers.next(currentUsers);
    
    this.logger.debug(`User added to active sessions`, {
      username: user.username,
      activeSessionCount: currentUsers.size
    });
  }

  getActiveUsers(): Observable<User[]> {
    return this.activeUsers.pipe(
      map(userMap => Array.from(userMap.values()))
    );
  }
}
