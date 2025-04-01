import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserStateService } from './user-state.service';

export interface ThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  surface: string;
  background: string;
  onPrimary: string;
  onSecondary: string;
  onTertiary: string;
  onSurface: string;
  outline: string;
  shadow: string;
}

/**
 * Service responsible for managing application themes
 * Supports multiple themes with vibrant patriotic colors
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Theme colors - vibrant patriotic themes
  // Added index signature [key: string] to fix compilation error
  private themes: { [key: string]: ThemeColors } = {
    'light-theme': {
      primary: '#002868', // Navy blue
      secondary: '#B22234', // Vibrant red
      tertiary: '#FFD700', // Gold
      surface: '#FFFFFF', // White
      background: '#F8F9FA',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onTertiary: '#000000',
      onSurface: '#1F1F1F',
      outline: '#D1D5DB',
      shadow: 'rgba(0, 40, 104, 0.1)'
    },
    'dark-theme': {
      primary: '#4682B4', // Lighter navy
      secondary: '#FF6B6B', // Brighter red
      tertiary: '#FFD700', // Gold
      surface: '#1F1F1F',
      background: '#121212',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onTertiary: '#000000',
      onSurface: '#F8F9FA',
      outline: '#4B5563',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    'patriotic-bold-theme': {
      primary: '#0A3161', // Deeper navy blue
      secondary: '#E40032', // Brighter red
      tertiary: '#FFBF00', // Rich gold
      surface: '#FFFFFF',
      background: '#F0F0F0',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onTertiary: '#000000',
      onSurface: '#1F1F1F',
      outline: '#C0C0C0',
      shadow: 'rgba(10, 49, 97, 0.15)'
    },
    'patriotic-vintage-theme': {
      primary: '#19477F', // Muted navy blue
      secondary: '#A81B31', // Muted red
      tertiary: '#DEB841', // Antique gold
      surface: '#F5F5F0', // Off-white
      background: '#E8E6E1',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onTertiary: '#222222',
      onSurface: '#1F1F1F',
      outline: '#C0C0C0',
      shadow: 'rgba(25, 71, 127, 0.1)'
    }
  };

  // Store current theme and make it observable
  private themeSubject = new BehaviorSubject<string>('light-theme');
  public currentTheme$ = this.themeSubject.asObservable();
  
  // Create isDarkTheme$ observable to fix compilation errors
  public isDarkTheme$: Observable<boolean> = this.currentTheme$.pipe(
    map(theme => theme === 'dark-theme')
  );
  
  private renderer: Renderer2;
  
  constructor(
    rendererFactory: RendererFactory2,
    private userStateService: UserStateService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    
    // Load saved theme from local storage or user state
    this.loadSavedTheme();
  }
  
  /**
   * Load theme from user state or localStorage
   */
  private loadSavedTheme(): void {
    // Try to get from user state first if available
    const userTheme = this.userStateService.getUserPreference('theme');
    const savedTheme = userTheme || localStorage.getItem('theme') || 'light-theme';
    this.setTheme(savedTheme);
  }
  
  /**
   * Set the current theme
   * @param theme The theme to set (e.g., 'light-theme', 'dark-theme')
   */
  setTheme(theme: string): void {
    // Validate theme
    if (!this.themes[theme]) {
      console.warn(`Invalid theme specified: ${theme}. Defaulting to light-theme.`);
      theme = 'light-theme';
    }
    
    // Remove all theme classes from body
    Object.keys(this.themes).forEach(themeName => {
      this.renderer.removeClass(document.body, themeName);
    });
    
    // Add new theme class to body
    this.renderer.addClass(document.body, theme);
    
    // Update CSS variables based on theme
    this.updateCssVariables(theme);
    
    // Save to local storage and user preferences
    localStorage.setItem('theme', theme);
    this.userStateService.setUserPreference('theme', theme);
    
    // Update the theme subject
    this.themeSubject.next(theme);
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const currentTheme = this.themeSubject.getValue();
    const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
    this.setTheme(newTheme);
  }
  
  /**
   * Alias for toggleTheme() to fix compilation errors
   */
  toggleDarkTheme(): void {
    this.toggleTheme();
  }
  
  /**
   * Get the current theme
   */
  getTheme(): string {
    return this.themeSubject.getValue();
  }
  
  /**
   * Alias for getTheme() to fix compilation errors
   */
  getCurrentTheme(): string {
    return this.getTheme();
  }
  
  /**
   * Check if the current theme is dark
   */
  isDarkTheme(): boolean {
    return this.themeSubject.getValue() === 'dark-theme';
  }
  
  /**
   * Get available themes
   */
  getAvailableThemes(): string[] {
    return Object.keys(this.themes);
  }
  
  /**
   * Update CSS custom properties based on selected theme
   */
  private updateCssVariables(theme: string): void {
    const colorSet = this.themes[theme];
    if (!colorSet) return;
    
    // Set CSS variables
    document.documentElement.style.setProperty('--md-sys-color-primary', colorSet.primary);
    document.documentElement.style.setProperty('--md-sys-color-secondary', colorSet.secondary);
    document.documentElement.style.setProperty('--md-sys-color-tertiary', colorSet.tertiary);
    document.documentElement.style.setProperty('--md-sys-color-surface', colorSet.surface);
    document.documentElement.style.setProperty('--md-sys-color-background', colorSet.background);
    document.documentElement.style.setProperty('--md-sys-color-on-primary', colorSet.onPrimary);
    document.documentElement.style.setProperty('--md-sys-color-on-secondary', colorSet.onSecondary);
    document.documentElement.style.setProperty('--md-sys-color-on-tertiary', colorSet.onTertiary);
    document.documentElement.style.setProperty('--md-sys-color-on-surface', colorSet.onSurface);
    document.documentElement.style.setProperty('--md-sys-color-outline', colorSet.outline);
    document.documentElement.style.setProperty('--md-sys-color-shadow', colorSet.shadow);
    
    // Add derived colors for different surface elevations
    const isDark = theme === 'dark-theme' || theme === 'patriotic-dark-theme';
    document.documentElement.style.setProperty('--md-sys-color-surface-variant', 
      isDark ? '#2C2C2C' : '#E7E5E4');
    
    // Set elevation shadows
    document.documentElement.style.setProperty('--md-sys-elevation-level1', 
      `0 2px 4px ${colorSet.shadow}`);
    document.documentElement.style.setProperty('--md-sys-elevation-level2', 
      `0 4px 8px ${colorSet.shadow}`);
    document.documentElement.style.setProperty('--md-sys-elevation-level3', 
      `0 8px 16px ${colorSet.shadow}`);
      
    // Set patriotic gradient
    document.documentElement.style.setProperty('--patriotic-gradient', 
      `linear-gradient(135deg, ${colorSet.primary}, ${colorSet.secondary})`);
      
    // Set header gradient
    document.documentElement.style.setProperty('--header-gradient', 
      isDark
        ? `linear-gradient(to right, #1F1F1F, #2C2C2C)` 
        : `linear-gradient(to right, ${colorSet.primary}, ${this.lightenColor(colorSet.primary, 20)})`);
        
    // Set menu gradient
    document.documentElement.style.setProperty('--menu-gradient', 
      isDark
        ? 'linear-gradient(135deg, #1F1F1F, #2C2C2C)' 
        : `linear-gradient(135deg, ${colorSet.surface}, #F0F0F0)`);
  }
  
  /**
   * Utility to lighten a color by a percentage
   */
  private lightenColor(color: string, amount: number): string {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Lighten
    r = Math.min(255, r + Math.round(r * amount / 100));
    g = Math.min(255, g + Math.round(g * amount / 100));
    b = Math.min(255, b + Math.round(b * amount / 100));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
