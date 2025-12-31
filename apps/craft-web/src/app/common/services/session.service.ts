import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './user.interface';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  // Helper method to get full name from a user
  getFullName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else {
      return user.username; // Fallback to username
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
  //  Return a boolean observable when the user is validated
  validateToken(token: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      if (this.getUserSession() === token) {
        observer.next(true);
      }
    });
  }
}
