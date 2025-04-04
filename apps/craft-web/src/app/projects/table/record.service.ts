import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Record } from './models/record';
import { ApiService } from '../../common/services/api.service';

/**
 * Service responsible for managing user records in the application.
 * Handles CRUD operations for Record entities through the API service.
 */
@Injectable()
export class RecordService {
  /** Currently selected user's ID - defaults to "0000000" */
  selectedUserID = "0000000";

  /**
   * Creates an instance of RecordService.
   * @param apiService - Injected API service for making HTTP requests
   */
  constructor(private apiService: ApiService) {}

  /**
   * Retrieves a specific record by its Unique Identifier
   * @param UID - Unique identifier of the record to fetch
   * @returns Observable<Record> - The requested record data
   * @example
   * recordService.getRecordByUID("123").subscribe(record => {
   *   console.log(record);
   * });
   */
  getRecordByUID(UID: string): Observable<Record> {
    const uid = `api/records/${UID}`;
    console.log(`Fetching record by UID: ${UID} from URL: ${this.apiService.getApiUrl()}/${uid}`);

    return this.apiService.get<Record>(uid);
  }

  /**
   * Retrieves all available records from the system
   * @returns Observable<Record[]> - Array of all records
   * @example
   * recordService.getAllRecords().subscribe(records => {
   *   this.records = records;
   * });
   */
  getAllRecords(): Observable<Record[]> {
    const url = 'api/records';
    console.log(`Fetching all records from URL: ${this.apiService.getApiUrl()}/${url}`);
    return this.apiService.get<Record[]>(url).pipe(
      catchError((error: any): Observable<Record[]> => {
        console.error('Error: getAllRecords failed:', error);
        return of([]); // Ensure an Observable is returned
      })
    );
  }

  /**
   * Creates a new record in the system
   * @param url - The API endpoint URL
   * @param record - The record data to be created
   * @returns Observable<Record> - The newly created record
   * @example
   * const newRecord: Record = { ... };
   * recordService.addRecord('api/records', newRecord).subscribe(created => {
   *   console.log('Created:', created);
   * });
   */
  addRecord(url: string, record: Record): Observable<Record> {
    console.log(`Adding record to URL: ${this.apiService.getApiUrl()}/${url}`);
    return this.apiService.post<Record>(url, record);
  }

  // sets the currently selected user to prepare to user detail presentation
  setSelectedUID(uid: string): void {
    console.log(`Setting selected user ID: ${uid}`);
    this.selectedUserID = uid;
  }
  
  // gets the currently selected user ID
  getSelectedUID(): string {
    console.log(`Getting selected user ID: ${this.selectedUserID}`);
    return this.selectedUserID;
  }

  //  This is the main service to generated mocked user records
  generateNewRecordSet(count: number): Observable<Record[]> {
    const url = `api/records/generate?count=${count}`;
    console.log(`Generating new record set with count: ${count} from URL: ${this.apiService.getApiUrl()}/${url}`);
    return this.apiService.get<Record[]>(url).pipe(
      catchError((error: any): Observable<Record[]> => {
        console.error('Error: generateNewRecordSet failed:', error);
        return of([]); // Ensure an Observable is returned
      })
    );
  }

  // This is performance testing service to get the creation time of the records
  getCreationTime(): Observable<number> {
    const url = `api/records/time`;
    console.log(`Fetching creation time from URL: ${this.apiService.getApiUrl()}/${url}`);
    return this.apiService.get<number>(url).pipe(
      catchError((error: any): Observable<number> => {
        console.error('Error: getCreationTime failed:', error);
        return of(0); // Ensure an Observable is returned
      })
    );
  }

  setServerResource(resource: string): Observable<void> {
    console.log(`Setting server resource: ${resource}`);
    return this.apiService.setApiUrl(resource);
  }
}