import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceVideoComponent } from './space-video.component';

describe('SpaceVideoComponent', () => {
  let component: SpaceVideoComponent;
  let fixture: ComponentFixture<SpaceVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpaceVideoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set video source correctly', () => {
    const videoElement: HTMLVideoElement = fixture.nativeElement.querySelector('video');
    component.videoSrc = '.media/videos/subfolder/video.mp4';
    fixture.detectChanges();
    expect(videoElement.src).toContain('.media/videos/subfolder/video.mp4');
  });
});
