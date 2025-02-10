import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Document {
  name: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private openedDocuments: Document[] = [];
  private loginDateTime: Date | null = null;
  private visitLength: number | null = null;
  private visitedPages: string[] = [];
  private documentColors: string[] = ['red', 'green', 'blue', 'yellow', 'purple'];

  private pageNameMapping: { [key: string]: string } = {
    '/api/files/getOpenedDocuments': 'Opened Documents',
    '/api/files/upload': 'Upload File',
    '/api/files/saveOpenedDocuments': 'Save Opened Documents',
    '/api/user/saveLoginDateTime': 'Save Login Date/Time',
    '/api/user/saveVisitLength': 'Save Visit Length',
    '/api/user/saveVisitedPages': 'Save Visited Pages',
    '/home': 'Home',
    '/table': 'Material Table',
    '/data-visualizations': 'Data Visualizations',
    '/book': 'Book',
    '/space-video': 'Space Video',
    // Add more mappings as needed
  };

  constructor(private http: HttpClient) { }

  setOpenedDocument(document: string): string[] {
    if (!this.openedDocuments.some(doc => doc.name === document)) {
      const color = this.documentColors[this.openedDocuments.length % this.documentColors.length];
      this.openedDocuments.push({ name: document, color });
      this.saveOpenedDocuments().subscribe(() => {
        console.log('STATE: Opened documents saved:', this.openedDocuments);
        return document;
      });
      console.log('STATE: Opened documents:', this.openedDocuments);
    }
    return this.openedDocuments.map(doc => doc.name);
  }

  getOpenedDocuments(): Document[] {
    this.loadOpenedDocuments().subscribe(docs => {
      this.openedDocuments = docs.map(doc => ({ name: doc, color: this.documentColors[this.openedDocuments.length % this.documentColors.length] }));
      console.log('STATE: Loaded opened documents:', this.openedDocuments);
    });
    return this.openedDocuments;
  }

  setLoginDateTime(dateTime: Date): void {
    this.loginDateTime = dateTime;
    this.saveLoginDateTime().subscribe(() => {
      console.log('STATE: Login date/time saved:', this.loginDateTime);
    });
  }

  getLoginDateTime(): Date | null {
    this.loadLoginDateTime().subscribe(dateTime => {
      this.loginDateTime = dateTime;
      console.log('STATE: Loaded login date/time:', this.loginDateTime);
    });
    return this.loginDateTime;
  }

  setVisitLength(length: number): void {
    this.visitLength = length;
    this.saveVisitLength().subscribe(() => {
      console.log('STATE: Visit length saved:', this.visitLength);
    });
  }

  getVisitLength(): number | null {
    this.loadVisitLength().subscribe(length => {
      this.visitLength = length;
      console.log('STATE: Loaded visit length:', this.visitLength);
    });
    return this.visitLength;
  }

  setVisitedPage(page: string): void {
    const pageName = this.pageNameMapping[page] || page;
    if (!this.visitedPages.includes(pageName)) {
      this.visitedPages.push(pageName);
      this.saveVisitedPages().subscribe(() => {
        console.log('STATE: Visited pages saved:', this.visitedPages);
      });
      console.log('STATE: Visited pages:', this.visitedPages);
    }
  }

  getVisitedPages(): string[] {
    this.loadVisitedPages().subscribe(pages => {
      this.visitedPages = pages;
      console.log('STATE: Loaded visited pages:', this.visitedPages);
    });
    return this.visitedPages;
  }

  private saveOpenedDocuments(): Observable<void> {
    console.log('STATE: Saving opened documents:', this.openedDocuments);
    return this.http.post<void>('/api/files/saveOpenedDocuments', this.openedDocuments).pipe(
      catchError(this.handleError)
    );
  }

  private loadOpenedDocuments(): Observable<string[]> {
    console.log('STATE: Loading opened documents');
    return this.http.get<string[]>('/api/files/getOpenedDocuments').pipe(
      catchError(error => {
      if (error.status === 404) {
        console.log('STATE: No opened documents found, returning empty array.');
        return new Observable<string[]>(observer => {
        observer.next([]);
        observer.complete();
        });
      } else {
        return this.handleError(error);
      }
      })
    );
  }

  private saveLoginDateTime(): Observable<void> {
    console.log('STATE: Saving login date/time:', this.loginDateTime);
    return this.http.post<void>('/api/user/saveLoginDateTime', { dateTime: this.loginDateTime?.toISOString() }).pipe(
      catchError(this.handleError)
    );
  }

  private loadLoginDateTime(): Observable<Date> {
    console.log('STATE: Loading login date/time');
    return this.http.get<Date>('/api/user/getLoginDateTime').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitLength(): Observable<void> {
    console.log('STATE: Saving visit length:', this.visitLength);
    return this.http.post<void>('/api/user/saveVisitLength', { length: this.visitLength }).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitLength(): Observable<number> {
    console.log('STATE: Loading visit length');
    return this.http.get<number>('/api/user/getVisitLength').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitedPages(): Observable<void> {
    console.log('STATE: Saving visited pages:', this.visitedPages);
    return this.http.post<void>('/api/user/saveVisitedPages', this.visitedPages).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitedPages(): Observable<string[]> {
    console.log('STATE: Loading visited pages');
    return this.http.get<string[]>('/api/user/getVisitedPages').pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error.message);
    return throwError('Something bad happened; please try again later.');
  }
}
