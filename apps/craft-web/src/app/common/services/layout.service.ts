import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { LoggerService } from './logger.service';

/**
 * Layout configuration interface
 */
export interface LayoutConfig {
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideSidebar?: boolean;
  customClass?: string;
}

/**
 * Layout Service
 * Manages application layout state including sidebar, header and footer visibility
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // State subjects with exposed observables
  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);
  public sidebarCollapsed$ = this.sidebarCollapsedSubject.pipe(distinctUntilChanged());

  private sidebarVisibleSubject = new BehaviorSubject<boolean>(true);
  public sidebarVisible$ = this.sidebarVisibleSubject.pipe(distinctUntilChanged());

  private sidebarWidthSubject = new BehaviorSubject<number>(240);
  public sidebarWidth$ = this.sidebarWidthSubject.pipe(distinctUntilChanged());

  private headerVisibleSubject = new BehaviorSubject<boolean>(true);
  public headerVisible$ = this.headerVisibleSubject.pipe(distinctUntilChanged());

  private footerVisibleSubject = new BehaviorSubject<boolean>(true);
  public footerVisible$ = this.footerVisibleSubject.pipe(distinctUntilChanged());

  private footerExpandedSubject = new BehaviorSubject<boolean>(false);
  public footerExpanded$ = this.footerExpandedSubject.pipe(distinctUntilChanged());

  private isSmallScreenSubject = new BehaviorSubject<boolean>(false);
  public isSmallScreen$ = this.isSmallScreenSubject.pipe(distinctUntilChanged());

  constructor(private logger: LoggerService) {
    this.logger.registerService('LayoutService');
    this.initScreenSizeDetection();
  }

  /**
   * Toggle sidebar collapsed state
   */
  public toggleSidebar(): void {
    this.sidebarCollapsedSubject.next(!this.sidebarCollapsedSubject.value);
  }

  /**
   * Set sidebar collapsed state
   */
  public setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedSubject.next(collapsed);
    this.logger.info(`Sidebar collapsed state set to: ${collapsed}`);
  }
  
  /**
   * Toggle footer expanded state
   */
  public toggleFooterExpanded(): void {
    const expanded = !this.footerExpandedSubject.value;
    this.footerExpandedSubject.next(expanded);
    this.adjustLayoutForFooterExpansion(expanded);
    this.logger.info(`Footer expanded state set to: ${expanded}`);
  }

  /**
   * Set layout visibility properties
   */
  public setVisibility(config: {
    header?: boolean,
    footer?: boolean,
    sidebar?: boolean
  }): void {
    if (config.header !== undefined) {
      this.headerVisibleSubject.next(config.header);
      this.logger.info(`Header visibility set to: ${config.header}`);
    }
    
    if (config.footer !== undefined) {
      this.footerVisibleSubject.next(config.footer);
      this.logger.info(`Footer visibility set to: ${config.footer}`);
    }
    
    if (config.sidebar !== undefined) {
      // Don't allow hiding sidebar completely
      if (!config.sidebar) {
        this.setSidebarCollapsed(true);
      } else {
        this.sidebarVisibleSubject.next(config.sidebar);
        this.logger.info(`Sidebar visibility set to: ${config.sidebar}`);
      }
    }
  }

  /**
   * Sidebar methods
   */
  public setSidebarWidth(width: number): void {
    this.sidebarWidthSubject.next(width);
    this.logger.info(`Sidebar width set to: ${width}px`);
  }

  /**
   * Configure layout with specific settings
   */
  public configureLayout(config: LayoutConfig): void {
    this.setVisibility({
      header: config.hideHeader === undefined ? undefined : !config.hideHeader,
      footer: config.hideFooter === undefined ? undefined : !config.hideFooter,
      sidebar: config.hideSidebar === undefined ? undefined : !config.hideSidebar
    });
    this.logger.info('Layout configured with custom settings', { config });
  }

  /**
   * Reset layout to default configuration
   */
  public resetLayout(): void {
    this.setVisibility({ header: true, footer: true, sidebar: true });
    this.setSidebarCollapsed(false);
    this.footerExpandedSubject.next(false);
    this.adjustLayoutForFooterExpansion(false);
    this.logger.info('Layout reset to defaults');
  }
  
  /**
   * State accessor methods - avoid redundancy by providing these
   * instead of multiple individual methods
   */
  public getState(): {
    sidebarCollapsed: boolean,
    sidebarVisible: boolean,
    headerVisible: boolean,
    footerVisible: boolean,
    footerExpanded: boolean,
    isSmallScreen: boolean
  } {
    return {
      sidebarCollapsed: this.sidebarCollapsedSubject.value,
      sidebarVisible: this.sidebarVisibleSubject.value,
      headerVisible: this.headerVisibleSubject.value,
      footerVisible: this.footerVisibleSubject.value,
      footerExpanded: this.footerExpandedSubject.value,
      isSmallScreen: this.isSmallScreenSubject.value
    };
  }

  /**
   * Adjust layout elements (sidebar and mainstage) for footer expansion
   */
  private adjustLayoutForFooterExpansion(footerExpanded: boolean): void {
    if (typeof document !== 'undefined') {
      const footerHeight = footerExpanded 
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--footer-expanded-height'), 10) || 300
        : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--footer-height'), 10) || 60;
      
      document.documentElement.style.setProperty('--main-content-height', 
        `calc(100vh - var(--header-height) - ${footerHeight}px)`);
      this.logger.debug(`Adjusted layout for footer expansion: ${footerExpanded}`);
    }
  }

  /**
   * Initialize screen size detection
   */
  private initScreenSizeDetection(): void {
    // Check initial screen size
    this.checkScreenSize();

    // Listen for window resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkScreenSize());
    }
  }

  /**
   * Check screen size and update isSmallScreen state
   */
  private checkScreenSize(): void {
    if (typeof window !== 'undefined') {
      const isSmall = window.innerWidth < 768;
      
      if (isSmall !== this.isSmallScreenSubject.value) {
        this.isSmallScreenSubject.next(isSmall);
        
        // Auto-collapse sidebar on small screens
        if (isSmall && !this.sidebarCollapsedSubject.value) {
          this.setSidebarCollapsed(true);
        }
        
        this.logger.debug(`Screen size changed, isSmallScreen: ${isSmall}`);
      }
    }
  }
}
