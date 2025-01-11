import { Component, ViewChild, ElementRef, AfterViewInit, Renderer2, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-space-video',
  templateUrl: './space-video.component.html',
  styleUrls: ['./space-video.component.scss'],
  standalone: false
})
export class SpaceVideoComponent implements AfterViewInit, OnInit {
  @ViewChild('videoPlayer', { static: true }) videoPlayer!: ElementRef<HTMLVideoElement>;
  videoSrc!: string;
  audioSrc!: string;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.videoSrc = '../../../assets/video/haynes-astronauts.mp4';
    this.audioSrc = '../../../assets/video/haynes-astronauts.ogg';
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    this.renderer.listen(this.videoPlayer.nativeElement, 'canplay', () => {
      console.log('canplay event triggered');
      this.renderer.setProperty(this.videoPlayer.nativeElement, 'muted', false);
      this.renderer.setProperty(this.videoPlayer.nativeElement, 'autoplay', true);
      this.renderer.setProperty(this.videoPlayer.nativeElement, 'controls', true);
      this.videoPlayer.nativeElement.play().then(() => {
        console.log('Video is playing');
      }).catch((error) => {
        console.error('Error playing video:', error);
      });
    });
    this.renderer.setAttribute(this.videoPlayer.nativeElement, 'src', this.videoSrc);
    this.renderer.setProperty(this.videoPlayer.nativeElement, 'load', true);
  }

  playVideo() {
    console.log('playVideo called');
    this.renderer.setProperty(this.videoPlayer.nativeElement, 'muted', false);
    this.videoPlayer.nativeElement.play().then(() => {
      console.log('Video is playing');
    }).catch((error) => {
      console.error('Error playing video:', error);
    });
  }

  pauseVideo() {
    console.log('pauseVideo called');
    this.videoPlayer.nativeElement.pause();
  }

  stopVideo() {
    console.log('stopVideo called');
    this.videoPlayer.nativeElement.pause();
    this.renderer.setProperty(this.videoPlayer.nativeElement, 'currentTime', 0);
  }

  rewindVideo() {
    console.log('rewindVideo called');
    this.renderer.setProperty(this.videoPlayer.nativeElement, 'currentTime', this.videoPlayer.nativeElement.currentTime - 10);
  }

  fastForwardVideo() {
    console.log('fastForwardVideo called');
    this.renderer.setProperty(this.videoPlayer.nativeElement, 'currentTime', this.videoPlayer.nativeElement.currentTime + 10);
  }

  changeVolume(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('changeVolume called, volume:', input.value);
    this.renderer.setProperty(this.videoPlayer.nativeElement, 'volume', parseFloat(input.value));
  }

  seekVideo(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('seekVideo called, seek position:', input.value);
    this.renderer.setProperty(this.videoPlayer.nativeElement, 'currentTime', parseFloat(input.value) * this.videoPlayer.nativeElement.duration / 100);
  }
}
