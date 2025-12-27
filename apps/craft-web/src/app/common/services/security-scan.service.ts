import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SocketClientService } from './socket-client.service';
import { filter, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SecurityScanService {
  constructor(private http: HttpClient, private socket: SocketClientService) {}

  startScan(payload: { type: string; scope: string }): Observable<{ jobId: string }> {
    return this.http.post<{ jobId: string }>('/api/security/scans', payload);
  }

  getStatus(jobId: string): Observable<any> {
    return this.http.get(`/api/security/scans/${jobId}`) as Observable<any>;
  }

  getLatest(): Observable<any> {
    return this.http.get('/api/security/latest') as Observable<any>;
  }

  watchJob(jobId: string): Observable<any> {
    // Listen to generic 'security:job' events and filter by jobId
    return this.socket.on<any>('security:job').pipe(
      filter(msg => msg && msg.jobId === jobId),
      map(msg => msg)
    );
  }
}
