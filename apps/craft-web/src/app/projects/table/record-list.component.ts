import { Component, HostListener, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, tap, takeUntil } from 'rxjs/operators';
import { detailExpand, flyIn } from './animations';
import { Record } from './models/record';
import { RecordService } from './record.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
      transition(':leave', animate('300ms ease-out'))
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
  server: Server = this.servers[0];
  apiURL = '';
  fadeToRedClass = false;
  private dataSubject = new BehaviorSubject<Record[]>([]);
  data$ = this.dataSubject.asObservable();
  private reportSubject = new BehaviorSubject<Report | null>(null);
  report$ = this.reportSubject.asObservable();

  constructor(private router: Router, private recordService: RecordService, private changeDetectorRef: ChangeDetectorRef) {
    console.log('Constructor: RecordListComponent created');
    console.log('Initial servers:', this.servers);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    console.log('Event: Window resized');
    this.updateDisplayedColumns();
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    // If an element is expanded, track mouse position
    if (this.expandedElement) {
      // Log mouse position to debug overlay following cursor
      console.log('Mouse position:', event.clientX, event.clientY);
      
      // Only prevent default if we're over the overlay elements
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
    const server = this.servers[0];
    this.server = server;

    this.apiURL = this.recordService.setServerResource(server.name);
    this.fetchData(100);

    // Set up paginator and sort
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Set focus on the filter input field
    this.filterInput.nativeElement.focus();

    // Update displayed columns based on current window width
    this.updateDisplayedColumns();

    // Subscribe to the data$ observable to update the dataSource
    this.data$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataSource.data = data;
      this.changeDetectorRef.detectChanges();
    });

    // Subscribe to the report$ observable to get the report object
    this.report$.pipe(takeUntil(this.destroy$)).subscribe(report => {
      if (report) {
        console.log('Report:', report);
        // You can use the report object here
        this.roundtripLabel = report.roundtripLabel;
        this.generationTimeLabel = report.generationTimeLabel;
        this.networkPerformance = report.networkPerformance;
        this.diskTransferTime = report.diskTransferTime;
      }
    });
  }

  ngOnDestroy(): void {
    console.log('Lifecycle: ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // tABLE PAGEsIZE HAS BEEN CHANGED
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

    // Recalculate column sets based on screen width with adjusted breakpoints
    if (width < 480) {
      // Very small screens - only ID and actions
      this.displayedColumns = ['userID', 'icons'];
      this.showMinimalColumns = true;
      this.showMediumColumns = false;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 480, updated to:', this.displayedColumns);
    } else if (width < 768) {
      // Small screens - ID, name and actions
      this.displayedColumns = ['userID', 'name', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = false;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 768, updated to:', this.displayedColumns);
    } else if (width < 992) {
      // Medium screens - add city, state instead of full address
      this.displayedColumns = ['userID', 'name', 'city', 'state', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = true;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 992, updated to:', this.displayedColumns);
    } else if (width < 1200) {
      // Medium-large screens - add zip
      this.displayedColumns = ['userID', 'name', 'city', 'state', 'zip', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = true;
      this.showAddressColumns = false;
      console.log('Displayed Columns: Width < 1200, updated to:', this.displayedColumns);
    } else {
      // Large screens - show full address column as well
      this.displayedColumns = ['userID', 'name', 'address', 'city', 'state', 'zip', 'phone', 'icons'];
      this.showMinimalColumns = false;
      this.showMediumColumns = false;
      this.showAddressColumns = true;
      console.log('Displayed Columns: Width >= 1200, updated to:', this.displayedColumns);
    }

    // Notify Angular that the display has changed
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
            this.resolved = true;
            this.newData = true;

            this.paginator.pageIndex = 0;
            this.paginator.pageSize = 5;
            this.paginator.length = dataset.length;
            this.changeDetectorRef.detectChanges();

            this.dataSource.filterPredicate = (data: Record, filter: string) => {
              return data.UID.toLowerCase().includes(filter);
            };

            this.sort = { active: 'userID', direction: 'asc' } as MatSort;
            this.updateDisplayedColumns();

            this.totalRecords = dataset.length;
            console.log('Data: New record set generated with length:', dataset.length);

            this.updateCreationTime();
            this.triggerFadeToRed();
          }
          return of([]);
        }),
        catchError((error: any) => {
          console.error('Error: generateNewRecordSet failed:', error);
          this.resolvedSubject.next(true);
          this.changeDetectorRef.detectChanges();
          return of([]);
        }),
      )
      .subscribe();
  }

  private fetchData(count: number): void {
    this.recordService
      .generateNewRecordSet(count)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((dataset: Record[]) => {
          if (dataset) {
            this.dataSource.data = dataset;
            this.resolved = true;
            this.newData = true;

            this.paginator.length = dataset.length;

            this.dataSource.filterPredicate = (data: Record, filter: string) => {
              return data.UID.toLowerCase().includes(filter);
            };

            this.sort = { active: 'userID', direction: 'asc' } as MatSort;
            this.updateDisplayedColumns();

            this.totalRecords = dataset.length;
            console.log('Data: New record set generated with length:', dataset.length);

            this.updateCreationTime();
            this.triggerFadeToRed();
            this.changeDetectorRef.detectChanges();
          }
          return of([]);
        }),
        catchError((error: any) => {
          console.error('Error: generateNewRecordSet failed:', error);
          this.resolvedSubject.next(true);
          this.changeDetectorRef.detectChanges();
          return of([]);
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

  expandRow(record: Record): void {
    console.log('expandRow method called with record:', record);
    console.log('Previous expandedElement state:', this.expandedElement ? this.expandedElement.UID : 'null');
    
    debugger; // Debugger statement for browser inspection
    
    // Toggle expandedElement
    if (this.expandedElement?.UID === record.UID) {
      console.log('Collapsing row - same record clicked');
      this.expandedElement = null;
    } else {
      console.log('Expanding row with new record');
      this.expandedElement = record;
    }
    
    console.log('New expandedElement state:', this.expandedElement ? this.expandedElement.UID : 'null');
    
    // Force a detection cycle to ensure UI updates
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
    
    console.log('Change detection completed');
  }

  showDetailView(record: Record): void {
    console.log('Event: Show detail view requested for record:', record);
    this.recordService.setSelectedUID(record.UID);

    // Fix: Update navigation route to match defined routes in app.routes.ts
    // The route is defined as 'table/:id' so we should use the proper format
    this.router.navigate([`table/${record.UID}`]);

    console.log('Navigation: Navigated to record detail view');
  }

  sortData(event: Sort): void {
    console.log('Sort: Sorting data with event:', event);

    const { active, direction } = event;
    if (!direction) return; // No sorting direction means no sorting

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

    // Update the dataSource with new sorted data
    this.dataSource.data = sortedData;

    // Refresh the paginator
    if (this.paginator) {
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }

    console.log('Sort: Data sorted successfully');
  }

  // Strongly typed comparison function
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
      direction: newDirection
    });
  }

  private updateCreationTime(): void {
    this.recordService
      .getCreationTime()
      .pipe(
        takeUntil(this.destroy$),
        tap((generationTime: number) => {
          const endTime = new Date().getTime();
          const roundtrip = endTime - this.startTime;
          const roundtripLabel = roundtrip > 1000 ? `${(roundtrip / 1000).toFixed(2)} seconds` : `${roundtrip.toFixed(2)} milliseconds`;
          const generationTimeLabel = generationTime > 1000 ? `${(generationTime / 1000).toFixed(2)} seconds` : `${generationTime.toFixed(2)} milliseconds`;
          const networkPerformance = `${(roundtrip - generationTime).toFixed(2)} milliseconds`;
          const diskTransferTime = `${(generationTime / 2).toFixed(2)} milliseconds`;

          const report: Report = { roundtripLabel, generationTimeLabel, networkPerformance, diskTransferTime };

          console.log('Start Time:', this.startTime);
          console.log('End Time:', endTime);
          console.log('Roundtrip Time:', roundtrip);
          console.log('Generation Time:', generationTime);
          this.reportSubject.next(report);

          console.log(
            'Timing: Data generation time:',
            generationTimeLabel,
            'Roundtrip time:',
            roundtripLabel,
            'Network performance:',
            networkPerformance,
            'Disk transfer time:',
            diskTransferTime,
          );
          this.resolvedSubject.next(true);
          this.changeDetectorRef.detectChanges();
        }),
        catchError((error: any) => {
          console.error('Error: getCreationTime failed:', error);
          this.resolvedSubject.next(true);
          this.changeDetectorRef.detectChanges();
          return of('');
        }),
      )
      .subscribe();
  }

  private getSwaggerUrl(serverName: string): string {
    const isDevelopment = window.location.hostname === 'localhost';
    const baseUrl = isDevelopment ? 'http://localhost' : 'https://jeffreysanford.us';
    const port = serverName === 'Nest' ? '3000' : '4000';
    return `${baseUrl}:${port}/api/api-docs`;
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

  onSwaggerButtonClick(): void {
    console.log('Event: Swagger button clicked');
    window.open(this.server.swagger, '_blank');
    console.log('Navigation: Opened Swagger UI');
  }
}
