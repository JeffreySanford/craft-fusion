import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    const url = `records/${UID}`;
    console.log(`Fetching record by UID: ${UID}`);
    return this.apiService.get<Record>(url);
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
    console.log('Fetching all records');
    return this.apiService.get<Record[]>('records');
  }

  /**
   * Creates a new record in the system
   * @param record - The record data to be created
   * @returns Observable<Record> - The newly created record
   * @example
   * const newRecord: Record = { ... };
   * recordService.addRecord(newRecord).subscribe(created => {
   *   console.log('Created:', created);
   * });
   */
  addRecord(record: Record): Observable<Record> {
    console.log('Adding record');
    return this.apiService.post<Record>('records', record);
  }

  // sets the currently selected user to prepare to user detail presentation
  setSelectedUID(uid: string): void {
    console.log(`Setting selected user ID: ${uid}`);
    this.selectedUserID = uid;
  }

  // Used by the detailed component to get the current selected user ID
  getSelectedUID(): string {
    console.log('Getting selected user ID');
    return this.selectedUserID;
  }

  //  This is the main service to generated mocked user records
  generateNewRecordSet(count: number): Observable<Record[]> {
    const url = `records/generate?count=${count}`;
    console.log(`Generating new record set with count: ${count}`);
    return this.apiService.get<Record[]>(url);
  }

  // This is performance testing service to get the creation time of the records
  getCreationTime(): Observable<number> {
    const url = `records/time`;
    console.log('Fetching creation time');
    return this.apiService.get<number>(url);
  }
}