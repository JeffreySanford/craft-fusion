import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, timeout, retry, delay, tap } from 'rxjs/operators';
import { ApiService } from '../../../common/services/api.service';
import { Record } from '@craft-fusion/craft-library';
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
  
  // Flag to track if we're in offline mode - renamed to avoid conflict
  private _isOfflineMode = false;
  
  // Mock data for offline mode
  private mockRecords: Record[] = [];
  
  // Add BehaviorSubject for offline status
  private offlineStatusSubject = new BehaviorSubject<boolean>(false);
  public offlineStatus$ = this.offlineStatusSubject.asObservable();
  
  constructor(
    public apiService: ApiService,
    private notificationService: NotificationService,
    private logger: LoggerService
  ) {
    this.apiUrl = apiService.getApiUrl();
    this.logger.info('RecordService initialized', { 
      apiUrl: this.apiUrl,
      timeout: this.REQUEST_TIMEOUT 
    });
    
    // Initialize mock data for fallback when backend is unavailable
    this.generateMockRecords(100);
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
    // In offline mode, use mock data instead of failing
    if (this._isOfflineMode) {
      this.logger.warn('Operating in offline mode, using mock data');
      this.notificationService.showInfo(
        'Using locally generated data because server is unreachable.',
        'Offline Mode'
      );
      return of(this.mockRecords);
    }
    
    return this.apiService.get<Record[]>(this.baseUrl, { 
      timeout: this.REQUEST_TIMEOUT 
    }).pipe(
      catchError(error => {
        this.logger.error('Failed to get all records', { error });
        // If connection fails, use mock data
        if (error.status === 0 || error.status === 504) {
          this.setOfflineMode(true);
          this.notificationService.showWarning(
            'Cannot connect to server. Using mock data instead.',
            'Connectivity Issue'
          );
          this.logger.info('Switching to offline mode with mock data');
          return of(this.mockRecords);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets a record by its UID
   * @param UID The UID of the record to get
   * @returns An observable of the record
   */
  getRecordByUID(UID: string): Observable<Record> {
    this.selectedUID = UID;
    this.logger.debug('Getting record by UID', { UID });
    
    // Handle offline mode with mock data
    if (this._isOfflineMode) {
      this.logger.warn('Using mock data for record in offline mode', { UID });
      // Find a record with matching UID or return the first mock record
      const record = this.mockRecords.find(r => r.UID === UID) || this.mockRecords[0];
      this.notificationService.showInfo(
        'Using locally generated data because server is unreachable.',
        'Offline Mode'
      );
      return of(record);
    }
    
    return this.apiService.get<Record>(`${this.baseUrl}/${UID}`, {
      timeout: this.REQUEST_TIMEOUT
    }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry({ count: this.RETRY_COUNT, delay: this.RETRY_DELAY }),
      catchError(error => {
        if (error.status === 0 || error.status === 504) {
          this.logger.warn('Network error while fetching record, using mock data', { UID });
          this.setOfflineMode(true);
          this.notificationService.showWarning(
            'Cannot connect to server. Using mock data instead.',
            'Connection Error'
          );
          // Return a mock record as fallback
          const record = this.mockRecords.find(r => r.UID === UID) || this.mockRecords[0];
          return of(record);
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
      isOffline: this._isOfflineMode
    });
    
    // If we're in offline mode, use mock data
    if (this._isOfflineMode) {
      this.logger.info('Using mock data generator in offline mode', { count });
      this.notificationService.showInfo(
        'Using locally generated mock data instead of server.',
        'Offline Mode'
      );
      this.mockRecords = this.generateMockRecords(count);
      this.recordGenerationTime = this.getMockGenerationTime();
      return of(this.mockRecords);
    }
    
    // Online mode - try to get data from API
    return this.apiService.get<Record[]>(`${this.baseUrl}/generate?count=${count}`, {
      timeout: this.REQUEST_TIMEOUT
    }).pipe(
      tap(records => {
        this.logger.debug(`Successfully retrieved ${records.length} records from API`);
        // If we got records successfully, ensure we're in online mode
        this.setOfflineMode(false);
      }),
      catchError(error => {
        this.logger.error('Failed to generate record set from API', { error, count });
        
        // If connection error, switch to offline mode and use mock data
        if (error.status === 0 || error.status === 504) {
          this.setOfflineMode(true);
          this.logger.warn('Connection error, switching to offline mode with mock data');
          
          this.notificationService.showWarning(
            'Server is unreachable. Using locally generated data instead.',
            'Connection Error'
          );
          
          // Generate and return mock data
          this.mockRecords = this.generateMockRecords(count);
          this.recordGenerationTime = this.getMockGenerationTime();
          return of(this.mockRecords);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets the time taken to generate records
   * @returns An observable of the generation time
   */
  getCreationTime(): Observable<number> {
    if (this._isOfflineMode) {
      this.logger.info('Using mock generation time in offline mode');
      return of(this.getMockGenerationTime());
    }
    
    return this.apiService.get<{ generationTime: number }>(`${this.baseUrl}/time`, {
      timeout: 5000 // Shorter timeout for this simple request
    }).pipe(
      map(response => response.generationTime),
      catchError(error => {
        if (error.status === 0 || error.status === 504) {
          // Switch to offline mode and use mock generation time
          this.setOfflineMode(true);
          this.notificationService.showWarning(
            'Cannot connect to server. Using mock timing data.',
            'Connection Error'
          );
          return of(this.getMockGenerationTime());
        }
        this.logger.error('Failed to fetch creation time', { error });
        return of(this.getMockGenerationTime());
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
  
  /**
   * Gets mock records for offline mode
   * @returns An array of mock records
   */
  public getMockRecords(): Record[] {
    if (this.mockRecords.length === 0) {
      // If no mock records exist, generate some
      this.mockRecords = this.generateMockRecords(100);
    }
    return this.mockRecords;
  }

  // Generate mock records for offline mode
  private generateMockRecords(count: number): Record[] {
    const mockRecords: Record[] = [];
    const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
    const cities = ['Los Angeles', 'Houston', 'Miami', 'New York', 'Philadelphia', 'Chicago', 'Columbus', 'Atlanta', 'Charlotte', 'Detroit'];
    const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
    
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const stateIndex = Math.floor(Math.random() * states.length);
      const state = states[stateIndex];
      const city = cities[stateIndex]; 
      const zipcode = `${10000 + Math.floor(Math.random() * 89999)}`;
      
      const salary = [];
      const companyCount = Math.floor(Math.random() * 3) + 1; // 1-3 companies
      for (let c = 0; c < companyCount; c++) {
        salary.push({
          UID: `COMP-${i}-${c}`,
          companyName: `MockCorp ${c + 1}`,
          employeeName: `${firstName} ${lastName}`,
          annualSalary: 70000 + Math.floor(Math.random() * 80000),
          companyPosition: 'Software Engineer'
        });
      }
      
      const phoneUID = `PHONE-${i + 10000}`;
      
      mockRecords.push({
        UID: `MOCK-${i + 10000}`,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        address: {
          street: `${1000 + i} Main St`,
          city,
          state,
          zipcode
        },
        city,
        state,
        zip: zipcode,
        phone: {
          UID: phoneUID,
          number: `(555) ${100 + Math.floor(Math.random() * 899)}-${1000 + Math.floor(Math.random() * 8999)}`,
          type: 'mobile'
        },
        salary: salary,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        birthDate: new Date(1960 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        registrationDate: new Date().toISOString(),
        // Add missing required properties
        avatar: null,
        flicker: null,
        totalHouseholdIncome: Math.floor(Math.random() * 150000) + 50000 // Random household income between 50k-200k
      });
    }
    
    this.logger.info(`Generated ${mockRecords.length} mock records for offline mode`);
    return mockRecords;
  }
  
  // Returns a simulated generation time for metrics when in offline mode
  private getMockGenerationTime(): number {
    return Math.random() * 100 + 50; // Random value between 50-150ms
  }
  
  /**
   * Checks network connectivity and resets offline mode if connectivity returns
   */
  public checkNetworkStatus(): Observable<boolean> {
    this.logger.debug('Checking network connectivity status...');
    
    return this.apiService.get<any>('health', {
      headers: { 'Cache-Control': 'no-cache' },
      timeout: 3000
    }).pipe(
      timeout(3000),
      map(() => {
        // If we can reach the server, reset offline mode
        this.setOfflineMode(false); // Use the method to ensure the subject is updated
        this.logger.info('Network connectivity restored');
        return true;
      }),
      catchError(error => {
        this.setOfflineMode(true); // Use the method to ensure the subject is updated
        this.logger.warn('Network connectivity check failed', { error });
        return of(false);
      })
    );
  }

  /**
   * Check if the service is currently in offline mode
   */
  isOfflineMode(): boolean {
    return this._isOfflineMode;
  }

  /**
   * Sets offline mode status and notifies subscribers
   */
  private setOfflineMode(isOffline: boolean): void {
    if (this._isOfflineMode !== isOffline) {
      this._isOfflineMode = isOffline;
      this.offlineStatusSubject.next(isOffline);
      
      if (isOffline) {
        this.logger.warn('Service entered offline mode', { 
          apiUrl: this.apiUrl,
          mode: 'offline'
        });
      } else {
        this.logger.info('Service entered online mode', {
          apiUrl: this.apiUrl,
          mode: 'online'
        });
      }
    }
  }
}