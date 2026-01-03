import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(() => {

    const mockSpeechRecognition = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      onresult: jest.fn(),
      lang: '',
    }));
    Object.defineProperty(window, 'SpeechRecognition', {
      writable: true,
      value: mockSpeechRecognition,
    });

    TestBed.configureTestingModule({
      declarations: [LandingComponent],
      imports: [],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
