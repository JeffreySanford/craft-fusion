import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import alpha from 'alphavantage';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private apiKey = environment.alphaVantageApiKey;
  private alphaVantageClient;

  constructor(private http: HttpClient) {
    this.alphaVantageClient = alpha({ key: this.apiKey });
  }

  getStockData(symbol: string): Observable<any> {
    return new Observable(observer => {
      this.alphaVantageClient.data.daily(symbol)
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    }).pipe(
      catchError(this.handleError)
    );
  }

  getForexData(symbol: string): Observable<any> {
    return new Observable(observer => {
      this.alphaVantageClient.forex.rate(symbol, 'USD')
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    }).pipe(
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
