import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface FaaAircraft {
  nNumber: string;
  serialNumber: string;
  mfrMdlCode: string;
  engineMfrMdl: string;
  yearMfr: string;
  typeRegistrant: string;
  name: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  region: string;
  county: string;
  country: string;
  lastActionDate: string;
  certIssueDate: string;
  certification: string;
  typeAircraft: string;
  typeEngine: string;
  statusCode: string;
  modeSCode: string;
  fractOwner: string;
  airWorthDate: string;
  expirationDate: string;
  uniqueId: string;
  kitMfr: string;
  kitModel: string;
  modeSCodeHex: string;
  model?: string;
  manufacturer?: string;
  acftType?: string;
}

@Injectable({ providedIn: 'root' })
export class FaaService {
  constructor(private http: HttpClient) {}

  lookupNNumber(nNumber: string): Observable<{ found: boolean; aircraft?: FaaAircraft }> {
    if (!nNumber) return of({ found: false });
    return this.http.get<{ found: boolean; aircraft?: FaaAircraft }>(`/api/faa/lookup/${encodeURIComponent(nNumber)}`);
  }
}
