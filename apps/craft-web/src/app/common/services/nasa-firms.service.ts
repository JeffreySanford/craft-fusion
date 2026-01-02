import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NasaFirmsAlert {
  id: string;
  latitude: number;
  longitude: number;
  acqDate?: string;
  acqTime?: string;
  confidence?: number;
  frp?: number;
  brightness?: number;
  source?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NasaFirmsService {
  private readonly baseUrl = `${environment.apiUrl}/api/firms`;

  constructor(private http: HttpClient) {}

  getActiveFires(params: {
    lat: number;
    lng: number;
    radiusKm?: number;
    days?: number;
    source?: string;
    limit?: number;
  }): Observable<NasaFirmsAlert[]> {
    let httpParams = new HttpParams()
      .set('lat', params.lat.toString())
      .set('lng', params.lng.toString());

    if (params.radiusKm !== undefined) {
      httpParams = httpParams.set('radiusKm', params.radiusKm.toString());
    }
    if (params.days !== undefined) {
      httpParams = httpParams.set('days', params.days.toString());
    }
    if (params.source) {
      httpParams = httpParams.set('source', params.source);
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<NasaFirmsAlert[]>(`${this.baseUrl}/active`, { params: httpParams });
  }
}
