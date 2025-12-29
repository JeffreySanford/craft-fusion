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
    formData.append('file', file, file.name);
    return this.api.post<FormData, void>('/api/files/upload', formData);
  }
}
