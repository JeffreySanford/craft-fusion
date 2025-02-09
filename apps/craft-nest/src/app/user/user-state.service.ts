import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { FileService } from '../documents/file.service';

@Injectable()
export class UserStateService {
  private loginDateTime: Date | null = null;
  private visitLength: number | null = null;
  private visitedPages: string[] = [];

  constructor(private fileService: FileService) {}

  setLoginDateTime(dateTime: Date): Observable<void> {
    console.log('STATE: Setting login date/time:', dateTime);
    this.loginDateTime = dateTime;
    return this.fileService.saveOpenedDocuments(['loginDateTime', dateTime.toISOString()]);
  }

  getLoginDateTime(): Observable<Date | null> {
    console.log('STATE: Getting login date/time');
    return new Observable(observer => {
      this.fileService.getOpenedDocuments().subscribe(docs => {
        const loginDateTime = docs.find(doc => doc.startsWith('loginDateTime'));
        if (loginDateTime) {
          this.loginDateTime = new Date(loginDateTime.split(',')[1]);
          observer.next(this.loginDateTime);
        } else {
          observer.next(null);
        }
        observer.complete();
      });
    });
  }

  setVisitLength(length: number): Observable<void> {
    console.log('STATE: Setting visit length:', length);
    this.visitLength = length;
    return this.fileService.saveOpenedDocuments(['visitLength', length.toString()]);
  }

  getVisitLength(): Observable<number | null> {
    console.log('STATE: Getting visit length');
    return new Observable(observer => {
      this.fileService.getOpenedDocuments().subscribe(docs => {
        const visitLength = docs.find(doc => doc.startsWith('visitLength'));
        if (visitLength) {
          this.visitLength = parseInt(visitLength.split(',')[1], 10);
          observer.next(this.visitLength);
        } else {
          observer.next(null);
        }
        observer.complete();
      });
    });
  }

  setVisitedPages(pages: string[]): Observable<void> {
    console.log('STATE: Setting visited pages:', pages);
    this.visitedPages = pages;
    return this.fileService.saveOpenedDocuments(['visitedPages', JSON.stringify(pages)]);
  }

  getVisitedPages(): Observable<string[]> {
    console.log('STATE: Getting visited pages');
    return new Observable(observer => {
      this.fileService.getOpenedDocuments().subscribe(docs => {
        const visitedPages = docs.find(doc => doc.startsWith('visitedPages'));
        if (visitedPages) {
          this.visitedPages = JSON.parse(visitedPages.split(',')[1]);
          observer.next(this.visitedPages);
        } else {
          observer.next([]);
        }
        observer.complete();
      });
    });
  }
}
