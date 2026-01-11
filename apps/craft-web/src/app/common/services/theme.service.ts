import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoggerService } from './logger.service';

export type ThemeName = 'vibrant' | 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Theme state (string name for three-way theming)
  private _theme = new BehaviorSubject<ThemeName>('vibrant');
  readonly theme$ = this._theme.asObservable();
  // Expose previous boolean observable for backward compatibility (consumer can derive)
  readonly isDarkTheme$ = this._theme.asObservable();

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
      // Use saved preference (support both legacy 'dark'/'light' and new names)
      if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'vibrant') {
        this.setThemeByName(savedTheme as ThemeName);
      } else {
        this.setThemeByName('vibrant');
      }
      this.logger.endServiceCall(callId, 200);
      this.logger.info('Theme initialized from user preference', { theme: savedTheme });
    } else {
      // Default to 'vibrant' when no user preference exists
      this.setThemeByName('vibrant');
      this.logger.endServiceCall(callId, 204);
      this.logger.info('Theme initialized to default vibrant (no user preference)');
    }
  }

  public setTheme(isDark: boolean): void {
    // Backwards-compatible API: map boolean to 'dark'/'light'
    this.setThemeByName(isDark ? 'dark' : 'light');
  }

  public toggleTheme(): void {
    const curr = this._theme.value;
    const next = curr === 'dark' ? 'light' : curr === 'light' ? 'vibrant' : 'dark';
    this.setThemeByName(next);
    this.logger.info('Theme toggled', { newTheme: next });
  }

  public setThemeByName(name: ThemeName): void {
    this._theme.next(name);
    // Save preference
    localStorage.setItem('theme-preference', name);

    // Apply theme attribute and classes
    document.documentElement.setAttribute('data-theme', name);
    document.body.classList.remove('light-theme', 'dark-theme', 'vibrant-theme');
    document.body.classList.add(name + '-theme');

    this.logger.info(`Theme set to ${name}`);
  }

  public getCurrentTheme(): string {
    return this._theme.value;
  }
}
