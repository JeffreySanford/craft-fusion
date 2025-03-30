import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Theme state
  private _isDarkTheme = new BehaviorSubject<boolean>(false);
  readonly isDarkTheme$ = this._isDarkTheme.asObservable();

  // Current theme
  private _currentTheme = new BehaviorSubject<string>('light');
  readonly currentTheme$ = this._currentTheme.asObservable();

  // System preference
  private prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  constructor(private logger: LoggerService) {
    // Register this service for metrics tracking
    this.logger.registerService('ThemeService');
    
    // Initialize theme based on stored preference or system preference
    this.initializeTheme();
    
    // Listen for system preference changes
    this.prefersDarkScheme.addEventListener('change', (e) => {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme-preference')) {
        this.logger.debug('System theme preference changed', { isDark: e.matches });
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  private initializeTheme(): void {
    // Check if user has set a preference
    const savedTheme = localStorage.getItem('theme-preference');
    const callId = this.logger.startServiceCall('ThemeService', 'GET', 'localStorage:theme-preference');
    
    if (savedTheme) {
      // Use saved preference
      this.setTheme(savedTheme);
      this.logger.endServiceCall(callId, 200);
      this.logger.info('Theme initialized from user preference', { theme: savedTheme });
    } else {
      // Use system preference
      this.setTheme(this.prefersDarkScheme.matches ? 'dark' : 'light');
      this.logger.endServiceCall(callId, 204);
      this.logger.info('Theme initialized from system preference', { isDark: this.prefersDarkScheme.matches });
    }
  }

  public setTheme(themeName: string): void {
    // Update dark theme state (for backward compatibility)
    this._isDarkTheme.next(themeName === 'dark');
    
    // Update current theme state
    this._currentTheme.next(themeName);
    
    // Save preference
    localStorage.setItem('theme-preference', themeName);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Update body class - remove all theme classes first
    document.body.classList.remove('light-theme', 'dark-theme', 'vibrant1-theme', 'vibrant2-theme');
    
    // Add the current theme class with consistent naming convention
    document.body.classList.add(themeName + '-theme');
    
    this.logger.info(`Theme set to ${themeName} mode`);
  }

  public toggleTheme(): void {
    const currentTheme = this._currentTheme.value;
    // Fix inconsistent naming - remove 'theme-' prefix
    const newTheme = currentTheme === 'dark' ? 'light' : 
                     currentTheme === 'light' ? 'dark' : 
                     currentTheme === 'vibrant1' ? 'vibrant2' : 'vibrant1';
    this.setTheme(newTheme);
    this.logger.info('Theme toggled', { newTheme });
  }

  public getCurrentTheme(): string {
    // Return the actual current theme from local storage
    return localStorage.getItem('theme-preference') || 'light';
  }

  /**
   * Toggle between light and dark theme
   */
  public toggleDarkTheme(): void {
    const newThemeValue = !this._isDarkTheme.value;
    this._isDarkTheme.next(newThemeValue);
    this.saveThemePreference(newThemeValue);
  }

  /**
   * Explicitly set the theme
   * @param isDark - Whether to use dark theme (true) or light theme (false)
   */
  public setDarkTheme(isDark: boolean): void {
    this._isDarkTheme.next(isDark);
    this.saveThemePreference(isDark);
  }

  private saveThemePreference(isDark: boolean): void {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
}
