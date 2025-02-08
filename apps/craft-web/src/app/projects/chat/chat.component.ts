import { Component, OnInit, OnDestroy } from '@angular/core';
import { DeepSeekService } from '../../common/services/deepseek-local.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface Model {
  name: string;
  apiUrl: string;
  port: number;
  description: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: false,
})
export class ChatComponent implements OnInit, OnDestroy {
  userInput = '';
  messages: { text: string; sender: string }[] = [];
  private responseSubscription: Subscription = new Subscription();
  models: Model[] = [
    { name: 'DeepSeek', apiUrl: 'http://localhost:11434/api/generate', port: 11434, description: 'DeepSeek Model' },
    { name: 'Local Model 1', apiUrl: 'http://localhost:11435/api/generate', port: 11435, description: 'Local Model 1' },
    { name: 'Local Model 2', apiUrl: 'http://localhost:11436/api/generate', port: 11436, description: 'Local Model 2' }
  ];
  selectedModel = this.models[0];
  isThinking = false;
  thinkingDuration = 3000; // Default thinking duration in milliseconds
  actualThinkingDuration = 0; // Actual thinking duration

  constructor(private deepSeekService: DeepSeekService, private snackBar: MatSnackBar) {
    debugger
  }

  ngOnInit() {
    console.log('ChatComponent initialized');
    this.messages.push({ text: `${this.selectedModel.name}: Hello! How can I assist you today?`, sender: 'bot' });

    this.responseSubscription = this.deepSeekService.getResponseStream().pipe(
      switchMap(response => {
        const startTime = Date.now();
        return timer(this.thinkingDuration).pipe(
          switchMap(() => {
            this.isThinking = false;
            this.actualThinkingDuration = Date.now() - startTime;
            const cleanedResponse = response.response.replace(/<think>|<\/think>/g, '');
            return [cleanedResponse];
          })
        );
      })
    ).subscribe(
      cleanedResponse => {
        console.log('Response from DeepSeekService:', cleanedResponse);
        this.messages.push({ text: `${this.selectedModel.name}: ` + (cleanedResponse || 'No response'), sender: 'bot' });
      },
      error => {
        console.error('Error from DeepSeekService:', error);
        this.isThinking = false;
        this.snackBar.open('Error communicating with DeepSeekService', 'Close', { duration: 3000 });
      }
    );
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    console.log('User input:', this.userInput);
    this.messages.push({ text: 'You: ' + this.userInput, sender: 'user' });
    const input = this.userInput;
    this.userInput = '';
    this.isThinking = true;

    this.deepSeekService.sendMessage(input, this.selectedModel.apiUrl);
  }

  ngOnDestroy() {
    if (this.responseSubscription) {
      this.responseSubscription.unsubscribe();
    }
  }
}
