import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from '../../common/services/theme.service';
import { VideoBackgroundService } from '../../common/services/video-background.service';
import { LoggerService } from '../../common/services/logger.service';
import { AnimationService } from '../../common/services/animation.service';
import { LayoutService } from '../../common/services/layout.service';

interface Star {
  top: number;
  left: number;
  delay: number;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false
})
export class LandingComponent implements OnInit, OnDestroy {
  themeClass = 'light-theme';
  videoLoaded = false;
  videoError = false;
  showMockDataIndicator = true;
  stars: Star[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private themeService: ThemeService,
    private videoService: VideoBackgroundService,
    private logger: LoggerService,
    private animationService: AnimationService,
    private layoutService: LayoutService
  ) { }

  ngOnInit(): void {
    this.logger.info('Landing component initialized');
    
    // Generate stars for background
    this.generateStars();

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
    
    // Ensure sidebar is collapsed on mobile for better landing experience
    this.layoutService.isMobile().pipe(
      takeUntil(this.destroy$)
    ).subscribe(isMobile => {
      if (isMobile) {
        this.layoutService.collapseSidebar();
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  navigateToFeature(feature: string): void {
    this.router.navigate(['/projects', feature]);
  }
  
  private generateStars(): void {
    // Generate random stars for the background
    const starCount = 50;
    this.stars = Array.from({ length: starCount }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 3 // Random delay between 0-3s
    }));
  }
}
