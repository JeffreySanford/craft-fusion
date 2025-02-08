import { Injectable } from '@nestjs/common';
import { Observable, of, from } from 'rxjs';

@Injectable()
export class FileService {
  private files: Map<string, Buffer> = new Map();
  private openedDocuments: string[] = [];

  saveFile(file: Express.Multer.File): Observable<void> {
    this.files.set(file.originalname, file.buffer);
    return of(undefined);
  }

  getFile(filename: string): Observable<Buffer> {
    const file = this.files.get(filename);
    if (!file) {
      throw new Error('File not found');
    }
    return of(file);
  }

  saveOpenedDocuments(documents: string[]): Observable<void> {
    this.openedDocuments = documents;
    return of(undefined);
  }

  getOpenedDocuments(): Observable<string[]> {
    return of(this.openedDocuments);
  }
}
