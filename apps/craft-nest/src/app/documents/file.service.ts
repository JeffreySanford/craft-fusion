import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentUpload {
  originalname: string;
  buffer: Buffer;
}

@Injectable()
export class FileService {
  private readonly STORAGE_PATH: string;
  private files: Map<string, Buffer> = new Map();
  private userState: Map<string, string> = new Map();

  private allowedExtensions = new Set(['.docx', '.pdf', '.txt']);

  constructor() {
    // Ensure proper path resolution
    this.STORAGE_PATH = path.resolve(process.cwd(), 'apps/craft-nest/storage');
    
    // Create all required directories
    const documentsPath = path.join(this.STORAGE_PATH, 'documents', 'book');
    if (!fs.existsSync(documentsPath)) {
      console.log('Creating storage directory:', documentsPath);
      fs.mkdirSync(documentsPath, { recursive: true });
    }

    // List files for debugging
    const files = fs.readdirSync(documentsPath);
    console.log('Files in storage/documents/book:', files);
    
    console.log('Storage path initialized:', this.STORAGE_PATH);
  }

  saveFile(file: DocumentUpload): Observable<void> {
    console.log('STATE: Saving file:', file.originalname);
    this.files.set(file.originalname, file.buffer);
    return of(undefined);
  }

  getFile(filename: string): Observable<Buffer> {
    console.log('STATE: Getting file:', filename);
    try {
      const normalizedPath = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.resolve(this.STORAGE_PATH, 'documents', normalizedPath);
      
      // Additional debugging
      console.log('Full resolved path:', fullPath);
      console.log('Parent directory:', path.dirname(fullPath));
      console.log('File name:', path.basename(fullPath));
      
      console.log('Attempting to access:', fullPath);
      console.log('Directory exists:', fs.existsSync(path.dirname(fullPath)));
      console.log('File exists:', fs.existsSync(fullPath));
      
      if (!fs.existsSync(fullPath)) {
        console.error('File not found:', fullPath);
        return throwError(() => new HttpException(
          `File not found: ${filename}`, 
          HttpStatus.NOT_FOUND
        ));
      }

      const ext = path.extname(fullPath).toLowerCase();
      if (!this.allowedExtensions.has(ext)) {
        console.error('Invalid file type:', ext);
        return throwError(() => new HttpException(
          `Invalid file type: ${ext}`, 
          HttpStatus.BAD_REQUEST
        ));
      }

      const buffer = fs.readFileSync(fullPath);
      console.log('Successfully read file:', filename, 'size:', buffer.length);
      return of(buffer);
    } catch (err) {
      const error = err as Error;
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
      return throwError(new HttpException('Invalid data format', HttpStatus.BAD_REQUEST));
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
