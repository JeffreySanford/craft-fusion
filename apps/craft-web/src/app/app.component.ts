import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ThemeService } from './common/services/theme.service';
import { Subscription, Subject } from 'rxjs';
import { LayoutService } from './common/services/layout.service';
import { LoggerService } from './common/services/logger.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  @Input() collapsed: boolean = false;
  currentTheme = '';
  sidebarCollapsed = false;
  sidebarVisible = true; // Always keep sidebar visible
  public isFooterExpanded = false;
  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private layoutService: LayoutService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    // Subscribe to theme changes
    this.subscriptions.push(
      this.themeService.currentTheme$.subscribe(theme => {
        this.currentTheme = theme;
        this.logger.info(`Theme changed to: ${theme}`);
      })
    );

    // Subscribe to sidebar state
    this.subscriptions.push(
      this.layoutService.sidebarCollapsed$.subscribe(collapsed => {
        this.sidebarCollapsed = collapsed;
        this.logger.info(`Sidebar collapsed state: ${collapsed}`);
      })
    );
    
    // Subscribe to sidebar visibility
    this.subscriptions.push(
      this.layoutService.sidebarVisible$.subscribe(visible => {
        // Always ensure sidebar is at least partially visible
        this.sidebarVisible = true;
        this.logger.info(`Sidebar visibility enforced as: true`);
      })
    );

    // Subscribe to footer expanded state
    this.layoutService.footerExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(expanded => {
        this.isFooterExpanded = expanded;
      });
  }

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  // Modified to only collapse sidebar, never completely hide it
  minimizeSidebar() {
    if (!this.sidebarCollapsed) {
      this.layoutService.setSidebarCollapsed(true);
    }
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }
}
