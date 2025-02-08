import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private openedDocuments: string[] = [];

  constructor() { }

  addOpenedDocument(document: string): void {
    if (!this.openedDocuments.includes(document)) {
      this.openedDocuments.push(document);
    }
  }

  getOpenedDocuments(): string[] {
    return this.openedDocuments;
  }
}
