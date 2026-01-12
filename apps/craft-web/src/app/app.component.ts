import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription, Subject, take, takeUntil, timer } from 'rxjs';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { UserStateService } from './common/services/user-state.service';
import { User } from './common/services/user.interface';
import { UserActivityService } from './common/services/user-activity.service';
import { LoggerService } from './common/services/logger.service';
import { AdminStateService } from './common/services/admin-state.service';
import { FooterStateService } from './common/services/footer-state.service';
import { SidebarStateService } from './common/services/sidebar-state.service';
import { AuthService } from './common/services/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isCollapsed = false;
  isSmallScreen = false;
  isExpanded = false;
  isFooterExpanded = false;

  title = 'frontend';
  private footerStateSubscription!: Subscription;

  menuItems = [{ label: 'Home', icon: 'home', routerLink: '/home', active: false }];
  polling = true;

  userDisplayName = '🔒 Guest';
  isLoggedIn = false;

  private videoCheckInterval: number = 10000;

  private inactivityTimeout: ReturnType<typeof setTimeout> | null = null;
  private videoCheckSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private adminStateService: AdminStateService,
    private userActivityService: UserActivityService,
    private logger: LoggerService,
    private authService: AuthService,
    private footerStateService: FooterStateService,
    private sidebarStateService: SidebarStateService,
    private userStateService: UserStateService,
  ) {

    this.logger.info('App component initialized', { appVersion: '1.0.0' });
    
    // Skip auto-logout in e2e test environment
    const isE2E = (window as any)['__E2E_TEST_MODE__'] === true;
    if (isE2E) {
      this.logger.info('E2E test mode detected - skipping auto-logout');
    } else {
      // Always clear authentication on app load/refresh in normal mode
      this.logger.info('Clearing authentication on app initialization');
      this.authService.logout();
    }
  }

  ngOnInit(): void {
    this.sidebarStateService.isCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(collapsed => {
        this.isCollapsed = collapsed;
      });
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result: BreakpointState) => {
      this.isSmallScreen = !!result && !!result.matches;
      if (this.isSmallScreen) {
        this.sidebarStateService.toggleSidebar(true);
      }
    });

    this.isSmallScreen = this.breakpointObserver.isMatched('(max-width: 599px)');

    this.logger.info('App component initialized');

    this.footerStateSubscription = this.footerStateService.expanded$.subscribe(expanded => {
      this.isFooterExpanded = expanded;

      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });

    this.authService.isAdmin$.subscribe(isAdmin => {
      this.adminStateService.setAdminStatus(isAdmin);
    });

    this.authService.initializeAuthentication();

    let lastInteractionLog = 0;
    document.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastInteractionLog > 10000) {
        lastInteractionLog = now;
      }
    });

    this.userStateService.user$.subscribe((user: unknown) => {
      const u = user as User | null | undefined;
      if (u) {
        this.userDisplayName = u.username || 'Guest';
        this.isLoggedIn = !!u.username;
      } else {
        this.userDisplayName = 'Guest';
        this.isLoggedIn = false;
      }
    });
  }

  ngAfterViewInit() {
    this.logger.info('App component view initialized');

    setTimeout(() => {
      this.ensureVideoIsPlaying();
    }, 100);

    this.setupConnectionTimeouts();

    this.addUserInteractionListener();
    this.startVideoCheckPolling();
  }

  ngOnDestroy() {
    this.logger.info('App component destroyed');

    this.removeUserInteractionListener();
    this.stopVideoCheckPolling();
    this.cancelAllTimeouts();

    const activitySummaryRaw = this.userActivityService.getActivitySummary();
    const activitySummary = (activitySummaryRaw as any) || { pageViews: 0, clicks: 0, sessionDuration: 0 };
    this.logger.info(
      `Session summary: ${activitySummary.pageViews ?? 0} page views, ${activitySummary.clicks ?? 0} clicks, ${Math.round((activitySummary.sessionDuration ?? 0) / 1000)} seconds duration`,
    );

    if (this.footerStateSubscription) {
      this.footerStateSubscription.unsubscribe();
    }

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    // Remove beforeunload handler
    window.removeEventListener('beforeunload', this.handleBeforeUnload);

    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleBeforeUnload = () => {
    // Placeholder for beforeunload event if needed in future
  };

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));

    if (item && typeof item === 'object') {
      (item as any).active = true;
    }
  }

  private setupConnectionTimeouts(): void {

    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {

    });
  }

  private cancelAllTimeouts(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    const pendingTimeouts = window.setTimeout(() => {}, 0);
    for (let i = 0; i < pendingTimeouts; i++) {
      window.clearTimeout(i);
    }
  }

  private ensureVideoIsPlaying() {
    const video = document.getElementById('background-video') as HTMLVideoElement;
    if (!video) {

      this.stopVideoCheckPolling();
      return;
    }

    video.playbackRate = 0.5;                       

    if (video.paused || video.ended) {

      setTimeout(() => {
        video
          .play()
          .then(() => {
            this.stopVideoCheckPolling();
            this.polling = false;
          })
          .catch(() => {

          });
      }, 20);
    } else {
      this.stopVideoCheckPolling();
      this.polling = false;
    }
  }

  private addUserInteractionListener() {
    document.addEventListener('click', this.handleUserInteraction);
    document.addEventListener('keydown', this.handleUserInteraction);
  }

  private removeUserInteractionListener() {
    document.removeEventListener('click', this.handleUserInteraction);
    document.removeEventListener('keydown', this.handleUserInteraction);
  }

  private handleUserInteraction = () => {
    if (this.polling) {
      this.ensureVideoIsPlaying();
    }
  };

  private startVideoCheckPolling(): void {

    this.stopVideoCheckPolling();

    if (!this.videoCheckSubscription) {
      this.videoCheckSubscription = timer(0, this.videoCheckInterval)
        .pipe(
          takeUntil(this.destroy$),

          take(5),
        )
        .subscribe(() => {
          this.ensureVideoIsPlaying();
        });
    }
  }

  private stopVideoCheckPolling() {
    if (this.videoCheckSubscription) {
      this.videoCheckSubscription.unsubscribe();
    }
  }

  onRouterActivate(event: unknown) {
    const fallback = document.getElementById('debug-router-fallback');
    if (fallback) fallback.style.display = 'none';
  }

  onRouterDeactivate(event: unknown) {
    setTimeout(() => {
      const fallback = document.getElementById('debug-router-fallback');
      if (fallback) fallback.style.display = 'block';
    }, 100);
  }
}
