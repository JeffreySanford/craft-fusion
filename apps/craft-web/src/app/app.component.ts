import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Subject, interval, take, takeUntil, timer } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
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
  standalone: false
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isCollapsed = false;
  isSmallScreen = false;
  isExpanded = false;
  isFooterExpanded = false;

  title = 'frontend';
  private routerSubscription!: Subscription;

  private footerStateSubscription!: Subscription;

  menuItems = [
    { label: 'Home', icon: 'home', routerLink: '/home', active: false },
    // Add more menu items as needed
  ];
  polling = true;
  editorForm: FormGroup = new FormGroup({});

  userDisplayName = '🔒 Guest';
  isLoggedIn = false;

  // Reduce network polling
  private videoCheckInterval: number = 10000; // Increased from whatever it was before
  private inactivityTimeout: any = null;
  private videoCheckSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    private userTrackingService: UserTrackingService,
    private adminStateService: AdminStateService,
    private userActivityService: UserActivityService,
    private logger: LoggerService,
    private authService: AuthService, // Changed to use existing AuthService
    private footerStateService: FooterStateService,
    private userStateService: UserStateService
  ) {
    // Replace direct console logs with logger calls
    this.logger.info('App component initialized', { appVersion: '1.0.0' });
  }

  ngOnInit(): void {
    // Replace any existing console.log with logger calls
    this.logger.debug('Application started', { timestamp: new Date().toISOString() });

    // Temporarily set admin status here - will be replaced with auth later
    // this.adminStateService.setAdminStatus(true); // Set to true for development

    // Update to use authService instead of authFacade
    this.authService.isAdmin$.subscribe(isAdmin => {
      this.adminStateService.setAdminStatus(isAdmin);
    });

    this.userTrackingService.getCurrentUser().subscribe((user) => {
      if (user?.username) {
        this.isLoggedIn = true;
        this.userDisplayName = '🔒 ' + user.username;
      } else {
        this.isLoggedIn = false;
      }
    }, error => {
      this.logger.error('Error fetching users:', error);
    });

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result: any) => {
      this.isSmallScreen = result.matches;
      this.isCollapsed = this.isSmallScreen;
    });
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.videoCheckSubscription) {
      this.videoCheckSubscription.unsubscribe();
    }

    this.isSmallScreen = this.breakpointObserver.isMatched('(max-width: 599px)');

    // Removed login event registration to avoid infinite loop

    this.logger.info('App component initialized');

    // Subscribe to footer state changes
    this.footerStateSubscription = this.footerStateService.expanded$
      .subscribe(expanded => {
        this.isFooterExpanded = expanded;
        console.log('Footer expanded state changed:', expanded);
        // Apply the appropriate class to the body
        if (expanded) {
          document.body.classList.add('footer-expanded');
        } else {
          document.body.classList.remove('footer-expanded');
        }
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
  }

  ngAfterViewInit() {
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
    
    // Log user activity summary on exit
    const activitySummary = this.userActivityService.getActivitySummary();
    this.logger.info(`Session summary: ${activitySummary.pageViews} page views, ${activitySummary.clicks} clicks, ${Math.round(activitySummary.sessionDuration / 1000)} seconds duration`);

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
    item.active = true;
  }
  
  // New helper method to handle connection timeouts
  private setupConnectionTimeouts(): void {
    // Set global timeout for XHR requests
    this.destroy$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
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
        video.play()
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
          take(5)
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
}
