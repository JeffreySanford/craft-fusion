import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ThemeService } from './theme.service';
import { distinctUntilChanged, map } from 'rxjs/operators';

export interface LayoutConfig {
  header?: boolean;
  footer?: boolean;
  sidebar?: boolean;
  sidebarExpanded?: boolean;
  mainPadding?: boolean;
  transparentHeader?: boolean;
  fullscreen?: boolean;
}

export interface LayoutDimensions {
  headerHeight: number;
  footerHeight: number;
  footerMaxHeight?: number;
  sidebarWidth: number;
  contentTop: number;
  contentBottom: number;
  contentLeft: number;
  gutterSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private sidebarExpandedSubject = new BehaviorSubject<boolean>(true);
  sidebarExpanded$ = this.sidebarExpandedSubject.asObservable().pipe(distinctUntilChanged());

  private sidebarVisibleSubject = new BehaviorSubject<boolean>(true);
  sidebarVisible$ = this.sidebarVisibleSubject.asObservable().pipe(distinctUntilChanged());

  private headerVisibleSubject = new BehaviorSubject<boolean>(true);
  headerVisible$ = this.headerVisibleSubject.asObservable().pipe(distinctUntilChanged());

  private footerVisibleSubject = new BehaviorSubject<boolean>(true);
  footerVisible$ = this.footerVisibleSubject.asObservable().pipe(distinctUntilChanged());

  private footerExpandedSubject = new BehaviorSubject<boolean>(false);
  footerExpanded$ = this.footerExpandedSubject.asObservable().pipe(distinctUntilChanged());

  private transparentHeaderSubject = new BehaviorSubject<boolean>(false);
  transparentHeader$ = this.transparentHeaderSubject.asObservable().pipe(distinctUntilChanged());

  private fullscreenSubject = new BehaviorSubject<boolean>(false);
  fullscreen$ = this.fullscreenSubject.asObservable().pipe(distinctUntilChanged());

  private mainPaddingSubject = new BehaviorSubject<boolean>(true);
  mainPadding$ = this.mainPaddingSubject.asObservable().pipe(distinctUntilChanged());

  private sidebarWidthSubject = new BehaviorSubject<number>(250);
  sidebarWidth$ = this.sidebarWidthSubject.asObservable().pipe(distinctUntilChanged());

  private isMobileSubject = new BehaviorSubject<boolean>(false);
  isMobile$ = this.isMobileSubject.asObservable().pipe(distinctUntilChanged());

  private headerHeightSubject = new BehaviorSubject<number>(64);
  headerHeight$ = this.headerHeightSubject.asObservable().pipe(distinctUntilChanged());

  private footerHeightSubject = new BehaviorSubject<number>(48);
  footerHeight$ = this.footerHeightSubject.asObservable().pipe(distinctUntilChanged());

  private gutterSizeSubject = new BehaviorSubject<number>(16);
  gutterSize$ = this.gutterSizeSubject.asObservable().pipe(distinctUntilChanged());

  private sidebarResizingSubject = new BehaviorSubject<boolean>(false);
  sidebarResizing$ = this.sidebarResizingSubject.asObservable().pipe(distinctUntilChanged());

  private layoutDimensionsSubject = new BehaviorSubject<LayoutDimensions>({
    headerHeight: 64,
    footerHeight: 48,
    sidebarWidth: 250,
    contentTop: 64,
    contentBottom: 48,
    contentLeft: 250,
    gutterSize: 16
  });
  layoutDimensions$ = this.layoutDimensionsSubject.asObservable().pipe(distinctUntilChanged((prev, curr) =>
    JSON.stringify(prev) === JSON.stringify(curr)
  ));

  // Add missing dimensions$ (alias for layoutDimensions$)
  dimensions$ = this.layoutDimensions$;

  constructor(private themeService: ThemeService) {
    this.checkIfMobile();
    window.addEventListener('resize', () => this.checkIfMobile());
  }

  /**
   * Configure the layout based on the given config
   */
  configureLayout(config: LayoutConfig): void {
    if (config.header !== undefined) this.headerVisibleSubject.next(config.header);
    if (config.footer !== undefined) this.footerVisibleSubject.next(config.footer);
    if (config.sidebar !== undefined) this.sidebarVisibleSubject.next(config.sidebar);
    if (config.sidebarExpanded !== undefined) this.sidebarExpandedSubject.next(config.sidebarExpanded);
    if (config.mainPadding !== undefined) this.mainPaddingSubject.next(config.mainPadding);
    if (config.transparentHeader !== undefined) this.transparentHeaderSubject.next(config.transparentHeader);
    if (config.fullscreen !== undefined) this.fullscreenSubject.next(config.fullscreen);
    this.updateLayoutDimensions();
  }

  /**
   * Reset layout to default settings
   */
  resetLayout(): void {
    this.configureLayout({
      header: true,
      footer: true,
      sidebar: true,
      sidebarExpanded: true,
      mainPadding: true,
      transparentHeader: false,
      fullscreen: false
    });
  }

  toggleSidebar(): void {
    this.sidebarExpandedSubject.next(!this.sidebarExpandedSubject.value);
    this.updateLayoutDimensions();
  }

