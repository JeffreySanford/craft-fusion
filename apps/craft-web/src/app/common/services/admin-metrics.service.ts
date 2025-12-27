import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AdminMetrics {
  activeUsers: number;
  permissionRequests: number;
  connection: string;
}

@Injectable({ providedIn: 'root' })
export class AdminMetricsService {
  constructor(private http: HttpClient) {}

  getMetrics(): Observable<AdminMetrics> {
    return this.http.get<AdminMetrics>('/api/admin/metrics').pipe(
      catchError(() => of({ activeUsers: 1, permissionRequests: 0, connection: 'Secure' }))
    );
  }
}
