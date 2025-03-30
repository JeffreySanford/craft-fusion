import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ThemeService } from '../services/theme.service';
import { FooterStateService } from '../services/footer-state.service';
import { map, shareReplay } from 'rxjs/operators';

export interface UiState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isFooterExpanded: boolean;
  isDarkTheme: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UiStateFacade {
  // Main UI state
  private uiState$ = new BehaviorSubject<UiState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isFooterExpanded: false,
    isDarkTheme: false
  });

  // Responsive state tracking
  private readonly isHandsetLayout$: Observable<boolean>;

  constructor(
    private logger: LoggerService,
    private breakpointObserver: BreakpointObserver,
    private themeService: ThemeService,
    private footerStateService: FooterStateService
  ) {
    this.logger.registerService('UiStateFacade');
    
    // Initialize responsive layout detection
    this.isHandsetLayout$ = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).pipe(
      map(result => result.matches),
      shareReplay(1)
    );
    
    // Initialize UI state
    this.initializeState();
  }
  
  /**
   * Initialize UI state by subscribing to various state providers
   */
  private initializeState(): void {
    // Subscribe to responsive changes
    this.breakpointObserver.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).subscribe(result => {
      if (result.matches) {
        this.updateState({ isMobile: true, isTablet: false, isDesktop: false });
        this.logger.debug('UI State: Mobile layout detected');
      }
    });
    
    this.breakpointObserver.observe([
      Breakpoints.TabletPortrait,
      Breakpoints.TabletLandscape
    ]).subscribe(result => {
      if (result.matches) {
        this.updateState({ isMobile: false, isTablet: true, isDesktop: false });
        this.logger.debug('UI State: Tablet layout detected');
      }
    });
    
    this.breakpointObserver.observe([
      Breakpoints.WebPortrait, 
      Breakpoints.WebLandscape
    ]).subscribe(result => {
      if (result.matches) {
        this.updateState({ isMobile: false, isTablet: false, isDesktop: true });
        this.logger.debug('UI State: Desktop layout detected');
      }
    });
    
    // Subscribe to footer state
    this.footerStateService.expanded$.subscribe(expanded => {
      this.updateState({ isFooterExpanded: expanded });
      this.logger.debug('UI State: Footer expanded state changed', { expanded });
    });
    
    // Subscribe to theme changes
    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.updateState({ isDarkTheme: isDark });
      this.logger.debug('UI State: Theme changed', { isDarkTheme: isDark });
    });
  }
  
  /**
   * Update UI state partially
   */
  private updateState(partialState: Partial<UiState>): void {
    const currentState = this.uiState$.getValue();
    this.uiState$.next({ ...currentState, ...partialState });
  }
  
  /**
   * Get the current UI state as an observable
   */
  getUiState(): Observable<UiState> {
    return this.uiState$.asObservable();
  }
  
  /**
   * Get the current UI state value
   */
  getCurrentState(): UiState {
    return this.uiState$.getValue();
  }
  
  /**
   * Toggle the footer expanded state
   */
  toggleFooter(): void {
    const currentState = this.getCurrentState();
    this.footerStateService.setExpanded(!currentState.isFooterExpanded);
  }
  
  /**
   * Toggle the theme
   */
  toggleTheme(): void {
    const currentState = this.getCurrentState();
    // Fix: Use toggleDarkTheme() instead of setDarkTheme() which doesn't exist
    this.themeService.toggleDarkTheme();
  }
  
  /**
   * Check if current layout is mobile
   */
  isMobileLayout(): boolean {
    return this.getCurrentState().isMobile;
  }
  
  /**
   * Get mobile layout as observable
   */
  isMobileLayout$(): Observable<boolean> {
    return this.uiState$.pipe(
      map(state => state.isMobile)
    );
  }
  
  /**
   * Check if layout is handset (mobile or tablet)
   */
  isHandsetLayout(): Observable<boolean> {
    return this.isHandsetLayout$;
  }
}
