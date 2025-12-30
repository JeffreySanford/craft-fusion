import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions'; // Replace with actual OpenAI API URL
  private apiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<string> {
    const headers = { 'Authorization': `Bearer ${this.apiKey}` };
    const requestPayload = {
      prompt: prompt,
      max_tokens: 150
    };

    return this.http.post<unknown>(this.apiUrl, requestPayload, { headers }).pipe(
      map(response => response.choices[0].text.trim()), // Adjust based on actual API response structure
      catchError((error: HttpErrorResponse) => {
        console.error('Error from OpenAI API:', error);
        return throwError(error);
      })
    );
  }
}
