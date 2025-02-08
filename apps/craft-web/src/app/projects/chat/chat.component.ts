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
  private startTime: number = 0;

  constructor(private chatService: ChatService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.messages.push({ text: 'Hello! How can I assist you today?', sender: 'bot' });

    this.responseSubscription = this.chatService.getResponseStream().subscribe(
      response => {
        this.isThinking = false;
        const endTime = Date.now();
        const thinkingTime = ((endTime - this.startTime) / 1000).toFixed(2);
        const parsedResponse = this.parseThinkingTag(response, thinkingTime);
        this.messages.push({ text: (parsedResponse || 'No response'), sender: 'bot' });
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

    this.messages.push({ text: this.userInput, sender: 'user' });
    const input = this.userInput;
    this.userInput = '';
    this.isThinking = true;
    this.startTime = Date.now();

    this.chatService.sendMessage(input);
  }

  adjustTextareaHeight(): void {
    this.responseTexts.forEach((element: ElementRef) => {
      const textarea = element.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }

  parseThinkingTag(response: string, thinkingTime: string): string {
    return response.replace('<think></think>', ` (AI thought for ${thinkingTime} seconds)`).replace(/<\/?think>/g, '');
  }

  ngOnDestroy() {
    if (this.responseSubscription) {
      this.responseSubscription.unsubscribe();
    }
  }
}
