import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Record } from './models/record';
import { ApiService } from '../../common/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  selectedUserID = "0000000";

  constructor(private apiService: ApiService) {}

  // Method to get a record by UID
  getRecordByUID(UID: string): Observable<Record> {
    const url = `records/${UID}`;
    console.log(`Fetching record by UID: ${UID}`);
    return this.apiService.get<Record>(url);
  }

  // Method to get all records
  getAllRecords(): Observable<Record[]> {
    console.log('Fetching all records');
    return this.apiService.get<Record[]>('records');
  }

  // sets the currently selected user to prepare to user detail presentation
  setSelectedUID(uid: string): void {
    console.log(`Setting selected user ID: ${uid}`);
    this.selectedUserID = uid;
  }

  getSelectedUID(): string {
    console.log('Getting selected user ID');
    return this.selectedUserID;
  }

  generateNewRecordSet(count: number): Observable<Record[]> {
    const url = `records/generate?count=${count}`;
    console.log(`Generating new record set with count: ${count}`);
    return this.apiService.get<Record[]>(url);
  }

  getCreationTime(): Observable<number> {
    const url = `records/time`;
    console.log('Fetching creation time');
    return this.apiService.get<number>(url);
  }
}