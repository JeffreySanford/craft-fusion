import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeepSeekService {
  private apiUrl = 'http://localhost:11434/api/generate';

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      model: "deepseek-r1:1.5b",
      prompt: prompt
    });
  }
}
