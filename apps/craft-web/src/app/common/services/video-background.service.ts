import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { ThemeService } from './theme.service';
import { environment } from '../../../environments/environment';

/**
 * Video source configuration
 */
export interface VideoSource {
  src: string;
  type: string;
  theme?: string;
}

/**
 * Video state
 */
export interface VideoState {
  currentVideo: VideoSource | null;
  isLoading: boolean;
  error: string | null;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  isPaused: boolean;
}

const DEFAULT_VIDEO_VOLUME = 0.1;

@Injectable({
  providedIn: 'root'
})
export class VideoBackgroundService {
  // Default video sources for different themes
  private defaultVideos: { [key: string]: VideoSource } = {
    light: {
      src: 'assets/video/haynes-astronauts.mp4',
      type: 'video/mp4',
      theme: 'light'
    },
    dark: {
      src: 'assets/video/haynes-astronauts.mp4',
      type: 'video/mp4',
      theme: 'dark'
    },
    vibrant1: {
      src: 'assets/video/haynes-astronauts.mp4',
      type: 'video/mp4',
      theme: 'vibrant1'
    },
    vibrant2: {
      src: 'assets/video/haynes-astronauts.mp4',
      type: 'video/mp4',
      theme: 'vibrant2'
    }
  };

  // State management
  private videoStateSubject = new BehaviorSubject<VideoState>({
    currentVideo: null,
    isLoading: false,
    error: null,
    volume: DEFAULT_VIDEO_VOLUME,
    isMuted: true,
    isPlaying: false,
    isPaused: true
  });

  // Expose observable for components to subscribe to
  public videoState$: Observable<VideoState> = this.videoStateSubject.asObservable();

  // Stream of video sources
  private videoSourceSubject = new BehaviorSubject<VideoSource | null>(null);
  public videoSource$ = this.videoSourceSubject.asObservable();

  private destroy$ = new Subject<void>();
  private allowVideoBackground: boolean = true;

  constructor(
    private logger: LoggerService,
    private themeService: ThemeService
  ) {
    this.logger.registerService('VideoBackgroundService');
    
    // Initialize video based on current theme
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        if (this.allowVideoBackground) {
          this.setVideoByTheme(theme);
        }
      });

    // Check for performance preferences in environment config
    if (environment.performance?.disableVideoBackgrounds) {
      this.allowVideoBackground = false;
      this.logger.info('Video backgrounds disabled due to performance settings');
    }
  }

  /**
   * Initialization logic
   */
  initialize() {
    this.logger.info('Initializing video background service');
    // Check if we need to set up a default video
    if (this.allowVideoBackground && !this.videoStateSubject.value.currentVideo) {
      this.setVideoByTheme(this.themeService.getCurrentTheme());
    }
  }

  /**
   * Cleanup logic
   */
  destroy() {
    this.logger.info('Destroying video background service');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Set video source manually
   * @param videoSource The video source object
   */
  setVideo(videoSource: VideoSource): void {
    if (!this.allowVideoBackground) {
      this.logger.warn('Video backgrounds are disabled in settings');
      return;
    }

    this.logger.info(`Setting video background: ${videoSource.src}`, { 
      category: 'UI', 
      source: 'VideoBackgroundService'
    });

    // Update loading state
    this.updateState({ 
      currentVideo: videoSource, 
      isLoading: true,
      error: null,
      isPlaying: false,
      isPaused: true
    });

    this.videoSourceSubject.next(videoSource);
  }

  /**
   * Set video based on current theme
   * @param theme Current theme name
   */
  setVideoByTheme(theme: string): void {
    // Default to light theme if no specific theme video exists
    const videoSource = this.defaultVideos[theme] || this.defaultVideos['light'];
    
    if (videoSource) {
      this.setVideo(videoSource);
    }
  }

  /**
   * Handle video load start
   */
  videoLoadStarted(): void {
    this.updateState({ isLoading: true });
    
    this.logger.info('Video background loading started', {
      category: 'UI',
      source: 'VideoBackgroundService'
    });
  }

  /**
   * Handle video load complete
   */
  videoLoadCompleted(): void {
    this.updateState({ 
      isLoading: false, 
      isPlaying: true,
      isPaused: false
    });
    
    this.logger.info('Video background loaded successfully', {
      category: 'UI',
      source: 'VideoBackgroundService'
    });
  }

  /**
   * Handle video load error
   */
  videoLoadError(error: any): void {
    const errorMessage = typeof error === 'string' ? error : 'Failed to load video background';
    
    this.updateState({ 
      isLoading: false, 
      error: errorMessage, 
      isPlaying: false,
      isPaused: true
    });
    
    this.logger.error('Video background load error', {
      error,
      category: 'UI',
      source: 'VideoBackgroundService'
    });
  }

  /**
   * Toggle video playback
   * @returns New playing state
   */
  togglePlayback(): boolean {
    const currentState = this.videoStateSubject.value;
    const newPlayingState = !currentState.isPlaying;
    
    this.updateState({ 
      isPlaying: newPlayingState,
      isPaused: !newPlayingState
    });
    
    this.logger.info(`Video background playback ${newPlayingState ? 'started' : 'paused'}`, {
      category: 'UI',
      source: 'VideoBackgroundService'
    });
    
    return newPlayingState;
  }

  /**
   * Set video volume
   * @param volume Volume level (0-1)
   */
  setVolume(volume: number): void {
    // Ensure volume is between 0 and 1
    const safeVolume = Math.min(Math.max(volume, 0), 1);
    
    this.updateState({ 
      volume: safeVolume,
      isMuted: safeVolume === 0
    });
    
    this.logger.debug(`Video background volume set to ${safeVolume}`, {
      category: 'UI',
      source: 'VideoBackgroundService'
    });
  }

  /**
   * Toggle muted state
   * @returns New muted state
   */
  toggleMute(): boolean {
    const currentState = this.videoStateSubject.value;
    const newMutedState = !currentState.isMuted;
    
    this.updateState({ 
      isMuted: newMutedState,
      // If unmuting, restore previous volume or use default
      volume: newMutedState ? 0 : (currentState.volume > 0 ? currentState.volume : DEFAULT_VIDEO_VOLUME)
    });
    
    this.logger.info(`Video background ${newMutedState ? 'muted' : 'unmuted'}`, {
      category: 'UI',
      source: 'VideoBackgroundService'
    });
    
    return newMutedState;
  }

  /**
   * Enable/disable video backgrounds
   * @param enabled Whether video backgrounds should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.allowVideoBackground = enabled;
    
    if (enabled) {
      // When enabling, set video based on current theme
      this.setVideoByTheme(this.themeService.getCurrentTheme());
    } else {
      // When disabling, clear current video
      this.updateState({ 
        currentVideo: null,
        isPlaying: false,
        isPaused: true
      });
      this.videoSourceSubject.next(null);
    }
    
    this.logger.info(`Video backgrounds ${enabled ? 'enabled' : 'disabled'}`, {
      category: 'UI',
      source: 'VideoBackgroundService'
    });
  }

  /**
   * Get list of available background videos
   * @returns Observable of available videos
   */
  getAvailableVideos(): Observable<VideoSource[]> {
    return of(Object.values(this.defaultVideos));
  }

  /**
   * Clean up resources
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update partial state
   */
  private updateState(partialState: Partial<VideoState>): void {
    const currentState = this.videoStateSubject.value;
    this.videoStateSubject.next({
      ...currentState,
      ...partialState
    });
  }
}
