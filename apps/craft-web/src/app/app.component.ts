import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './common/services/theme.service';
import { LayoutService } from './common/services/layout.service';
import { LoggerService } from './common/services/logger.service';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'craft-fusion';
  isDarkTheme = false;
  isMobile = false;
  isFooterExpanded = false;
  sidebarWidth = 220; // Default width
  mainstageHeight = 'calc(100vh - 112px)'; // Default (header + footer)
  sidebarHeight = 'calc(100vh - 112px)'; // Default (header + footer)
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private themeService: ThemeService,
    public layoutService: LayoutService, // Changed to public to make it accessible from the template
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    // Listen for theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkTheme = isDark;
      });
    
    // Listen for mobile state changes
    this.layoutService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
      });
    
    // Listen for footer expanded state changes
    this.layoutService.footerExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isExpanded => {
        this.isFooterExpanded = isExpanded;
        this.updateLayoutSizes();
      });
      
    // Listen for sidebar width changes
    this.layoutService.sidebarWidth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(width => {
        this.sidebarWidth = width;
      });

    // Subscribe to dimension changes to update layout
    this.layoutService.dimensions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateLayoutSizes());
  }
  
  ngAfterViewInit(): void {
    // After view is initialized, measure actual header and footer heights
    setTimeout(() => {
      const headerElement = document.querySelector('app-header');
      if (headerElement instanceof HTMLElement) {
        this.layoutService.setHeaderHeight(headerElement.offsetHeight);
      }
      
      const footerElement = document.querySelector('app-footer');
      if (footerElement instanceof HTMLElement) {
        this.layoutService.setFooterHeight(footerElement.offsetHeight);
      }
      
      // Set default gutter size
      this.layoutService.setGutterSize(16);

      // Calculate and set initial sizes
      this.updateLayoutSizes();
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateLayoutSizes();
  }
  
  /**
   * Update layout sizes based on current dimensions and state
   */
  private updateLayoutSizes(): void {
    const mainstageHeight = this.layoutService.calculateMainstageHeight();
    this.mainstageHeight = `${mainstageHeight}px`;
    this.sidebarHeight = `${mainstageHeight}px`;
    
    // Force detection cycle to ensure sizes update
    setTimeout(() => {
      // This is just to trigger change detection in some edge cases
    }, 0);
    
    this.logger.debug('Layout sizes updated', {
      mainstageHeight: this.mainstageHeight,
      sidebarHeight: this.sidebarHeight
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
