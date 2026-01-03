import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { LoggerService } from '../../common/services/logger.service';
import { ComponentsModule } from '../../common/components/components.module';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  const loggerServiceMock = {
    info: jest.fn(),
  };

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
      imports: [MatCardModule, ComponentsModule],
      providers: [{ provide: LoggerService, useValue: loggerServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
