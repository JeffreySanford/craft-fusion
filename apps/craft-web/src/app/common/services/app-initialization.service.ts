import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { LoggerService } from './logger.service';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {
  private renderer: Renderer2;
  
  constructor(
    private rendererFactory: RendererFactory2,
    private logger: LoggerService,
    private themeService: ThemeService
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.logger.registerService('AppInitializationService');
  }

  // Initialize application settings and configurations
  initialize(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.logger.info('Initializing application...');
      
      // Apply saved theme
      this.loadSavedTheme();
      
      // Here you would add other initialization tasks like:
      // - Loading user settings
      // - Checking authentication status
      // - Preloading critical data
      // - Setting up global event listeners
      
      this.logger.info('Application initialization completed successfully');
      resolve(true);
    });
  }
  
  // Load and apply the saved theme from localStorage
  private loadSavedTheme(): void {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.themeService.setTheme(savedTheme);
        this.logger.debug('Applied saved theme', { theme: savedTheme });
      } else {
        // No theme in storage, use system preference or default
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.themeService.setTheme(prefersDark ? 'dark-theme' : 'light-theme');
      }
    } catch (error) {
      this.logger.error('Failed to load saved theme', { error });
      // Fall back to light theme
      this.themeService.setTheme('light-theme');
    }
  }
  
  // Utility method to safely add a class to the document body
  addClassToBody(className: string): void {
    this.renderer.addClass(document.body, className);
  }
  
  // Utility method to safely remove a class from the document body
  removeClassFromBody(className: string): void {
    this.renderer.removeClass(document.body, className);
  }
}

// Factory function for APP_INITIALIZER
export function initializeApp(appInitService: AppInitializationService) {
  return () => appInitService.initialize();
}
