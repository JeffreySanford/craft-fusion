import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class HttpClientWrapperService {
  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.logger.registerService('HttpClientWrapperService');
  }

  get<T>(url: string, options?: any): Observable<T> {
    const requestId = uuidv4();
    const startTime = performance.now();

    this.logger.debug(`HTTP GET Request: ${url}`, {
      requestId,
      url,
      method: 'GET',
      timestamp: new Date()
    });

    // Ensure we're explicitly getting the response body
    return this.http.get<T>(url, {
      ...options,
      observe: 'body'
    }).pipe(
      map(response => response as T)
    );
  }

  post<T>(url: string, body: any, options?: any): Observable<T> {
    const requestId = uuidv4();
    const startTime = performance.now();

    this.logger.debug(`HTTP POST Request: ${url}`, {
      requestId,
      url,
      method: 'POST',
      timestamp: new Date()
    });

    // Ensure we're explicitly getting the response body
    return this.http.post<T>(url, body, {
      ...options, 
      observe: 'body'
    }).pipe(
      map(response => response as T)
    );
  }

  put<T>(url: string, body: any, options?: any): Observable<T> {
    const requestId = uuidv4();
    
    this.logger.debug(`HTTP PUT Request: ${url}`, {
      requestId,
      url,
      method: 'PUT'
    });

    // Ensure we're explicitly getting the response body
    return this.http.put<T>(url, body, {
      ...options,
      observe: 'body'
    }).pipe(
      map(response => response as T)
    );
  }

  delete<T>(url: string, options?: any): Observable<T> {
    const requestId = uuidv4();
    
    this.logger.debug(`HTTP DELETE Request: ${url}`, {
      requestId,
      url,
      method: 'DELETE'
    });

    // Ensure we're explicitly getting the response body
    return this.http.delete<T>(url, {
      ...options,
      observe: 'body'
    }).pipe(
      map(response => response as T)
    );
  }
}
