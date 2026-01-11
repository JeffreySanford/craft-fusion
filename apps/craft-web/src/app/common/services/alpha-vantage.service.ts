import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private apiKey = environment.alphaVantageApiKey;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor(private http: HttpClient) {}

  getStockData(symbol: string): Observable<unknown> {
    const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;
    return this.http.get(url).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  getForexData(symbol: string): Observable<unknown> {
    const url = `${this.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${this.apiKey}`;
    return this.http.get(url).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Server-side error: ${error.status} ${error.message}`;
      if (error.error) {
        errorMessage += ` - ${JSON.stringify(error.error)}`;
      }
    }
    console.error(`Error occurred: ${errorMessage}`);
    return throwError(() => new Error(errorMessage));
  }
}
