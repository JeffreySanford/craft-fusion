import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(private api: ApiService) {}

  uploadFile(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<void>('/api/files/upload', formData);
  }
}