  expandSidebar(): void {
    this.sidebarExpandedSubject.next(true);
    this.updateLayoutDimensions();
  }

  collapseSidebar(): void {
    this.sidebarExpandedSubject.next(false);
    this.updateLayoutDimensions();
  }

  toggleFooter(): void {
    this.footerExpandedSubject.next(!this.footerExpandedSubject.value);
  }

  expandFooter(): void {
    this.footerExpandedSubject.next(true);
  }

  collapseFooter(): void {
    this.footerExpandedSubject.next(false);
  }

  setSidebarWidth(width: number): void {
    this.sidebarWidthSubject.next(width);
    this.updateLayoutDimensions();
    this.logger.debug(`Sidebar width set to ${width}px`);
  }

  isSidebarExpanded(): boolean {
    return this.sidebarExpandedSubject.value;
  }

  isHeaderVisible(): boolean {
    return this.headerVisibleSubject.value;
  }

  isFooterVisible(): boolean {
    return this.footerVisibleSubject.value;
  }

  isSidebarVisible(): boolean {
    return this.sidebarVisibleSubject.value;
  }

  /**
   * Set header height in pixels and update layout dimensions
   * @param height Header height in pixels
   */
  setHeaderHeight(height: number): void {
    this.headerHeightSubject.next(height);
    this.updateLayoutDimensions();
    this.logger.debug(`Header height set to ${height}px`);
  }

  /**
   * Set footer height in pixels and update layout dimensions
   * @param height Footer height in pixels
   */
  setFooterHeight(height: number): void {
    this.footerHeightSubject.next(height);
    this.updateLayoutDimensions();
    this.logger.debug(`Footer height set to ${height}px`);
  }

  /**
   * Set gutter size in pixels and update layout dimensions
   * @param size Gutter size in pixels
   */
  setGutterSize(size: number): void {
    this.gutterSizeSubject.next(size);
    this.updateLayoutDimensions();
    this.logger.debug(`Gutter size set to ${size}px`);
  }

  /**
   * Toggle footer expansion state
   */
  toggleFooterExpansion(): void {
    this.footerExpandedSubject.next(!this.footerExpandedSubject.value);
  }

  /**
   * Set footer expansion state explicitly
   * @param isExpanded Whether the footer should be expanded
   */
  setFooterExpansion(isExpanded: boolean): void {
    this.footerExpandedSubject.next(isExpanded);
  }

  /**
   * Get current layout dimensions
   * @returns Current layout dimensions
   */
  getLayoutDimensions(): LayoutDimensions {
    return this.layoutDimensionsSubject.value;
  }

  /**
   * Calculate the available height for the mainstage
   * @returns Available height for mainstage in pixels
   */
  calculateMainstageHeight(): number {
    const { headerHeight, footerHeight } = this.layoutDimensionsSubject.value;
    const windowHeight = window.innerHeight;

    return windowHeight - headerHeight - footerHeight;
  }

  /**
   * Toggle sidebar expanded state
   */
  toggleSidebarExpanded(): void {
    this.toggleSidebar();
  }

  /**
   * Start sidebar resize operation
   */
  startSidebarResize(): void {
    this.sidebarResizingSubject.next(true);
  }

  /**
   * End sidebar resize operation
   */
  endSidebarResize(): void {
    this.sidebarResizingSubject.next(false);
  }

  /**
   * Check if the viewport is in mobile mode
   * @returns Observable<boolean> True if in mobile mode
   */
  isMobile(): Observable<boolean> {
    return this.isMobile$;
  }

  private checkIfMobile(): void {
    this.isMobileSubject.next(window.innerWidth < 768);
    if (window.innerWidth < 768) {
      this.sidebarExpandedSubject.next(false);
    }
    this.updateLayoutDimensions();
  }

  // Call this on application startup to ensure responsive layout is set
  setInitialResponsiveState(): void {
    this.checkIfMobile();
  }

  /**
   * Update layout dimensions based on current component sizes
   */
  private updateLayoutDimensions(): void {
    const headerVisible = this.headerVisibleSubject.value;
    const footerVisible = this.footerVisibleSubject.value;
    const sidebarVisible = this.sidebarVisibleSubject.value;
    const sidebarExpanded = this.sidebarExpandedSubject.value;

    const headerHeight = headerVisible ? this.headerHeightSubject.value : 0;
    const footerHeight = footerVisible ? this.footerHeightSubject.value : 0;
    const sidebarWidth = sidebarVisible
      ? (sidebarExpanded ? this.sidebarWidthSubject.value : 64)
      : 0;

    const contentTop = headerHeight;
    const contentBottom = footerHeight;
    const contentLeft = sidebarWidth;
    const gutterSize = this.gutterSizeSubject.value;

    this.layoutDimensionsSubject.next({
      headerHeight,
      footerHeight,
      sidebarWidth,
      contentTop,
      contentBottom,
      contentLeft,
      gutterSize
    });
  }

  private logger = {
    debug: (message: string) => console.log(`[LayoutService] ${message}`),
    info: (message: string) => console.info(`[LayoutService] ${message}`),
    warn: (message: string) => console.warn(`[LayoutService] ${message}`),
    error: (message: string) => console.error(`[LayoutService] ${message}`)
  };
}
