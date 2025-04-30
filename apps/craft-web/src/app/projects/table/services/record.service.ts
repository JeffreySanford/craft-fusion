import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, timeout, retry, delay, tap } from 'rxjs/operators';
import { ApiService } from '../../../common/services/api.service';
import { Record } from '../models/record';
import { NotificationService } from '../../../common/services/notification.service'; 
import { LoggerService } from '../../../common/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  private selectedUID = '';
  private recordGenerationTime = 0;
  private baseUrl = 'records'; // Base API endpoint for records
  private apiUrl: string;
  
  // Constants for network settings
  private readonly REQUEST_TIMEOUT = 15000; // 15 seconds timeout
  private readonly RETRY_COUNT = 2;
  private readonly RETRY_DELAY = 1000;
  
  // Flag to track if we're in offline mode
  private isOfflineMode = false;
  
  // Mock data cache (used when API is unavailable)
  private mockDataCache: Record[] = [];

  constructor(
    public apiService: ApiService,
    private notificationService: NotificationService,
    private logger: LoggerService
  ) {
    this.apiUrl = apiService.getApiUrl();
    this.logger.debug('RecordService initialized', { apiUrl: this.apiUrl });
  }

  /**
   * Sets the server resource for API calls
   * @param serverName The name of the server to use
   * @returns The configured API URL
   */
  setServerResource(serverName: string): string {
    this.apiUrl = this.apiService.setApiUrl(serverName);
    this.logger.debug('Server resource set', { serverName, apiUrl: this.apiUrl });
    return this.apiUrl;
  }

  /**
   * Gets all records from the API
   * @returns An observable of records
   */
  getAllRecords(): Observable<Record[]> {
    // If we're in offline mode, return mock data
    if (this.isOfflineMode) {
      this.logger.warn('Operating in offline mode, using cached records');
      return of(this.generateMockRecords(100));
    }
    
    return this.apiService.get<Record[]>(this.baseUrl, { 
      timeout: this.REQUEST_TIMEOUT 
    }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry({ count: this.RETRY_COUNT, delay: this.RETRY_DELAY }),
      tap(records => {
        // Cache the successfully retrieved records for offline use
        this.mockDataCache = records;
      }),
      catchError(error => this.handleApiError(error, 100))
    );
  }

  /**
   * Gets a record by its UID
   * @param UID The UID of the record to get
   * @returns An observable of the record
   */
  getRecordByUID(UID: string): Observable<Record> {
    this.selectedUID = UID;
    
    // Handle offline mode
    if (this.isOfflineMode) {
      const mockRecord = this.generateMockRecords(1)[0];
      mockRecord.UID = UID;
      return of(mockRecord).pipe(delay(300)); // Add delay to simulate network
    }
    
    return this.apiService.get<Record>(`${this.baseUrl}/${UID}`, {
      timeout: this.REQUEST_TIMEOUT
    }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry({ count: this.RETRY_COUNT, delay: this.RETRY_DELAY }),
      catchError(error => {
        if (error.status === 0 || error.status === 504) {
          this.logger.warn('Network error while fetching record, generating mock', { UID });
          this.isOfflineMode = true;
          
          // Generate a single mock record with the requested UID
          const mockRecord = this.generateMockRecords(1)[0];
          mockRecord.UID = UID;
          return of(mockRecord);
        }
        
        this.logger.error('Failed to fetch record by UID', { error, UID });
        return throwError(() => error);
      })
    );
  }

  /**
   * Generates a new set of records
   * @param count The number of records to generate
   * @returns An observable of the generated records
   */
  generateNewRecordSet(count: number): Observable<Record[]> {
    this.logger.debug(`Generating new record set`, {
      count,
      endpoint: `${this.baseUrl}/generate?count=${count}`,
      isOffline: this.isOfflineMode
    });
    
    // If we're in offline mode, generate mock data locally
    if (this.isOfflineMode) {
      return of(this.generateMockRecords(count)).pipe(
        delay(500), // Simulate network latency
        tap(() => {
          this.notificationService.showInfo(
            'Using offline mode with generated records',
            'Offline Mode'
          );
        })
      );
    }
    
    // Online mode - try to get data from API
    return this.apiService.get<Record[]>(`${this.baseUrl}/generate?count=${count}`, {
      timeout: this.REQUEST_TIMEOUT
    }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry({ count: this.RETRY_COUNT, delay: this.RETRY_DELAY }),
      tap(records => {
        // Cache the data we received
        if (records && records.length > 0) {
          this.mockDataCache = records;
        }
      }),
      catchError(error => this.handleApiError(error, count))
    );
  }

  /**
   * Gets the time taken to generate records
   * @returns An observable of the generation time
   */
  getCreationTime(): Observable<number> {
    if (this.isOfflineMode) {
      // Simulate a reasonable generation time for mock data
      return of(Math.floor(Math.random() * 50) + 10);
    }
    
    return this.apiService.get<{ generationTime: number }>(`${this.baseUrl}/time`, {
      timeout: 5000 // Shorter timeout for this simple request
    }).pipe(
      map(response => response.generationTime),
      catchError(error => {
        if (error.status === 0 || error.status === 504) {
          // Switch to offline mode and return a mock time
          this.isOfflineMode = true;
          return of(Math.floor(Math.random() * 50) + 20);
        }
        this.logger.error('Failed to fetch creation time', { error });
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Gets the UID of the currently selected record
   * @returns The selected UID
   */
  getSelectedUID(): string {
    return this.selectedUID;
  }
  
  /**
   * Sets the UID of the currently selected record
   * @param uid The UID to set
   */
  setSelectedUID(uid: string): void {
    this.selectedUID = uid;
  }
  
  // Private helper methods
  
  /**
   * Handles API errors with appropriate fallbacks
   * @param error The error from the API call
   * @param count The number of records to generate as fallback
   * @returns An observable of fallback records
   */
  private handleApiError(error: any, count: number): Observable<Record[]> {
    // Check if this is a network connectivity issue
    if (error.status === 0 || error.status === 504) {
      this.isOfflineMode = true;
      this.logger.warn('Network error - switching to offline mode', { 
        status: error.status,
        message: error.message 
      });
      
      // Show notification about offline mode
      this.notificationService.showWarning(
        'Server is unreachable. Using offline mode with generated data.',
        'Connectivity Issue'
      );
      
      // First try to use cached data if available
      if (this.mockDataCache.length > 0) {
        return of(this.mockDataCache);
      }
      
      // Otherwise generate new mock data
      return of(this.generateMockRecords(count)).pipe(
        delay(300) // Add a small delay to simulate network
      );
    }
    
    // For other types of errors, log and rethrow
    this.logger.error('API request failed', { error });
    return throwError(() => error);
  }
  
  /**
   * Generates mock record data when offline
   * @param count Number of records to generate
   * @returns Array of mock records
   */
  private generateMockRecords(count: number): Record[] {
    const records: Record[] = [];
    
    for (let i = 0; i < count; i++) {
      const uid = this.generateUID();
      records.push({
        UID: uid,
        firstName: `FirstName${i}`,
        lastName: `LastName${i}`,
        name: `FirstName${i} LastName${i}`,
        avatar: null,
        flicker: null,
        address: {
          street: `${i} Mock Street`,
          city: `City${i % 10}`,
          state: `State${i % 5}`,
          zipcode: `${10000 + i % 90000}`
        },
        city: `City${i % 10}`,
        state: `State${i % 5}`,
        zip: `${10000 + i % 90000}`,
        phone: {
          UID: `phone-${uid}`,
          number: `555${i.toString().padStart(7, '0')}`,
          type: 'mobile'
        },
        salary: [
          {
            UID: `salary-${uid}-1`,
            employeeName: `FirstName${i} LastName${i}`,
            annualSalary: 50000 + (i * 1000),
            companyName: `Company ${i % 5}`
          },
          {
            UID: `salary-${uid}-2`,
            employeeName: `FirstName${i} LastName${i}`,
            annualSalary: 25000 + (i * 500),
            companyName: `Side Gig ${i % 3}`
          }
        ],
        totalHouseholdIncome: 75000 + (i * 1500)
      });
    }
    
    return records;
  }
  
  /**
   * Generates a random UID for mock records
   * @returns A string UID
   */
  private generateUID(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Checks network connectivity and resets offline mode if connectivity returns
   */
  public checkNetworkStatus(): Observable<boolean> {
    return this.apiService.get<any>('health-check', {
      headers: { 'Cache-Control': 'no-cache' },
      timeout: 3000
    }).pipe(
      timeout(3000),
      map(() => {
        // If we can reach the server, reset offline mode
        this.isOfflineMode = false;
        return true;
      }),
      catchError(() => {
        this.isOfflineMode = true;
        return of(false);
      })
    );
  }
}