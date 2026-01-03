import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { MarkdownPipe } from './markdown.pipe';
import { ChatService } from './chat.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  const chatServiceMock = {
    sendMessage: () => of(null),
    getResponseStream: () => of(''),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent, MarkdownPipe],
      providers: [{ provide: ChatService, useValue: chatServiceMock }],
      imports: [MatSnackBarModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
