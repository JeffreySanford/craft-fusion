import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, delay, retryWhen, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Service that handles WebSocket connection status and provides fallback
 * for when WebSockets are not available.
 */
@Injectable({
  providedIn: 'root'
})
export class SocketConnectionService {
  private backendAvailable$ = new BehaviorSubject<boolean>(true);
  private checkingConnection = false;
  
  constructor(
    private logger: LoggerService,
    private http: HttpClient
  ) {
    this.checkBackendConnection();
  }

  /**
   * Checks if the backend server is available
   */
  checkBackendConnection(): void {
    if (this.checkingConnection) {
      return;
    }
    
    this.checkingConnection = true;
    this.logger.info('Checking backend connection status');
    
    this.http.get('/api/health', { responseType: 'text' })
      .pipe(
        catchError(() => of('error')),
        retryWhen(errors => errors.pipe(
          tap(() => {
            this.logger.warn('Backend server not available, will retry');
            this.backendAvailable$.next(false);
          }),
          delay(5000) // 5 second delay between retries
        ))
      )
      .subscribe({
        next: response => {
          if (response !== 'error') {
            this.logger.info('Backend connection established');
            this.backendAvailable$.next(true);
          } else {
            this.logger.warn('Backend connection check failed');
            this.backendAvailable$.next(false);
            // Schedule another check
            timer(10000).subscribe(() => {
              this.checkingConnection = false;
              this.checkBackendConnection();
            });
          }
        },
        complete: () => {
          this.checkingConnection = false;
        }
      });
  }

  /**
   * Observable for backend availability status
   */
  get isBackendAvailable$(): Observable<boolean> {
    return this.backendAvailable$.asObservable();
  }

  /**
   * Forces a new connection check
   */
  retryConnection(): void {
    this.checkingConnection = false;
    this.checkBackendConnection();
  }
}
