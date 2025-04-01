import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { UserStateService } from './user-state.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Sidebar state
  private sidebarExpandedSubject = new BehaviorSubject<boolean>(true);
  public sidebarExpanded$ = this.sidebarExpandedSubject.asObservable();

  // Sidebar width (for auto-width functionality)
  private sidebarWidthSubject = new BehaviorSubject<number>(220); // Default width
  public sidebarWidth$ = this.sidebarWidthSubject.asObservable();

  // Sidebar resizing state
  private sidebarResizingSubject = new BehaviorSubject<boolean>(false);
  public sidebarResizing$ = this.sidebarResizingSubject.asObservable();

  // Sidebar width preference key
  private readonly SIDEBAR_WIDTH_KEY = 'sidebar-width';
  private readonly SIDEBAR_STATE_KEY = 'sidebar-expanded';

  // Footer state
  private footerExpandedSubject = new BehaviorSubject<boolean>(false);
  public footerExpanded$ = this.footerExpandedSubject.asObservable();

  // Mobile detection
  private isMobileSubject = new BehaviorSubject<boolean>(false);
  public isMobile$ = this.isMobileSubject.asObservable();

  // Layout dimensions to properly calculate available space
  private headerHeightSource = new BehaviorSubject<number>(64); // Default header height in px
  public headerHeight$ = this.headerHeightSource.asObservable();
  
  private footerHeightSource = new BehaviorSubject<number>(48); // Default footer height in px
  public footerHeight$ = this.footerHeightSource.asObservable();
  
  private gutterSizeSource = new BehaviorSubject<number>(16); // Default gutter size (1em ≈ 16px)
  public gutterSize$ = this.gutterSizeSource.asObservable();
  
  // Available content height (calculated based on header, footer, gutters)
  public availableContentHeight$ = combineLatest([
    this.headerHeight$, 
    this.footerHeight$, 
    this.footerExpanded$,
    this.gutterSize$
  ]).pipe(
    map(([headerHeight, footerHeight, isFooterExpanded, gutterSize]) => {
      const expandedFooterHeight = isFooterExpanded ? 192 : footerHeight; // 192px when expanded
      // Calculate available height accounting for header, footer and two gutters (top and bottom)
      return `calc(100vh - ${headerHeight}px - ${expandedFooterHeight}px - ${gutterSize * 2}px)`;
    })
  );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private userStateService: UserStateService
  ) {
    // Initialize from stored preferences
    this.initializeFromPreferences();
    
    // Listen for screen size changes
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]).subscribe(result => {
      const isMobile = result.matches;
      this.isMobileSubject.next(isMobile);
      
      // Auto-collapse sidebar on mobile
      if (isMobile && this.sidebarExpandedSubject.value) {
        this.collapseSidebar();
      }
    });
  }

  // Initialize from stored preferences
  private initializeFromPreferences(): void {
    // Restore sidebar expanded state
    const savedExpandedState = this.userStateService.getUserPreference(this.SIDEBAR_STATE_KEY);
    if (savedExpandedState !== null) {
      this.sidebarExpandedSubject.next(savedExpandedState === 'true');
    }
    
    // Restore sidebar width
    const savedWidth = this.userStateService.getUserPreference(this.SIDEBAR_WIDTH_KEY);
    if (savedWidth !== null) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width)) {
        this.sidebarWidthSubject.next(width);
      }
    }
  }

  // Toggle sidebar expanded state
  toggleSidebar(): void {
    const newState = !this.sidebarExpandedSubject.value;
    this.sidebarExpandedSubject.next(newState);
    this.saveExpandedState(newState);
  }
  
  // Added method for sidebar component
  toggleSidebarExpanded(): void {
    this.toggleSidebar();
  }

  // Expand sidebar
  expandSidebar(): void {
    this.sidebarExpandedSubject.next(true);
    this.saveExpandedState(true);
  }

  // Collapse sidebar
  collapseSidebar(): void {
    this.sidebarExpandedSubject.next(false);
    this.saveExpandedState(false);
  }

  // Set sidebar width (for resize handle)
  setSidebarWidth(width: number): void {
    // Constrain width between min and max allowed values
    const constrainedWidth = Math.max(200, Math.min(400, width));
    this.sidebarWidthSubject.next(constrainedWidth);
    this.saveWidthPreference(constrainedWidth);
  }

  // Get sidebar width for non-observable contexts
  getSidebarWidth(): number {
    return this.sidebarWidthSubject.value;
  }
  
  // Start sidebar resize operation
  startSidebarResize(): void {
    this.sidebarResizingSubject.next(true);
  }
  
  // End sidebar resize operation
  endSidebarResize(): void {
    this.sidebarResizingSubject.next(false);
  }

  // Toggle footer expanded state
  toggleFooter(): void {
    this.footerExpandedSubject.next(!this.footerExpandedSubject.value);
  }

  // Expand footer
  expandFooter(): void {
    this.footerExpandedSubject.next(true);
  }
  
  // Set footer expanded state
  setFooterExpanded(expanded: boolean): void {
    this.footerExpandedSubject.next(expanded);
  }

  // Collapse footer
  collapseFooter(): void {
    this.footerExpandedSubject.next(false);
  }

  // Check if viewport is mobile
  isMobile(): Observable<boolean> {
    return this.isMobile$;
  }

  // Return current sidebar state for direct access
  isSidebarExpanded(): boolean {
    return this.sidebarExpandedSubject.value;
  }

  // Save sidebar expanded state preference
  private saveExpandedState(expanded: boolean): void {
    this.userStateService.setUserPreference(this.SIDEBAR_STATE_KEY, expanded.toString());
  }

  // Save sidebar width preference
  private saveWidthPreference(width: number): void {
    this.userStateService.setUserPreference(this.SIDEBAR_WIDTH_KEY, width.toString());
  }

  /**
   * Sets the header height
   * @param height Height in pixels
   */
  setHeaderHeight(height: number): void {
    this.headerHeightSource.next(height);
  }

  /**
   * Sets the footer height
   * @param height Height in pixels
   */
  setFooterHeight(height: number): void {
    this.footerHeightSource.next(height);
  }

  /**
   * Sets the gutter size
   * @param size Size in pixels
   */
  setGutterSize(size: number): void {
    this.gutterSizeSource.next(size);
  }

  /**
   * Toggle footer expanded state
   * @param expanded Whether footer should be expanded
   */
  toggleFooterExpansion(expanded: boolean): void {
    this.footerExpandedSubject.next(expanded);
  }
}
