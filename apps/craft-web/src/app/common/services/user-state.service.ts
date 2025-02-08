import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private openedDocuments: string[] = [];

  constructor(private http: HttpClient) { }

  addOpenedDocument(document: string): void {
    if (!this.openedDocuments.includes(document)) {
      this.openedDocuments.push(document);
      this.saveOpenedDocuments().subscribe();
      console.log('Opened documents:', this.openedDocuments);
    }
  }

  getOpenedDocuments(): string[] {
    this.loadOpenedDocuments().subscribe(docs => {
      this.openedDocuments = docs;
    });
    return this.openedDocuments;
  }

  private saveOpenedDocuments(): Observable<void> {
    return this.http.post<void>('/api/files/saveOpenedDocuments', this.openedDocuments);
  }

  private loadOpenedDocuments(): Observable<string[]> {
    return this.http.get<string[]>('/api/files/getOpenedDocuments');
  }
}
