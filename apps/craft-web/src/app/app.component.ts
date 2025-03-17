import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserStateService } from './common/services/user-state.service';
import { UserActivityService } from './common/services/user-activity.service';
import { LoggerService } from './common/services/logger.service';
import { AdminStateService } from './common/services/admin-state.service';
import { AuthenticationService } from './common/services/authentication.service';

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

  title = 'frontend';
  private routerSubscription!: Subscription;
  private videoCheckSubscription!: Subscription;

  menuItems = [
    { label: 'Home', icon: 'home', routerLink: '/home', active: false },
    // Add more menu items as needed
  ];
  polling = true;
  editorForm: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    private userStateService: UserStateService,
    private adminStateService: AdminStateService,
    private userActivityService: UserActivityService,
    private logger: LoggerService,
    private authService: AuthenticationService // Inject AuthenticationService
  ) {}

  ngOnInit(): void {
    // Temporarily set admin status here - will be replaced with auth later
    // this.adminStateService.setAdminStatus(true); // Set to true for development

    this.authService.isAdmin$.subscribe(isAdmin => {
      this.adminStateService.setAdminStatus(isAdmin);
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
}
