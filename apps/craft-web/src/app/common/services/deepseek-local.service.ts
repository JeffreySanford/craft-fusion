import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DeepSeekService {
  constructor(private http: HttpClient) {
    console.log('DeepSeekService initialized');
  }

  sendMessage(prompt: string, apiUrl: string): Observable<any> {
    console.log('Sending message to API:', apiUrl);
    const requestPayload = {
      model: "deepseek-r1:1.5b",
      prompt: prompt
    };
    console.log('Request payload:', requestPayload);

    return this.http.post<any>(apiUrl, requestPayload, { responseType: 'text' as 'json' }).pipe(
      map(response => {
        console.log('Received raw response from API:', response);
        const jsonObjects = response.split('\n').filter((line: string) => line.trim() !== '');
        const combinedResponse = jsonObjects.map((json: string) => JSON.parse(json).response).join(' ');
        console.log('Combined response from API:', combinedResponse);
        return { response: combinedResponse };
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
    );
  }
}
