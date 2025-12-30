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
  private responseSubscription: Subscription = new Subscription();
  isThinking = false;
  thinkingStartTime: number | null = null;
  resolved = false;
  fontSize: number = 1; 
  messages: { text: string; sender: string; timestamp?: Date; portfolioItem?: { image: string; title: string; description: string; tags: string[]; } }[] = [];
  
  constructor(private chatService: ChatService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    const welcomeMessage = `# Welcome to CraftFusion Chat

## Introduction
This interactive chat system supports rich text formatting and various content types. Let's explore some key features that make communication more effective and engaging.

## Content Formatting
You can use **bold text** for emphasis and *italic text* for subtle highlights. Creating structured content is easy with different heading levels and formatted lists.

## Data Presentation
Here's an example of how we can display structured data:

| Feature | Description | Status |
|---------|-------------|---------|
| Markdown | Full markdown support | ✅ |
| Tables | Formatted data tables | ✅ |
| Lists | Numbered and bullet lists | ✅ |
| Images | Image embedding | ✅ |

## List Examples
Numbered list of key features:
1. Rich text formatting
2. Data tables
3. Multiple list types
4. Image support
5. Code formatting

Key benefits:
* Enhanced readability
* Better organization
* Visual hierarchy
* Structured content
* Interactive elements

## Visual Elements
Here's an example image:
![Sample](https://via.placeholder.com/300x200)

\`\`\`typescript
// Even code blocks are supported
function greet(name: string) {
    return \`Hello, \${name}!\`;
}
\`\`\``;

    this.messages.push({ 
        text: welcomeMessage, 
        sender: 'bot',
        timestamp: new Date()
    });

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
    if(!this.isThinking && !this.resolved) {
      this.adjustAllTextareas();
      this.scrollToBottom();
      this.resolved = true;
    }
  }

  adjustAllTextareas() {
    this.messageTextareas.forEach((textarea: any) => {
      const el = textarea && textarea.nativeElement as HTMLTextAreaElement | undefined;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    });
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    let messageText = this.userInput;
    if (this.userInput.toLowerCase().includes('cite')) {
      // Example citation data (replace with actual data from the AI)
      const author = 'Smith, J.';
      const year = 2023;
      const title = 'The Impact of AI on Society';
      const source = 'www.example.com/ai-impact';
      messageText = this.formatCitation(author, year, title, source);
    }

    this.messages.push({ text: messageText, sender: 'user' });
    const input = this.userInput;
    this.userInput = '';
    this.isThinking = true;
    this.thinkingStartTime = Date.now(); // Record the start time

    this.chatService.sendMessage(input);
    this.resolved = false;
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

  copyMessage(msg: any) {
    navigator.clipboard.writeText(msg.text).then(() => {
      this.snackBar.open('Message copied to clipboard', 'Close', { duration: 2000 });
    });
  }

  editMessage(msg: any) {
    // Implement edit functionality here
    this.snackBar.open('Edit functionality is not implemented yet', 'Close', { duration: 2000 });
  }

  deleteMessage(index: number) {
    this.messages.splice(index, 1);
    this.snackBar.open('Message deleted', 'Close', { duration: 2000 });
  }

  increaseFontSize() {
    this.fontSize += 0.1;
    document.documentElement.style.setProperty('--message-font-size', `${this.fontSize}em`);
  }

  decreaseFontSize() {
    this.fontSize -= 0.1;
    document.documentElement.style.setProperty('--message-font-size', `${this.fontSize}em`);
  }

  isInteresting(paragraph: string): boolean {
    const lowerCaseParagraph = paragraph.toLowerCase();
    if (lowerCaseParagraph.includes('conclusion')) {
      return false;
    }

    const keywords = ['gold', 'lapis lazuli', 'cornelian', 'wood', 'copper', 'stones', 'trade', 'ships', 'sea', 'land', 'meluha', 'magan', 'marhaci', 'elam', 'urim'];
    const hasKeyword = keywords.some(keyword => lowerCaseParagraph.includes(keyword));

    return hasKeyword;
  }

  formatCitation(author: string, year: number, title: string, source: string): string {
    return `${author} (${year}). *${title}*. Retrieved from ${source}`;
  }

  ngOnDestroy() {
    if (this.responseSubscription) {
      this.responseSubscription.unsubscribe();
    }
  }
}
