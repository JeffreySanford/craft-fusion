import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  username: string;
  password: string;
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {


  status() {
    return false;
  }  
  
  getUserSession(): string | null {
    return sessionStorage.getItem('username');
  }

  setUserSession(user: User) {
    sessionStorage.setItem('username', user.username)
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

