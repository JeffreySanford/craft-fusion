import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UiStateFacade } from './common/facades/ui-state.facade';
import { VideoBackgroundService } from './common/services/video-background.service';
import { LoggerService } from './common/services/logger.service';
import { ThemeService } from './common/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  // Simple UI state properties
  isFooterExpanded = false;
  isMobile = false;
  isDarkTheme = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private logger: LoggerService,
    private uiStateFacade: UiStateFacade,
    private videoBackgroundService: VideoBackgroundService,
    private themeService: ThemeService
  ) {
    this.logger.registerService('AppComponent');
    this.logger.info('App component initialized');
  }

  ngOnInit(): void {
    // Initialize video background
    this.videoBackgroundService.initialize();
    
    // Subscribe to UI state changes
    this.uiStateFacade.getUiState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isFooterExpanded = state.isFooterExpanded;
        this.isMobile = state.isMobile;
        this.isDarkTheme = state.isDarkTheme;
      });
    
    // Set up video background based on theme
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        // The service will handle setting the appropriate video
      });
    
    this.logger.debug('App component setup complete');
  }

  ngOnDestroy(): void {
    this.logger.debug('App component destroying');
    
    // Clean up video background
    this.videoBackgroundService.destroy();
    
    // Signal all subscribers to complete
    this.destroy$.next();
    this.destroy$.complete();
    
    this.logger.info('App component destroyed');
  }
}
