import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Client-side OpenAI service no longer contains an API key.
 * It proxies requests to the server endpoint which reads the key from the server-side .env.
 */
@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private readonly serverEndpoint = '/api/internal/ai/generate';

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<string> {
    const payload = { prompt, maxTokens: 150 };
    return this.http.post<{ result: string }>(this.serverEndpoint, payload).pipe(
      map(res => String(res?.result ?? '')),
      catchError((error: HttpErrorResponse) => {
        console.error('Error from AI proxy endpoint:', error);
        return throwError(() => error);
      })
    );
  }
}
