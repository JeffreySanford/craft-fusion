import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../common/services/theme.service';
import { VideoBackgroundService } from '../../common/services/video-background.service';
import { LoggerService } from '../../common/services/logger.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false,
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      state('void', style({ opacity: 0, transform: 'translateX(-30px)' })),
      transition(':enter', [
        animate('0.8s 0.3s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class LandingComponent implements OnInit, OnDestroy {
  items = ['Architect', 'Developer', 'Designer'];
  themeClass = 'light-theme';
  videoLoaded = false;
  videoError = false;
  showMockDataIndicator = true;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private themeService: ThemeService,
    private videoService: VideoBackgroundService,
    private logger: LoggerService
  ) { }

  ngOnInit(): void {
    this.logger.info('Landing component initialized');
    this.logger.debug('Landing setup complete');

    // Subscribe to theme changes
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.themeClass = theme;
        this.logger.debug('Landing using theme', { theme });
      });
      
    // Set patriotic background video
    this.videoService.setVideo({
      src: 'assets/videos/flag-background.mp4',
      type: 'video/mp4'
    });
    
    // Listen for video events using the observables provided by the service
    this.videoService.videoLoadCompleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.videoLoaded = true;
        this.logger.debug('Background video loaded');
      });
      
    this.videoService.videoLoadError$
      .pipe(takeUntil(this.destroy$))
      .subscribe((errorMessage: string) => {
        this.videoError = true;
        this.logger.error('Background video error', { error: errorMessage });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  
  onThemeChanged(theme: string): void {
    this.logger.info('Theme changed from landing page', { theme });
  }
}
