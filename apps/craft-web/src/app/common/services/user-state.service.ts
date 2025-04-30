import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { Document } from '../../projects/book/book.component';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private openedDocuments: Document[] = [];
  private loginDateTime: Date | null = null;
  private visitLength: number | null = null;
  private visitedPages: string[] = [];

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  // Login date/time methods
  setLoginDateTime(dateTime: Date): Observable<Date> {
    this.loginDateTime = dateTime;
    this.logger.debug('Setting login date time', { dateTime });
    return this.http.post<Date>('/api/user/saveLoginDateTime', { dateTime }).pipe(
      tap(() => this.logger.debug('Login date time saved')),
      catchError(error => {
        this.logger.error('Error saving login date time', error);
        return of(dateTime);
      })
    );
  }

  getLoginDateTime(): Date | null {
    return this.loginDateTime;
  }

  // Visit length tracking
  setVisitLength(length: number): void {
    this.visitLength = length;
    this.logger.debug('Setting visit length', { length });
    // Could be implemented to save to API if needed
  }

  getVisitLength(): number | null {
    return this.visitLength;
  }

  // Page visit tracking
  setVisitedPage(pageName: string): Observable<string[]> {
    if (!this.visitedPages.includes(pageName)) {
      this.visitedPages.push(pageName);
    }
    this.logger.debug('Setting visited page', { pageName });
    
    // Save to API
    return this.http.post<string[]>('/api/user/saveVisitedPage', { pageName }).pipe(
      tap(() => this.logger.debug(`Page visit recorded: ${pageName}`)),
      catchError(error => {
        this.logger.error('Error saving visited page', error);
        return of(this.visitedPages);
      })
    );
  }

  getVisitedPages(): string[] {
    return [...this.visitedPages];
  }

  // Document tracking methods
  setOpenedDocument(documentName: string): Observable<Document[]> {
    const existingDoc = this.openedDocuments.find(doc => doc.name === documentName);
    if (!existingDoc) {
      // Generate color if it doesn't exist
      const colors = ['#FF5252', '#448AFF', '#69F0AE', '#FFAB40', '#BA68C8'];
      const color = colors[this.openedDocuments.length % colors.length];
      const contrast = this.isLightColor(color) ? '#000000' : '#FFFFFF';
      
      this.openedDocuments.push({ name: documentName, color, contrast });
    }
    
    this.logger.debug('Setting opened document', { documentName });
    
    // Save to API
    return this.http.post<Document[]>('/api/files/saveOpenedDocuments', { documents: this.openedDocuments }).pipe(
      tap(() => this.logger.debug(`Opened document saved: ${documentName}`)),
      catchError(error => {
        this.logger.error('Error saving opened document', error);
        return of(this.openedDocuments);
      })
    );
  }

  setOpenedDocuments(documents: Document[]): Observable<Document[]> {
    this.openedDocuments = documents;
    this.logger.debug('Setting opened documents', { count: documents.length });
    
    // Save to API
    return this.http.post<Document[]>('/api/files/saveOpenedDocuments', { documents }).pipe(
      tap(() => this.logger.debug('Opened documents saved')),
      catchError(error => {
        this.logger.error('Error saving opened documents', error);
        return of(documents);
      })
    );
  }

  getOpenedDocuments(): Document[] {
    return [...this.openedDocuments];
  }

  // Helper method to determine if a color is light (for contrast)
  private isLightColor(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }
}
