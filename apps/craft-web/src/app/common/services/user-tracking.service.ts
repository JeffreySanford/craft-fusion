import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppUser {
  username: string;
  // ...other user-related fields...
}

@Injectable({
  providedIn: 'root',
})
export class UserTrackingService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);

  getCurrentUser(): Observable<AppUser | null> {
    return this.currentUserSubject.asObservable();
  }

  setCurrentUser(user: AppUser | null): void {
    this.currentUserSubject.next(user);
  }
}
