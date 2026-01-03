import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './chat.component';
import { MarkdownPipe } from './markdown.pipe';
import { ChatService } from './chat.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

@Component({ selector: 'app-model-selector', template: '', standalone: false })
class ModelSelectorStubComponent {}

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  const chatServiceMock = {
    sendMessage: () => of(null),
    getResponseStream: () => of(''),
  };
  const matSnackBarMock = {
    open: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent, MarkdownPipe, ModelSelectorStubComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceMock },
        { provide: MatSnackBar, useValue: matSnackBarMock },
      ],
      imports: [MatIconModule, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
