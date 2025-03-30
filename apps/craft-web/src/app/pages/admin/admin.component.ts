import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { LoggerService } from '../../common/services/logger.service';
import { ThemeService } from '../../common/services/theme.service';

interface AdminTab {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: false
})
export class AdminComponent implements OnInit, OnDestroy {
  public selectedTabIndex = 0; // Default to the first tab (dashboard)
  public tabs: AdminTab[] = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', enabled: true },
    { id: 'logs', name: 'Logs', icon: 'receipt_long', enabled: true },
    { id: 'performance', name: 'Performance', icon: 'speed', enabled: true },
    { id: 'security', name: 'Security', icon: 'security', enabled: true },
    { id: 'api', name: 'API Monitor', icon: 'api', enabled: true }
  ];

  public usaTheme = false;
  public svgFlag: string | null = null;
  public footerVisible = true;
  public version = '1.0.0';
  public safeFooterMotto = "E Pluribus Unum";

  private destroy$ = new Subject<void>();
  private isTabNavigationInProgress = false;

  themeClass = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _location: Location,
    private logger: LoggerService,
    private cdRef: ChangeDetectorRef,
    private themeService: ThemeService
  ) {
    this.logger.registerService('AdminComponent');
  }

  ngOnInit(): void {
    this.logger.info('Admin component initialized');

    this.svgFlag = `<svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="40" fill="#bf0a30"/>
      <rect y="3.08" width="60" height="3.08" fill="#ffffff"/>
      <rect y="9.23" width="60" height="3.08" fill="#ffffff"/>
      <rect y="15.38" width="60" height="3.08" fill="#ffffff"/>
      <rect y="21.54" width="60" height="3.08" fill="#ffffff"/>
      <rect y="27.69" width="60" height="3.08" fill="#ffffff"/>
      <rect y="33.85" width="60" height="3.08" fill="#ffffff"/>
      <rect width="24" height="21.54" fill="#002868"/>
    </svg>`;

    // Subscribe to route params safely, but ONLY when there's a tab parameter
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        filter(params => !!params && !!params['tab'])
      )
      .subscribe(params => {
        // Just set the tab index directly from the route parameter
        const tabName = params['tab'];
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabName);
        if (tabIndex >= 0) {
          this.selectedTabIndex = tabIndex;
          this.cdRef.markForCheck();
        }
      });

    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });
  }

  toggleTheme(): void {
    this.usaTheme = !this.usaTheme;
    this.logger.info('Admin theme toggled', { theme: this.usaTheme ? 'USA' : 'Standard' });
  }

  private selectTabByName(tabName: string, updateUrl = true): void {
    if (this.isTabNavigationInProgress) {
      return;
    }

    this.isTabNavigationInProgress = true;

    try {
      const tabIndex = this.tabs.findIndex(tab => tab.id === tabName);
      if (tabIndex >= 0 && tabIndex !== this.selectedTabIndex) {
        this.selectedTabIndex = tabIndex;

        if (updateUrl) {
          this._location.replaceState(`/admin/${tabName}`);
        }

        this.cdRef.markForCheck();
      }
    } finally {
      setTimeout(() => {
        this.isTabNavigationInProgress = false;
      }, 0);
    }
  }

  onTabSelected(event: number): void {
    // Prevent navigation loops with a simple guard
    if (this.isTabNavigationInProgress) {
      return;
    }

    this.isTabNavigationInProgress = true;
    
    try {
      const selectedTab = this.tabs[event];
      if (!selectedTab) return;
      
      // Simply update the URL without complex logic
      this._location.replaceState(`/admin/${selectedTab.id}`);
      
      // Log the change
      this.logger.info(`Admin tab changed to ${selectedTab.name}`);
    } finally {
      // Clear the flag after a short delay to prevent navigation loops
      setTimeout(() => {
        this.isTabNavigationInProgress = false;
      }, 50);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
