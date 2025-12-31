import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  constructor(private http: HttpClient) {}

  loadDocument(documentPath: string): Observable<ArrayBuffer> {
    return this.http
      .get(documentPath, {
        responseType: 'arraybuffer',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Cache-Control': 'no-cache',
        },
      })
      .pipe(
        catchError(error => {
          console.error(`Error loading document ${documentPath}:`, error);
          return of(new ArrayBuffer(0));
        }),
      );
  }

  saveDocument(documentName: string, content: string): Observable<unknown> {
    return this.http
      .post('/api/files/document/book/save', {
        name: documentName,
        content: content,
      })
      .pipe(
        catchError(error => {
          console.error('Error saving document:', error);
          return of({ success: false, error });
        }),
      );
  }
}
