import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { DeepSeekService } from '../../common/services/deepseek-local.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private responseSubject = new Subject<string>();

  constructor(private deepSeekService: DeepSeekService) {}

  sendMessage(message: string) {
    const apiUrl = 'http://127.0.0.1:11434/api/generate'; // Local Ollama API URL

    this.deepSeekService.sendMessage(message, apiUrl).subscribe(
      response => {
        this.responseSubject.next(response.response);
      },
      error => {
        console.error('Error from DeepSeekService:', error);
        this.responseSubject.next('Error: Unable to get response from DeepSeek.');
      }
    );
  }

  getResponseStream(): Observable<string> {
    return this.responseSubject.asObservable();
  }
}
