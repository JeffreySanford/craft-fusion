import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DeepSeekService {
  private responseSubject = new Subject<any>();

  constructor(private http: HttpClient) {
    console.log('DeepSeekService initialized');
  }

  sendMessage(prompt: string, apiUrl: string): void {
    console.log('Sending message to API:', apiUrl);
    const requestPayload = {
      model: "deepseek-r1:1.5b",
      prompt: prompt
    };
    console.log('Request payload:', requestPayload);

    this.http.post<any>(apiUrl, requestPayload, { responseType: 'text' as 'json' }).pipe(
      tap(response => {
        console.log('Received raw response from API:', response);
        try {
          const jsonObjects = response.split('\n').filter((line: string) => line.trim() !== '');
          const combinedResponse = jsonObjects.map((json: string) => JSON.parse(json).response).join(' ');
          console.log('Combined response from API:', combinedResponse);
          this.responseSubject.next({ response: combinedResponse });
        } catch (e) {
          console.error('Error parsing response:', e);
          throw new HttpErrorResponse({
            error: 'Error parsing response',
            status: 200,
            statusText: 'OK',
            url: apiUrl
          });
        }
      }),
      catchError(error => {
        console.error('Error from API:', error);
        if (error instanceof HttpErrorResponse) {
          console.error('HTTP Error Response:', error.message);
        } else {
          console.error('Unknown Error:', error);
        }
        return throwError(error);
      })
    ).subscribe();
  }

  getResponseStream(): Observable<any> {
    return this.responseSubject.asObservable();
  }
}
