import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from './logger.service';
import { catchError, map } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  preferences: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private mockUser: User = {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    roles: ['Admin', 'User'],
    preferences: {
      theme: 'dark',
      notifications: true
    }
  };

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.logger.registerService('UserService');
  }

  // Add getUser method that returns an Observable
  getUser(): Observable<User> {
    this.logger.debug('Getting user data');
    // In a real app, this would call the backend API
    return of(this.mockUser);
  }

  // Keep existing getUsers method for backward compatibility
  getUsers(): User[] {
    return [this.mockUser];
  }

  // Add updateUserProfile method
  updateUserProfile(profileData: {name?: string, email?: string}): Observable<User> {
    this.logger.info('Updating user profile', { profileData });
    
    // Update the mock user
    if (profileData.name) this.mockUser.name = profileData.name;
    if (profileData.email) this.mockUser.email = profileData.email;
    
    // In a real app, this would call the backend API
    return of(this.mockUser);
  }

  // Add registerUser method
  registerUser(userData: any): Observable<User> {
    this.logger.info('Registering new user', { email: userData.email });
    
    // In a real app, this would call the backend API
    return of(this.mockUser);
  }

  // Add requestPasswordReset method
  requestPasswordReset(email: string): Observable<boolean> {
    this.logger.info('Password reset requested', { email });
    
    // In a real app, this would call the backend API
    return of(true);
  }
}