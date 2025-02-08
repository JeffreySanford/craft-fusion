import { Component, OnInit, OnDestroy, ViewChildren, QueryList, AfterViewInit, ElementRef } from '@angular/core';
import { ChatService } from './chat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: false
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('messageTextarea') messageTextareas!: QueryList<any>;
  @ViewChildren('responseText') responseTexts!: QueryList<ElementRef>;

  userInput = '';
  messages: { text: string; sender: string }[] = [];
  private responseSubscription: Subscription = new Subscription();
  isThinking = false;

  constructor(private chatService: ChatService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.messages.push({ text: 'Bot: Hello! How can I assist you today?', sender: 'bot' });

    this.responseSubscription = this.chatService.getResponseStream().subscribe(
      response => {
        this.isThinking = false;
        debugger
        this.messages.push({ text: 'Bot: ' + (response || 'No response'), sender: 'bot' });
      },
      error => {
        console.error('Error from ChatService:', error);
        this.isThinking = false;
        this.snackBar.open('Error communicating with ChatService', 'Close', { duration: 3000 });
      }
    );
  }

  ngAfterViewInit(): void {
    this.responseTexts.changes.subscribe(() => {
      this.adjustTextareaHeight();
    });
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    this.messages.push({ text: 'You: ' + this.userInput, sender: 'user' });
    const input = this.userInput;
    this.userInput = '';
    this.isThinking = true;

    this.chatService.sendMessage(input);
  }

  adjustTextareaHeight(): void {
    this.responseTexts.forEach((element: ElementRef) => {
      const textarea = element.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }
  
  ngOnDestroy() {
    if (this.responseSubscription) {
      this.responseSubscription.unsubscribe();
    }
  }
}
