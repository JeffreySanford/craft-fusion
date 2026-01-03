import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './user.interface';

@Injectable({
  providedIn: 'root',
})
export class SessionService {

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
    sessionStorage.setItem('username', user.username);
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
    return new Observable<boolean>(observer => {
      const stored = this.getUserSession();
      observer.next(this.constantTimeEquals(stored, token));
      observer.complete();
    });
  }
}
