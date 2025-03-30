import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private preferences: Record<string, any> = {};
  private preferencesSubject = new BehaviorSubject<Record<string, any>>({});

  constructor(private logger: LoggerService) {
    this.logger.registerService('UserPreferencesService');
    this.loadPreferences();
  }

  /**
   * Load user preferences from local storage
   */
  private loadPreferences(): void {
    try {
      const storedPreferences = localStorage.getItem('user-preferences');
      if (storedPreferences) {
        this.preferences = JSON.parse(storedPreferences);
        this.preferencesSubject.next({...this.preferences});
        this.logger.info('User preferences loaded from storage');
      }
    } catch (error) {
      this.logger.error('Failed to load user preferences', { error });
    }
  }

  /**
   * Get user preferences
   * @returns Observable of preferences
   */
  getPreferences(): Observable<Record<string, any>> {
    return of({...this.preferences}); // Return as Observable to match expected type
  }
  
  /**
   * Save user preferences
   */
  savePreferences(preferences: Record<string, any>): Observable<Record<string, any>> {
    this.preferences = {...preferences};
    
    try {
      localStorage.setItem('user-preferences', JSON.stringify(this.preferences));
      this.preferencesSubject.next({...this.preferences});
      this.logger.info('User preferences saved to storage');
    } catch (error) {
      this.logger.error('Failed to save user preferences', { error });
    }
    
    return of(this.preferences); // Return as Observable for consistency
  }

  /**
   * Update preferences (alias for savePreferences for backward compatibility)
   */
  updatePreferences(preferences: Record<string, any>): Observable<Record<string, any>> {
    return this.savePreferences(preferences);
  }

  /**
   * Get preference value by key
   */
  getPreference<T>(key: string, defaultValue?: T): T {
    return this.preferences[key] !== undefined ? this.preferences[key] : defaultValue as T;
  }
  
  /**
   * Set preference value
   */
  setPreference(key: string, value: any): void {
    this.preferences[key] = value;
    this.savePreferences(this.preferences);
  }
  
  /**
   * Get preference changes as observable
   */
  getPreferenceChanges(): Observable<Record<string, any>> {
    return this.preferencesSubject.asObservable();
  }
  
  /**
   * Clear all preferences
   */
  clearPreferences(): void {
    this.preferences = {};
    localStorage.removeItem('user-preferences');
    this.preferencesSubject.next({});
    this.logger.info('User preferences cleared');
  }
}