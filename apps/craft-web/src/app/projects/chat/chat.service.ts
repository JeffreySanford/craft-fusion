import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { DeepSeekService } from '../../common/services/deepseek-local.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private responseSubject = new Subject<string>();

  constructor(
    private deepSeekService: DeepSeekService, 
    private settingsService: SettingsService
  ) {}

  sendMessage(message: string): void {
    const selectedModel = this.settingsService.getSelectedModel();
    this.deepSeekService.sendMessage(message, selectedModel.apiUrl).pipe(
      map(response => this.cleanUpResponse(response.response)),
      tap(cleanedResponse => this.responseSubject.next(cleanedResponse)),
      catchError(error => {
        console.error('Error from DeepSeekService:', error);
        this.responseSubject.next('Error: Unable to get response from DeepSeek.');
        throw error;
      })
    ).subscribe();
  }

  getResponseStream(): Observable<string> {
    return this.responseSubject.asObservable();
  }

  private cleanUpResponse(response: string): string {
    return response
      .replace(/\\n/g, '\n')  // Fix escaped newlines
      .replace(/&lt;/g, '<')  // Fix escaped HTML
      .replace(/&gt;/g, '>')
      .trim();
  }
}
