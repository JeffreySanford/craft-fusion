import { Component, OnInit, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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

  constructor(private breakpointObserver: BreakpointObserver, private renderer: Renderer2) {}

  ngOnInit(): void {
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
  }

  ngAfterViewInit() {
    console.log('Step 2: ngAfterViewInit called');
    const video = this.renderer.selectRootElement('#background-video') as HTMLVideoElement;
    this.ensureVideoIsPlaying(video);
    this.addUserInteractionListener();
    this.startVideoCheckPolling();
  }

  ngOnDestroy() {
    console.log('Step 4: ngOnDestroy called');
    this.removeUserInteractionListener();
    this.stopVideoCheckPolling();
    document.removeEventListener('click', this.handleUserInteraction);
    document.removeEventListener('keydown', this.handleUserInteraction);
  }

  setActive(item: any) {
    this.menuItems.forEach(menuItem => (menuItem.active = false));
    item.active = true;
  }

  private ensureVideoIsPlaying(video: HTMLVideoElement) {
    if (video) {
      video.playbackRate = 0.5; // Slow down the video
      if (video.paused || video.ended) {
        video
          .play()
          .then(() => {
            this.stopVideoCheckPolling();
            this.polling = false;
          })
          .catch(() => {
            // Handle error
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

  private clickListener: () => void = () => {};
  private keydownListener: () => void = () => {};

  private addUserInteractionListener() {
    console.log('Adding user interaction listeners');
    this.clickListener = this.renderer.listen('document', 'click', this.handleUserInteraction);
    this.keydownListener = this.renderer.listen('document', 'keydown', this.handleUserInteraction);
  }

  private removeUserInteractionListener() {
    console.log('Removing user interaction listeners');
    if (this.clickListener) {
      this.clickListener();
    }
    if (this.keydownListener) {
      this.keydownListener();
    }
  }

  private handleUserInteraction = () => {
    if (this.polling) {
      console.log('User interaction detected');
      this.ensureVideoIsPlaying(
        this.renderer.selectRootElement('#background-video').nativeElement.querySelector('video').nativeElement as HTMLVideoElement);
    }
  };

  private startVideoCheckPolling() {
    const videoCheckInterval = interval(5000); // Emit every 5 seconds
    this.videoCheckSubscription = videoCheckInterval.subscribe(() => {
      this.ensureVideoIsPlaying(
        this.renderer.selectRootElement('#background-video')
      );
    });
  }

  private stopVideoCheckPolling() {
    if (this.videoCheckSubscription) {
      this.videoCheckSubscription.unsubscribe();
    }
  }
}
