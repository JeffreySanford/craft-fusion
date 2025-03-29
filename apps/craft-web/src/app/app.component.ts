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
    this.logger.registerService('AppComponent');
    this.logger.info('App component initialized', { 
      type: 'CORE_STYLING',
      appVersion: '1.0.0'
    });
  }

  ngOnInit(): void {
    this.logger.info('App component initialized');
    this.logger.debug('Initializing application layout structure', {
      type: 'CORE_STYLING'
    });

    this.authService.isAdmin$.subscribe(isAdmin => {
      console.log('Admin status in AppComponent:', isAdmin);
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

    this.logger.info('App component initialized');

    // Subscribe to footer state changes
    this.footerStateSubscription = this.footerStateService.expanded$
      .subscribe(expanded => {
        this.isFooterExpanded = expanded;
        this.logger.debug('Footer expanded state changed', {
          type: 'CORE_STYLING',
          expanded
        });
        
        // Apply the appropriate class to the body
        if (expanded) {
          document.body.classList.add('footer-expanded');
          this.logger.debug('Added footer-expanded class to body', {
            type: 'CORE_STYLING'
          });
        } else {
          document.body.classList.remove('footer-expanded');
          this.logger.debug('Removed footer-expanded class from body', {
            type: 'CORE_STYLING'
          });
        }
      });

    this.logger.debug('App setup complete');
  }

  ngAfterViewInit() {
    this.logger.debug('App component view initialized, setting up layout', {
      type: 'CORE_STYLING'
    });
    this.ensureVideoIsPlaying();
    this.addUserInteractionListener();
    this.startVideoCheckPolling();

    this.logger.info('App component view initialized');
  }

  ngOnDestroy() {
    this.logger.debug('App component destroying, cleaning up layout resources', {
      type: 'CORE_STYLING'
    });
    this.removeUserInteractionListener();
    this.stopVideoCheckPolling();

    this.logger.info('App component destroyed');
    
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
    this.logger.info('App component initialized');
  }
}
