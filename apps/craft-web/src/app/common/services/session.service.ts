import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './user.interface';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  constructor(private logger: LoggerService) {
    this.logger.registerService('SessionService');
  }

  getFullName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else {
      return user.username;                        
    }
  }

  status() {
    return false;
  }

  getUserSession(): string | null {
    return sessionStorage.getItem('username');
  }

  setUserSession(user: User) {
    const callId = this.logger.startServiceCall('SessionService', 'SET', '/session/user');
    sessionStorage.setItem('username', user.username);
    this.logger.endServiceCall(callId, 200);
  }

  clearUserSession() {
    sessionStorage.removeItem('username');
  }

  private constantTimeEquals(a: string | null, b: string): boolean {
    if (a === null) return false;
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  validateToken(token: string): Observable<boolean> {
    const callId = this.logger.startServiceCall('SessionService', 'VALIDATE', '/session/token');
    return new Observable<boolean>(observer => {
      const stored = this.getUserSession();
      const isValid = this.constantTimeEquals(stored, token);
      observer.next(isValid);
      observer.complete();
      this.logger.endServiceCall(callId, isValid ? 200 : 401);
    });
  }
}
