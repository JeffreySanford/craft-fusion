import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FormBuilder, FormGroup } from '@angular/forms';
import { User, UserStateService } from './common/services/user-state.service';
import { UserActivityService } from './common/services/user-activity.service';
import { LoggerService } from './common/services/logger.service';
import { AdminStateService } from './common/services/admin-state.service';
import { AuthenticationService } from './common/services/authentication.service';
import { FooterStateService } from './common/services/footer-state.service';
import { UserTrackingService } from './common/services/user-tracking.service';

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
  private videoCheckSubscription!: Subscription;
  private footerStateSubscription!: Subscription;

  menuItems = [
    { label: 'Home', icon: 'home', routerLink: '/home', active: false },
    // Add more menu items as needed
  ];
  polling = true;
  editorForm: FormGroup = new FormGroup({});

  userDisplayName = '🔒 Guest';
  isLoggedIn = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    private userTrackingService: UserTrackingService,
    private adminStateService: AdminStateService,
    private userActivityService: UserActivityService,
    private logger: LoggerService,
    private authService: AuthenticationService, // Inject AuthenticationService
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
  }

  ngAfterViewInit() {
    console.log('Step 2: ngAfterViewInit called');
    this.ensureVideoIsPlaying();
    this.addUserInteractionListener();
    this.startVideoCheckPolling();

    this.logger.info('App component view initialized');
  }

  ngOnDestroy() {
    console.log('Step 4: ngOnDestroy called');
    this.removeUserInteractionListener();
    this.stopVideoCheckPolling();

    this.logger.info('App component destroyed');
    
    // Log user activity summary on exit
    const activitySummary = this.userActivityService.getActivitySummary();
    this.logger.info(`Session summary: ${activitySummary.pageViews} page views, ${activitySummary.clicks} clicks, ${Math.round(activitySummary.sessionDuration / 1000)} seconds duration`);

    if (this.footerStateSubscription) {
      this.footerStateSubscription.unsubscribe();
    }
  }

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    item.active = true;
  }

  private ensureVideoIsPlaying() {
    const video = document.getElementById('background-video') as HTMLVideoElement;
    if (video) {
      video.playbackRate = 0.5; // Slow down the video
      if (video.paused || video.ended) {
        video
          .play()
          .then(() => {
            this.stopVideoCheckPolling();
            this.polling = false;
          })
          .catch(error => {
            // console.error('Error attempting to play the video:', error);
          });
      } else {
        if (this.polling) {
          console.log('Video is already playing, stopping polling');
          this.stopVideoCheckPolling();
        }
      }
    } else {
      console.error('Video element not found');
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

  private startVideoCheckPolling() {
    const videoCheckInterval = interval(5000); // Emit every 5 seconds
    this.videoCheckSubscription = videoCheckInterval.subscribe(() => {
      this.ensureVideoIsPlaying();
    });
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
      },Glimm
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
