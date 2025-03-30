import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { LoggerService } from './logger.service';

export interface UserState {
  id: string;
  username: string;
  isAdmin: boolean;
  email?: string;
  preferences?: any;
  // Add other user properties as needed
}

@Injectable({
  providedIn: 'root'
})
export class UserEventService {
  private userStateSubject = new BehaviorSubject<UserState | null>(null);

  constructor(
    private authService: AuthenticationService,
    private logger: LoggerService
  ) {
    this.logger.registerService('UserEventService');
    
    // Initialize with current auth state
    this.updateUserState();
    
    // Subscribe to authentication changes
    this.authService.authStateChanged$.subscribe(() => {
      this.updateUserState();
    });
  }

  private updateUserState(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          if (user) {
            const userState: UserState = {
              id: user.id,
              username: user.username || user.email || 'User',
              isAdmin: user.roles?.includes('admin') || user.isAdmin || false,
              email: user.email,
              preferences: user.preferences
            };
            
            this.userStateSubject.next(userState);
            this.logger.debug('User state updated', { username: userState.username, isAdmin: userState.isAdmin });
          }
        },
        error: (error) => {
          this.logger.error('Error getting current user', { error });
          this.userStateSubject.next(null);
        }
      });
    } else {
      this.userStateSubject.next(null);
      this.logger.debug('User logged out, state cleared');
    }
  }

  getUserStateChanges(): Observable<UserState | null> {
    return this.userStateSubject.asObservable();
  }

  isUserAdmin(): boolean {
    return !!this.userStateSubject.value?.isAdmin;
  }
  
  // Add a method to manually trigger state refresh
  refreshUserState(): void {
    this.updateUserState();
  }
}
