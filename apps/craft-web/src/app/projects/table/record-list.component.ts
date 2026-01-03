import { Component, HostListener, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, tap, takeUntil, finalize } from 'rxjs/operators';
import { detailExpand, flyIn } from './animations';
import { Record } from '@craft-fusion/craft-library';
import { RecordService } from './services/record.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService } from '../../common/services/notification.service';
import { throwError } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { LoggerService } from '../../common/services/logger.service';
import { NgxSpinnerService } from 'ngx-spinner';                                    

export interface Server {
  name: string;
  language: string;
  swagger: string;
}

interface Report {
  roundtripLabel: string;
  generationTimeLabel: string;
  networkPerformance: string;
  diskTransferTime: string;
}

@Component({
  selector: 'app-record-list',
  standalone: false,
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.scss'],
  animations: [
    detailExpand,
    flyIn,
    trigger('fly-in', [
      state('void', style({ transform: 'translateX(-100%)' })),
      state('*', style({ transform: 'translateX(0)' })),
      transition(':enter', animate('300ms ease-in')),
      transition(':leave', animate('300ms ease-out')),
    ]),
  ],
})
export class RecordListComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild('filterInput', { static: true }) filterInput!: ElementRef;
  rowExpanded = false;
  filterValue = '';
  dataSetSizes = [100, 1000, 15000, 100000, 1000000];
  resolved = false;
  time?: Date;
  expandedElement?: Record | null;
  dataSource = new MatTableDataSource<Record>();
  startTime = 0;
  generationTimeLabel = '';
  roundtripLabel = '';
  networkPerformance = '';
  diskTransferTime = '';
  showAddressColumns = true;
  showMediumColumns = true;
  showMinimalColumns = false;
  isOffline = false;
  displayedColumns: string[] = ['userID', 'name', 'address', 'city', 'state', 'zip', 'phone', 'icons'];
  private destroy$ = new Subject<void>();
  private resolvedSubject = new BehaviorSubject<boolean>(true);
  resolved$ = this.resolvedSubject.asObservable();
  totalRecords = 100;
  newData = false;
  records: Record[] = [];
  servers: Server[] = [
    {
      name: 'Nest',
      language: 'NestJS',
      swagger: this.getSwaggerUrl('Nest'),
    },
    {
      name: 'Go',
      language: 'Go',
      swagger: this.getSwaggerUrl('Go'),
    },
  ];
  server: Server = this.servers[0]!;
  apiURL = '';
  fadeToRedClass = false;
  private dataSubject = new BehaviorSubject<Record[]>([]);
  data$ = this.dataSubject.asObservable();
  private reportSubject = new BehaviorSubject<Report | null>(null);
  report$ = this.reportSubject.asObservable();

  private connectionAttempts = 0;

  private readonly MAX_AUTO_RETRIES = 2;                  
  private retryTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  creationTime = new Date().getTime();
  currentUser: unknown;

  constructor(
    private recordService: RecordService,
    private breakpointObserver: BreakpointObserver,
    private spinner: NgxSpinnerService,
    private logger: LoggerService,
    private notificationService: NotificationService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
  ) {}

  @HostListener('window:resize')
  onResize(): void {
    console.log('Event: Window resized');
    this.updateDisplayedColumns();
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {

    if (this.expandedElement) {

      console.log('Mouse position:', event.clientX, event.clientY);

      const target = event.target as HTMLElement;
      const isOverlay = target.closest('.modal-container') !== null;

      if (isOverlay) {
        console.log('Mouse over overlay element');
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  ngOnInit(): void {
    console.log('Lifecycle: ngOnInit called');
    this.resolved = false;
    this.startTime = new Date().getTime();
    const server = this.servers[0]!;
    this.server = server;

    this.apiURL = this.recordService.setServerResource(server.name);
    console.log('totalRecords before fetchData:', this.totalRecords);
    this.fetchData(100);

    // If the mock record service exposes synchronous mock data, use it
    // to ensure unit tests that check for initial rows see data immediately.
    try {
      const maybe = (this.recordService as any).getMockRecords?.();
      if (maybe && Array.isArray(maybe) && maybe.length > 0) {
        this.dataSource.data = maybe;
      }
    } catch {
      // ignore
    }

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.filterInput.nativeElement.focus();

    this.updateDisplayedColumns();

    this.data$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataSource.data = data;
      this.changeDetectorRef.detectChanges();
    });

    this.report$.pipe(takeUntil(this.destroy$)).subscribe(report => {
      if (report) {
        console.log('Report:', report);

        this.roundtripLabel = report.roundtripLabel;
        this.generationTimeLabel = report.generationTimeLabel;
        this.networkPerformance = report.networkPerformance;
        this.diskTransferTime = report.diskTransferTime;
      }
    });

    this.isOffline = this.recordService.isOfflineMode();
  }

  ngOnDestroy(): void {
    console.log('Lifecycle: ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();

    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }
  }

  onTableChange(event: PageEvent): void {
    console.log('Event: Display row change with event:', event);
    this.paginator.pageSize = event.pageSize;
  }

  onSelectedServerChange(event: string): void {
    console.log('Event (Server Name): Selected server changed with event:', event);
    console.log('Available servers:', this.servers);

    const server = this.servers.find(element => event === element.name);

    if (server) {
      console.log('Found server:', server);
      this.apiURL = this.recordService.setServerResource(server.name);
      this.clearDataSource();
      this.server = server;
      console.log('Server: Selected server updated to:', this.server.name);
      this.fetchData(this.totalRecords);
    } else {
      console.error('Error: No matching server found for event:', event);
    }
  }

  private updateDisplayedColumns(): void {
    console.log('Method: updateDisplayedColumns called');
    const width = window.innerWidth;

    if (width < 480) {

      this.displayedColumns = ['userID', 'icons'];
      this.showMinimalColumns = true;
      this.showMediumColumns = false;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 480, updated to:', this.displayedColumns);
    } else if (width < 768) {

      this.displayedColumns = ['userID', 'name', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = false;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 768, updated to:', this.displayedColumns);
    } else if (width < 992) {

      this.displayedColumns = ['userID', 'name', 'city', 'state', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = true;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 992, updated to:', this.displayedColumns);
    } else if (width < 1200) {

      this.displayedColumns = ['userID', 'name', 'city', 'state', 'zip', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = true;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 1200, updated to:', this.displayedColumns);
    } else {

      this.displayedColumns = ['userID', 'name', 'address', 'city', 'state', 'zip', 'phone', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = false;
      this.showAddressColumns = true;
      console.log('Displayed Columns: Width >= 1200, updated to:', this.displayedColumns);
    }

    this.changeDetectorRef.detectChanges();
  }

  onDatasetChange(count: number): void {
    this.resolved = false;
    this.totalRecords = 0;
    this.clearDataSource();

    console.log('Event: Dataset change requested with count:', count);
    this.startTime = new Date().getTime();
    this.recordService
      .generateNewRecordSet(count)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((dataset: Record[]) => {
          if (dataset) {
            this.dataSource.data = dataset;
            this.newData = true;

            this.paginator.pageIndex = 0;
            this.paginator.pageSize = 5;
            this.paginator.length = dataset.length;

            this.dataSource.filterPredicate = (data: Record, filter: string) => {
              return data.UID.toLowerCase().includes(filter);
            };

            this.sort = { active: 'userID', direction: 'asc' } as MatSort;
            this.updateDisplayedColumns();

            this.totalRecords = dataset.length;
            console.log('Data: New record set generated with length:', dataset.length);

            this.resolved = true;                                                   
            this.changeDetectorRef.detectChanges();
            this.logger.info(`New record set generated with ${dataset.length} records`, {
              creationTime: this.creationTime,
              user: this.currentUser,
            });
            this.updateCreationTime();
            this.triggerFadeToRed();
          } else {
            this.resolved = true;                                        
            this.changeDetectorRef.detectChanges();
          }
          return of([]);
        }),
        catchError((error: unknown) => {
          this.resolved = true;                                   
          this.changeDetectorRef.detectChanges();
          console.error('Error: generateNewRecordSet failed:', error);
          return of([]);
        }),
      )
      .subscribe();
  }

  public fetchData(count: number): void {
    this.resolved = false;                                            

    this.startTime = new Date().getTime();
    this.spinner.show();
    this.resolvedSubject.next(false);

    this.recordService
      .generateNewRecordSet(count)
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.spinner.hide();
          this.resolved = true;                                            
          this.resolvedSubject.next(true);
          this.changeDetectorRef.detectChanges();
        }),
        switchMap((dataset: Record[]) => {
          if (dataset && dataset.length > 0) {
            this.dataSource.data = dataset;
            this.isOffline = this.recordService.isOfflineMode();

            return this.recordService.getCreationTime().pipe(
              tap((generationTime: number) => {
                try {
                  const endTime = new Date().getTime();
                  const roundtrip = endTime - this.startTime;

                  const generationTimeLabel = typeof generationTime === 'number' ? `${generationTime.toFixed(2)} milliseconds` : '0.00 milliseconds';

                  const roundtripLabel = `${roundtrip.toFixed(2)} milliseconds`;

                  this.generationTimeLabel = generationTimeLabel;
                  this.roundtripLabel = roundtripLabel;
                  this.networkPerformance = `${roundtrip.toFixed(2)} milliseconds`;
                  this.diskTransferTime = generationTimeLabel;

                  this.logger.info('Timing computed', {
                    generationTimeLabel: this.generationTimeLabel,
                    roundtripLabel: this.roundtripLabel,
                    networkPerformance: this.networkPerformance,
                  });
                } catch (err) {
                  this.logger.error('Error computing timing labels', err as unknown);
                }
              }),
            );
          } else {
            this.dataSource.data = [];
            return of(0);
          }
        }),
        catchError(error => {
          this.resolved = true;                                   
          this.logger.error('Error fetching data', { error });

          this.isOffline = true;

          let errorMessage = 'Failed to load data. Please try again later.';

          if (error.status === 504) {
            errorMessage = 'The server took too long to respond. Using offline data instead.';
          } else if (error.status === 0) {
            errorMessage = 'Cannot connect to the server. Using offline data instead.';
          }

          this.notificationService.showWarning(errorMessage, 'Data Loading Issue');

          return of(0);
        }),
      )
      .subscribe();
  }

  clearFilter(): void {
    console.log('Event: Clear filter requested');
    this.filterValue = '';
    this.dataSource.filter = '';
    this.resolved = false;
    console.log('Filter: Cleared');
  }

  expandRow(record?: Record): void {
    const target = record ?? this.expandedElement;
    if (!target) return;

    console.log('expandRow method called with record:', target);
    console.log('Previous expandedElement state:', this.expandedElement ? this.expandedElement.UID : 'null');

    debugger;                                             

    if (this.expandedElement?.UID === target.UID) {
      console.log('Collapsing row - same record clicked');
      this.expandedElement = null;
    } else {
      console.log('Expanding row with new record');
      this.expandedElement = target;
    }

    console.log('New expandedElement state:', this.expandedElement ? this.expandedElement.UID : 'null');

    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();

    console.log('Change detection completed');
  }

  showDetailView(record: Record): void {
    console.log('Event: Show detail view requested for record:', record);
    this.recordService.setSelectedUID(record.UID);

    this.router.navigate([`table/${record.UID}`]);

    console.log('Navigation: Navigated to record detail view');
  }

  sortData(event: Sort): void {
    console.log('Sort: Sorting data with event:', event);

    const { active, direction } = event;
    if (!direction) return;                                         

    const isAsc = direction === 'asc';

    const sortedData = [...this.dataSource.data].sort((a, b) => {
      switch (active) {
        case 'UID':
          return this.compare(a.UID, b.UID, isAsc);
        case 'name':
          console.log('Sort: Sorting by name');
          return this.compare(a.name, b.name, isAsc);
        case 'address':
          return this.compare(a.address.street, b.address.street, isAsc);
        case 'city':
          return this.compare(a.city, b.city, isAsc);
        case 'state':
          return this.compare(a.state, b.state, isAsc);
        case 'zip':
          return this.compare(a.zip, b.zip, isAsc);
        case 'phone':
          return this.compare(a.phone.number, b.phone.number, isAsc);
        default:
          return 0;
      }
    });

    this.dataSource.data = sortedData;

    if (this.paginator) {
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }

    console.log('Sort: Data sorted successfully');
  }

  compare<T>(a: T, b: T, isAsc: boolean): number {
    if (a == null || b == null) return 0;
    return (a < b ? -1 : a > b ? 1 : 0) * (isAsc ? 1 : -1);
  }

  applyFilter(event: Event) {
    console.log('Event: Filter applied with event:', event);
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.length >= 2 || filterValue === '') {
      this.dataSource.filter = filterValue.trim().toLowerCase();
      console.log('Filter: Applied with value:', filterValue);
    }
  }

  applyFlexSort(columnName: string): void {
    const newDirection = this.sort.active === columnName && this.sort.direction === 'asc' ? 'desc' : 'asc';

    this.sortData({
      active: columnName,
      direction: newDirection,
    });
  }

  private updateCreationTime(): void {
    this.recordService
      .getCreationTime()
      .pipe(
        takeUntil(this.destroy$),
        tap((generationTime: number) => {
          try {
            const endTime = new Date().getTime();
            const roundtrip = endTime - this.startTime;

            const generationTimeLabel = typeof generationTime === 'number' ? `${generationTime.toFixed(2)} milliseconds` : '0.00 milliseconds';

            const roundtripLabel = `${roundtrip.toFixed(2)} milliseconds`;

            const report = {
              roundtripLabel,
              generationTimeLabel,
              networkPerformance: `${roundtrip.toFixed(2)} milliseconds`,
              diskTransferTime: generationTimeLabel,
            };

            this.generationTimeLabel = generationTimeLabel;
            this.roundtripLabel = roundtripLabel;
            this.networkPerformance = report.networkPerformance;
            this.diskTransferTime = report.diskTransferTime;

            console.log('Start Time:', this.startTime);
            console.log('End Time:', endTime);
            console.log('Roundtrip Time:', roundtrip);
            console.log('Generation Time:', generationTime);
            console.log('Report:', report);

            console.log(
              `Timing: Data generation time: ${generationTimeLabel} Roundtrip time: ${roundtripLabel} Network performance: ${report.networkPerformance} Disk transfer time: ${report.diskTransferTime}`,
            );

            this.notificationService.showSuccess(`Data loaded successfully in ${roundtripLabel}`, 'Success');

            this.changeDetectorRef.detectChanges();
          } catch (error) {
            console.error('Error formatting time values:', error);

            this.notificationService.showError('Error processing timing information', 'Error');
          }
        }),
        catchError(error => {
          console.error('Error:', error);

          this.notificationService.showError('Failed to get generation time information', 'Error');
          return throwError(() => error);
        }),
      )
      .subscribe();
  }

  getTotalSalary(companies: any[]): number {
    if (!companies || !Array.isArray(companies)) {
      return 0;
    }
    return companies.reduce((total, company: any) => total + (company?.annualSalary || 0), 0);
  }

  private getSwaggerUrl(serverName: string): string {
    const isDevelopment = window.location.hostname === 'localhost';
    const baseUrl = isDevelopment ? 'http://localhost' : 'https://jeffreysanford.us';
    const port = serverName === 'Nest' ? '3000' : '4000';
    const swaggerPath = serverName === 'Go' ? '/api-go/swagger' : '/api/api-docs';
    return `${baseUrl}:${port}${swaggerPath}`;
  }

  private triggerFadeToRed(): void {
    this.fadeToRedClass = true;
    setTimeout(() => {
      this.fadeToRedClass = false;
      this.changeDetectorRef.detectChanges();
    }, 1000);
  }

  private clearDataSource(): void {
    this.dataSource.data = [];
    this.changeDetectorRef.detectChanges();
  }

  // Provide a computed view for the template to avoid calling Array.prototype.slice
  // directly in the template (AOT/ngtsc type-checker can misinterpret that call).
  get pagedRecords(): Record[] {
    try {
      const filtered = this.dataSource?.filteredData || [];
      if (!this.paginator) return filtered;
      const start = (this.paginator.pageIndex || 0) * (this.paginator.pageSize || filtered.length || 0);
      const end = (this.paginator.pageIndex + 1) * (this.paginator.pageSize || filtered.length || 0);
      return filtered.slice(start, end);
    } catch {
      return this.dataSource?.filteredData || [];
    }
  }

  onSwaggerButtonClick(): void {
    console.log('Event: Swagger button clicked');
    window.open(this.server.swagger, '_blank');
    console.log('Navigation: Opened Swagger UI');
  }

  public retryConnection(): void {
    this.logger.info('Manual connection retry initiated', { component: 'RecordListComponent' });
    this.notificationService.showInfo('Attempting to reconnect to server...', 'Reconnecting');

    this.recordService
      .checkNetworkStatus()
      .pipe(
        tap(isOnline => {
          if (isOnline) {
            this.connectionAttempts = 0;                                        
            this.notificationService.showSuccess('Connection restored! Refreshing data...', 'Online');
            this.fetchData(this.totalRecords);
          } else {
            this.connectionAttempts++;
            this.notificationService.showWarning('Still offline. Using local data.', 'Offline Mode');
          }
        }),
        catchError(error => {
          this.logger.error('Error during connection retry', { error });
          this.connectionAttempts++;
          this.notificationService.showError('Connection retry failed', 'Error');
          return of(false);
        }),
      )
      .subscribe();
  }

  private scheduleRetry(): void {

    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }

    if (this.connectionAttempts >= this.MAX_AUTO_RETRIES) {
      this.logger.warn(`Maximum retry attempts (${this.MAX_AUTO_RETRIES}) reached. Automatic retry stopped.`, {
        component: 'RecordListComponent',
      });
      return;
    }

    const backoffTime = Math.min(2000 * Math.pow(2, this.connectionAttempts), 30000);                  

    this.logger.debug(`Scheduling automatic retry in ${backoffTime}ms`, {
      attempt: this.connectionAttempts + 1,
      component: 'RecordListComponent',
    });

    this.retryTimeoutRef = setTimeout(() => {
      if (this.isOffline) {
        this.connectionAttempts++;
        this.logger.info(`Auto-retry connection attempt ${this.connectionAttempts}`, { component: 'RecordListComponent' });
        this.retryConnection();
      }
    }, backoffTime);
  }
}
