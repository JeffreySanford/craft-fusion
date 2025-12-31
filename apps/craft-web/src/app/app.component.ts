import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Subject, interval, take, takeUntil, timer } from 'rxjs';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserStateService } from './common/services/user-state.service';
import { User } from './common/services/user.interface';
import { UserActivityService } from './common/services/user-activity.service';
import { LoggerService } from './common/services/logger.service';
import { AdminStateService } from './common/services/admin-state.service';
import { FooterStateService } from './common/services/footer-state.service';
import { UserTrackingService } from './common/services/user-tracking.service';
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
  editorForm: FormGroup = new FormGroup({});

  userDisplayName = '🔒 Guest';
  isLoggedIn = false;

  // Reduce network polling
  private videoCheckInterval: number = 10000;
  // Use ReturnType<typeof setTimeout> for cross-platform timer type
  private inactivityTimeout: ReturnType<typeof setTimeout> | null = null;
  private videoCheckSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private userTrackingService: UserTrackingService,
    private adminStateService: AdminStateService,
    private userActivityService: UserActivityService,
    private logger: LoggerService,
    private authService: AuthService,
    private footerStateService: FooterStateService,
    private userStateService: UserStateService,
  ) {
    // Replace direct console logs with logger calls
    this.logger.info('App component initialized', { appVersion: '1.0.0' });
    console.log('debug-router: AppComponent instantiated');
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to inputs if any
    if (changes['user']) {
      // Replace any existing console.log with logger calls
      this.logger.debug('Application started', { timestamp: new Date().toISOString() });

      this.userTrackingService.getCurrentUser().subscribe(
        user => {
          if (user?.username) {
            this.isLoggedIn = true;
            this.userDisplayName = '🔒 ' + user.username;
          } else {
            this.isLoggedIn = false;
          }
        },
        error => {
          this.logger.error('Error fetching users:', error);
        },
      );
    }
  }

  ngOnInit(): void {
    console.log('debug-router: AppComponent ngOnInit');
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result: BreakpointState) => {
      this.isSmallScreen = !!result && !!result.matches;
      this.isCollapsed = this.isSmallScreen;
    });

    this.isSmallScreen = this.breakpointObserver.isMatched('(max-width: 599px)');

    this.logger.info('App component initialized');

    // Subscribe to footer state changes
    this.footerStateSubscription = this.footerStateService.expanded$.subscribe(expanded => {
      this.isFooterExpanded = expanded;
      console.log('Footer expanded state changed:', expanded);

      // Force redraw of child components after footer state changes
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });

    // Subscribe to admin state changes
    this.authService.isAdmin$.subscribe(isAdmin => {
      this.adminStateService.setAdminStatus(isAdmin);
    });

    // Console log for user interaction - debugging purposes
    // Log only every 10 seconds at most to reduce spam
    let lastInteractionLog = 0;
    document.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastInteractionLog > 10000) {
        console.log('User interaction detected');
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
    console.log('debug-router: AppComponent ngAfterViewInit');
    this.logger.info('App component view initialized');

    // Set a small timeout before handling video to prevent blocking the main thread
    setTimeout(() => {
      this.ensureVideoIsPlaying();
    }, 100);

    // Set a maximum timeout for API connections with proper error handling
    this.setupConnectionTimeouts();

    this.addUserInteractionListener();
    this.startVideoCheckPolling();
  }

  ngOnDestroy() {
    this.logger.info('App component destroyed');

    // Clean up all resources
    this.removeUserInteractionListener();
    this.stopVideoCheckPolling();
    this.cancelAllTimeouts();

    // Log user activity summary on exit (guard unknown shape)
    const activitySummaryRaw = this.userActivityService.getActivitySummary();
    const activitySummary = (activitySummaryRaw as any) || { pageViews: 0, clicks: 0, sessionDuration: 0 };
    this.logger.info(
      `Session summary: ${activitySummary.pageViews ?? 0} page views, ${activitySummary.clicks ?? 0} clicks, ${Math.round((activitySummary.sessionDuration ?? 0) / 1000)} seconds duration`,
    );

    if (this.footerStateSubscription) {
      this.footerStateSubscription.unsubscribe();
    }

    // Clear any pending timeouts
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    // Complete the destroy$ subject to clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    // Guard before assigning
    if (item && typeof item === 'object') {
      (item as any).active = true;
    }
  }

  // New helper method to handle connection timeouts
  private setupConnectionTimeouts(): void {
    // Set global timeout for XHR requests
    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // This will be called when component is destroyed
      // Any active XHR should be canceled here
    });
  }

  // New helper method to cancel all pending timeouts
  private cancelAllTimeouts(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    // Any other timeouts should be cleared here
    const pendingTimeouts = window.setTimeout(() => {}, 0);
    for (let i = 0; i < pendingTimeouts; i++) {
      window.clearTimeout(i);
    }
  }

  private ensureVideoIsPlaying() {
    const video = document.getElementById('background-video') as HTMLVideoElement;
    if (!video) {
      // If video element doesn't exist, stop polling and exit
      this.stopVideoCheckPolling();
      return;
    }

    video.playbackRate = 0.5; // Slow down the video

    if (video.paused || video.ended) {
      // Add a timeout to the play attempt to prevent blocking render
      setTimeout(() => {
        video
          .play()
          .then(() => {
            this.stopVideoCheckPolling();
            this.polling = false;
          })
          .catch(() => {
            // Silent catch - errors are expected on some browsers/devices
            // No need to log this error
          });
      }, 20);
    } else {
      // Video is already playing
      if (this.polling) {
        this.stopVideoCheckPolling();
        this.polling = false;
      }
    }
  }

  private addUserInteractionListener() {
    console.log('Adding user interaction listeners');
    document.addEventListener('click', this.handleUserInteraction);
    document.addEventListener('keydown', this.handleUserInteraction);
  }

  private removeUserInteractionListener() {
    console.log('Removing user interaction listeners');
    document.removeEventListener('click', this.handleUserInteraction);
    document.removeEventListener('keydown', this.handleUserInteraction);
  }

  private handleUserInteraction = () => {
    if (this.polling) {
      console.log('User interaction detected');
      this.ensureVideoIsPlaying();
    }
  };

  private startVideoCheckPolling(): void {
    // Clear any existing polling first
    this.stopVideoCheckPolling();

    // Only set up polling if we're not already polling
    if (!this.videoCheckSubscription) {
      this.videoCheckSubscription = timer(0, this.videoCheckInterval)
        .pipe(
          takeUntil(this.destroy$),
          // Add take(5) to ensure polling stops after 5 attempts if video still doesn't play
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

  private loadInitialData(): void {
    // Example of properly typed service call
    // If you have an actual service that needs to be used, uncomment and modify:
    /*
    this.apiService.getData().subscribe({
      next: (data: YourDataType) => {
        // Process data
        this.logger.info('Data loaded successfully', { count: data.length });
      },
      error: (error: Error) => {
        // Handle error properly
        this.logger.error('Failed to load data', { error: error.message });
      }
    });
    */

    // For now, just log a message to avoid the error
    this.logger.info('App component initialized');
  }

  onRouterActivate(event: unknown) {
    console.log('debug-router: router-outlet activated', event);
    const fallback = document.getElementById('debug-router-fallback');
    if (fallback) fallback.style.display = 'none';
  }

  onRouterDeactivate(event: unknown) {
    console.log('debug-router: router-outlet deactivated', event);
    setTimeout(() => {
      const fallback = document.getElementById('debug-router-fallback');
      if (fallback) fallback.style.display = 'block';
    }, 100);
  }
}
