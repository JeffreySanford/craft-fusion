import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VideoBackgroundService, VideoSource } from '../../services/video-background.service';
import { LoggerService } from '../../services/logger.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-video-background',
  templateUrl: './video-background.component.html',
  styleUrls: ['./video-background.component.scss'],
  standalone: false
})
export class VideoBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  
  @Input() set videoSrc(value: string) {
    if (value) {
      this.videoBackgroundService.setVideo({
        src: value,
        type: this.getVideoMimeType(value)
      });
    }
  }
  
  currentVideo: VideoSource | null = null;
  isLoading = false;
  hasError = false;
  errorMessage = '';
  themeClass = '';
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private videoBackgroundService: VideoBackgroundService,
    private logger: LoggerService,
    private renderer: Renderer2,
    private themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to video source changes
    this.videoBackgroundService.videoSource$
      .pipe(takeUntil(this.destroy$))
      .subscribe(video => {
        this.currentVideo = video;
        if (video) {
          this.loadVideo(video);
        }
      });
      
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadVideo(video: VideoSource): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Need to wait for the view to initialize
    setTimeout(() => {
      if (this.videoElement && this.videoElement.nativeElement) {
        const videoEl = this.videoElement.nativeElement;
        
        // Set up event listeners
        this.renderer.listen(videoEl, 'loadstart', () => {
          this.videoBackgroundService.videoLoadStarted();
        });
        
        this.renderer.listen(videoEl, 'canplaythrough', () => {
          this.videoBackgroundService.videoLoadCompleted();
          this.isLoading = false;
          
          // Start playing
          videoEl.play().catch(error => {
            // Handle autoplay restrictions
            this.logger.warn('Autoplay restricted by browser', { error });
          });
        });
        
        this.renderer.listen(videoEl, 'error', (event) => {
          this.handleVideoError('Failed to load video');
        });
        
        // Set muted and volume
        videoEl.muted = true;
        videoEl.volume = 0.1;
        
        // Set video source
        videoEl.src = video.src;
        videoEl.load();
      } else {
        this.handleVideoError('Video element not found');
      }
    });
  }
  
  private handleVideoError(message: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = message;
    this.videoBackgroundService.videoLoadError(message);
    this.logger.error('Video background error', { message });
  }
  
  private getVideoMimeType(src: string): string {
    const extension = src.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'mp4': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'ogg': return 'video/ogg';
      default: return 'video/mp4';
    }
  }
}
