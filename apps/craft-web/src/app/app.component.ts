import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ThemeService } from './common/services/theme.service';
import { LayoutService } from './common/services/layout.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = 'craft-fusion';
  isDarkTheme = false;
  isMobile = false;
  isFooterExpanded = false;
  sidebarWidth = 220; // Default width
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private themeService: ThemeService,
    public layoutService: LayoutService // Changed to public to make it accessible from the template
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
      });
      
    // Listen for sidebar width changes
    this.layoutService.sidebarWidth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(width => {
        this.sidebarWidth = width;
      });
  }
  
  ngAfterViewInit(): void {
    // After view is initialized, measure actual header and footer heights
    setTimeout(() => {
      const headerElement = document.querySelector('.layout-header') as HTMLElement;
      const footerElement = document.querySelector('.layout-footer') as HTMLElement;
      
      if (headerElement) {
        this.layoutService.setHeaderHeight(headerElement.offsetHeight);
      }
      
      if (footerElement) {
        this.layoutService.setFooterHeight(footerElement.offsetHeight);
      }
      
      // Set gutter size in pixels (1em is typically 16px)
      this.layoutService.setGutterSize(16);
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
