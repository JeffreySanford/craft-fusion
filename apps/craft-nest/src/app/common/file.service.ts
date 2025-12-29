import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  private readonly STORAGE_PATH: string;
  private userState: Map<string, string> = new Map();
  private allowedExtensions = new Set(['.docx', '.pdf', '.txt']);

  constructor() {
    // Ensure proper path resolution
    this.STORAGE_PATH = path.resolve(process.cwd(), 'apps/craft-nest/storage');
    
    // Create storage directory if it doesn't exist
    const documentsPath = path.join(this.STORAGE_PATH, 'documents', 'book');
    if (!fs.existsSync(documentsPath)) {
      console.log('Creating storage directory:', documentsPath);
      fs.mkdirSync(documentsPath, { recursive: true });
    }
    
    console.log('Storage path initialized:', this.STORAGE_PATH);
  }

  saveFile(file: any): Observable<void> {
    console.log('STATE: Saving file:', file.originalname);
    try {
      const filePath = path.join(this.STORAGE_PATH, 'documents', file.originalname);
      fs.writeFileSync(filePath, file.buffer);
      return of(undefined);
    } catch (err) {
      const error = err as Error; // Type assertion
      console.error('Error message:', error.message);
      return throwError(() => new HttpException(
        `Error saving file: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      ));
    }
  }

  getFile(filename: string): Observable<Buffer> {
    console.log('STATE: Getting file:', filename);
    try {
      const normalizedPath = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.resolve(this.STORAGE_PATH, 'documents', normalizedPath);
      
      if (!fs.existsSync(fullPath)) {
        return throwError(() => new HttpException(
          `File not found: ${filename}`, 
          HttpStatus.NOT_FOUND
        ));
      }

      const ext = path.extname(fullPath).toLowerCase();
      if (!this.allowedExtensions.has(ext)) {
        return throwError(() => new HttpException(
          `Invalid file type: ${ext}`, 
          HttpStatus.BAD_REQUEST
        ));
      }

      const buffer = fs.readFileSync(fullPath);
      return of(buffer);
    } catch (err) {
      const error = err as Error; // Type assertion
      console.error('File read error:', error);
      return throwError(() => new HttpException(
        `Error reading file: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      ));
    }
  }

  saveOpenedDocuments(keyValue: [string, string]): Observable<void> {
    console.log('STATE: Saving state data:', keyValue);
    if (!Array.isArray(keyValue) || keyValue.length !== 2) {
      return throwError(() => new HttpException('Invalid data format', HttpStatus.BAD_REQUEST));
    }
    const [key, value] = keyValue;
    this.userState.set(key, value);
    return of(undefined);
  }

  getOpenedDocuments(): Observable<string[]> {
    console.log('STATE: Getting state data');
    return of(Array.from(this.userState.entries()).map(([key, value]) => `${key}:${value}`));
  }
}
