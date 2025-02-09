import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { Multer } from 'multer';

@Injectable()
export class FileService {
  private files: Map<string, Buffer> = new Map();
  private openedDocuments: string[] = [""];

  saveFile(file: Express.Multer.File): Observable<void> {
    console.log('STATE: Saving file:', file.originalname);
    this.files.set(file.originalname, file.buffer);
    return of(undefined);
  }

  getFile(filename: string): Observable<Buffer> {
    console.log('STATE: Getting file:', filename);
    const file = this.files.get(filename);
    if (!file) {
      return throwError(new HttpException('File not found', HttpStatus.NOT_FOUND));
    }
    return of(file);
  }

  saveOpenedDocuments(documents: string[]): Observable<void> {
    console.log('STATE: Saving opened documents:', documents);
    if (!Array.isArray(documents)) {
      return throwError(new HttpException('Invalid documents format', HttpStatus.BAD_REQUEST));
    }
    this.openedDocuments = documents;
    return of(undefined);
  }

  getOpenedDocuments(): Observable<string[]> {
    console.log('STATE: Getting opened documents');
    return of(this.openedDocuments.length ? this.openedDocuments : []);
  }
}
