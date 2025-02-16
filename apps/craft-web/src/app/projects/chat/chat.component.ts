import { Component, OnInit, OnDestroy, ViewChildren, QueryList, AfterViewChecked } from '@angular/core';
import { ChatService } from './chat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: false
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChildren('messageTextarea') messageTextareas!: QueryList<any>;

  userInput = '';
  messages: { text: string; sender: string }[] = [];
  private responseSubscription: Subscription = new Subscription();
  isThinking = false;
  thinkingStartTime: number | null = null;

  constructor(private chatService: ChatService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.messages.push({ text: 'Hello! How can I assist you today?', sender: 'bot' });

    this.responseSubscription = this.chatService.getResponseStream().subscribe(
      response => {
        this.isThinking = false;
        const thinkingDuration = this.thinkingStartTime ? (Date.now() - this.thinkingStartTime) / 1000 : 0;
        this.snackBar.open(`Response received in ${thinkingDuration.toFixed(2)} seconds`, 'Close', { duration: 3000 });
   
        const cleanedResponse = response.replace(/<\/?think>/g, ''); // Remove <think> and </think> tags
        this.messages.push({ text: (cleanedResponse || 'No response'), sender: 'bot' });
      },
      error => {
        console.error('Error from ChatService:', error);
        this.isThinking = false;
        this.snackBar.open('Error communicating with ChatService', 'Close', { duration: 3000 });
      }
    );
  }

  ngAfterViewChecked() {
    if(!this.isThinking) {
      this.adjustAllTextareas();
      this.scrollToBottom();  
    }
  }

  adjustAllTextareas() {
    this.messageTextareas.forEach(textarea => this.adjustTextareaHeight({
      target: textarea.nativeElement,
      bubbles: false,
      cancelBubble: false,
      cancelable: false,
      composed: false,
      currentTarget: null,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      returnValue: false,
      srcElement: null,
      timeStamp: 0,
      type: '',
      composedPath: function (): EventTarget[] {
        throw new Error('Function not implemented.');
      },
      initEvent: function (type: string, bubbles?: boolean, cancelable?: boolean): void {
        throw new Error('Function not implemented.');
      },
      preventDefault: function (): void {
        throw new Error('Function not implemented.');
      },
      stopImmediatePropagation: function (): void {
        throw new Error('Function not implemented.');
      },
      stopPropagation: function (): void {
        throw new Error('Function not implemented.');
      },
      NONE: 0,
      CAPTURING_PHASE: 1,
      AT_TARGET: 2,
      BUBBLING_PHASE: 3
    }));
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    this.messages.push({ text: this.userInput, sender: 'user' });
    const input = this.userInput;
    this.userInput = '';
    this.isThinking = true;
    this.thinkingStartTime = Date.now(); // Record the start time

    this.chatService.sendMessage(input);
  }

  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Adjust to content
  }
  
  scrollToBottom(): void {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  ngOnDestroy() {
    if (this.responseSubscription) {
      this.responseSubscription.unsubscribe();
    }
  }
}
