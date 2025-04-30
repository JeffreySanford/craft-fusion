import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../common/services/api.service';
import { Record } from '../models/record';

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  private selectedUID = '';
  private recordGenerationTime = 0;
  private baseUrl = 'records'; // Base API endpoint for records
  private apiUrl: string;

  constructor(public apiService: ApiService) {
    this.apiUrl = this.apiService.getApiUrl();
  }

  /**
   * Sets the server resource for API calls
   * @param serverName The name of the server to use
   * @returns The configured API URL
   */
  setServerResource(serverName: string): string {
    console.log('Setting server resource:', serverName);
    this.apiUrl = this.apiService.setApiUrl(serverName);
    return this.apiUrl;
  }

  /**
   * Gets all records from the API
   * @returns An observable of records
   */
  getAllRecords(): Observable<Record[]> {
    return this.apiService.get<Record[]>(this.baseUrl);
  }

  /**
   * Gets a record by its UID
   * @param UID The UID of the record to get
   * @returns An observable of the record
   */
  getRecordByUID(UID: string): Observable<Record> {
    return this.apiService.get<Record>(`${this.baseUrl}/${UID}`);
  }

  /**
   * Sets the selected UID for future use
   * @param UID The UID to set
   */
  setSelectedUID(UID: string): void {
    this.selectedUID = UID;
  }

  /**
   * Gets the selected UID
   * @returns The selected UID
   */
  getSelectedUID(): string {
    return this.selectedUID;
  }

  /**
   * Generates a new set of records
   * @param count The number of records to generate
   * @returns An observable of the generated records
   */
  generateNewRecordSet(count: number): Observable<Record[]> {
    console.log(`Generating new record set with count: ${count} from URL: ${this.apiUrl}/${this.baseUrl}/generate?count=${count}`);
    return this.apiService.get<Record[]>(`${this.baseUrl}/generate?count=${count}`);
  }

  /**
   * Fetch the creation time of records from the server
   * @returns Observable of the generation time in milliseconds
   */
  getCreationTime(): Observable<number> {
    console.log('Fetching creation time from URL:', `${this.baseUrl}/time`);
    
    return this.apiService.get<{ generationTime: number }>(`${this.baseUrl}/time`).pipe(
      map(response => {
        // Extract generationTime from response object
        return response.generationTime;
      }),
      catchError(error => {
        console.error('Error: getCreationTime failed:', error);
        return throwError(() => error);
      })
    );
  }
}