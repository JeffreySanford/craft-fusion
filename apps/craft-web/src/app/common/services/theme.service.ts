import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Theme state
  private _isDarkTheme = new BehaviorSubject<boolean>(false);
  readonly isDarkTheme$ = this._isDarkTheme.asObservable();

  // System preference
  private prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  constructor(private logger: LoggerService) {
    // Register this service for metrics tracking
    this.logger.registerService('ThemeService');

    // Initialize theme based on stored preference or system preference
    this.initializeTheme();

    // Listen for system preference changes
    this.prefersDarkScheme.addEventListener('change', e => {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme-preference')) {
        this.logger.debug('System theme preference changed', { isDark: e.matches });
        this.setTheme(e.matches);
      }
    });
  }

  private initializeTheme(): void {
    // Check if user has set a preference
    const savedTheme = localStorage.getItem('theme-preference');
    const callId = this.logger.startServiceCall('ThemeService', 'GET', 'localStorage:theme-preference');

    if (savedTheme) {
      // Use saved preference
      this.setTheme(savedTheme === 'dark');
      this.logger.endServiceCall(callId, 200);
      this.logger.info('Theme initialized from user preference', { theme: savedTheme });
    } else {
      // Use system preference
      this.setTheme(this.prefersDarkScheme.matches);
      this.logger.endServiceCall(callId, 204);
      this.logger.info('Theme initialized from system preference', { isDark: this.prefersDarkScheme.matches });
    }
  }

  public setTheme(isDark: boolean): void {
    // Update state
    this._isDarkTheme.next(isDark);

    // Save preference
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Update body class
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    this.logger.info(`Theme set to ${isDark ? 'dark' : 'light'} mode`);
  }

  public toggleTheme(): void {
    const currentTheme = this._isDarkTheme.value;
    this.setTheme(!currentTheme);
    this.logger.info('Theme toggled', { newIsDark: !currentTheme });
  }

  public getCurrentTheme(): string {
    return this._isDarkTheme.value ? 'dark' : 'light';
  }
}
