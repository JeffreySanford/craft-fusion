import { Component, HostListener, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, tap, takeUntil } from 'rxjs/operators';
import { detailExpand, flyIn } from './animations';
import { Record } from './models/record';
import { RecordService } from './record.service';
import { MenuItem } from '@craft-web/pages/sidebar/sidebar.types';

export interface Server {
  name: string;
  language: string;
  api: string;
  port: number;
  swagger: string;
}

@Component({
  selector: 'app-record-list',
  templateUrl: './record-list.component.html',
  styleUrls: ['./record-list.component.scss'],
  animations: [detailExpand, flyIn],
})
export class RecordListComponent implements OnInit, OnDestroy, AfterContentChecked {
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
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
  protected servers: Server[] = [
    {
      name: 'Nest',
      language: 'NestJS (node.js)',
      api: '/api',
      port: 3000,
      swagger: '/api/swagger',
    },
    {
      name: 'Go',
      language: 'Go',
      api: '/api/go',
      port: 4000,
      swagger: '/api/go/swagger',
    },
  ];
  selectedServer = this.servers[0];

  constructor(private router: Router, private recordService: RecordService, private changeDetectorRef: ChangeDetectorRef) {
    console.log('Constructor: RecordListComponent created');
    console.log('Initial servers:', this.servers);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    console.log('Event: Window resized');
    this.updateDisplayedColumns();
  }

  ngOnInit(): void {
    console.log('Lifecycle: ngOnInit called');
    this.resolved = false;
    this.startTime = new Date().getTime();
    this.recordService
      .generateNewRecordSet(100)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((dataset: Record[]) => {
          if (dataset) {
            this.dataSource.data = dataset;
            this.totalRecords = dataset.length;
            this.resolved = true;
            this.newData = true;

            console.log('Data: New record set generated with length:', dataset.length);

            this.updateCreationTime();
          }
          return of([]); // Ensure an Observable is returned
        }),
        catchError(error => {
          console.error('Error: generateNewRecordSet failed:', error);
          this.resolvedSubject.next(true);
          this.changeDetectorRef.detectChanges();
          return of([]); // Ensure an Observable is returned
        }),
      )
      .subscribe();
  }

  ngAfterContentChecked(): void {
    if (this.resolved && this.dataSource.data.length > 0 && this.newData) {
      console.log('Lifecycle: ngAfterContentChecked called');
      if (this.sort && this.paginator) {
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.changeDetectorRef.detectChanges();
        this.updateDisplayedColumns();
        this.newData = false;
      }
    }
  }

  ngOnDestroy(): void {
    console.log('Lifecycle: ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDisplayRowChange(event: PageEvent): void {
    console.log('Event: Display row change with event:', event);
    if (this.paginator) {
      this.paginator.pageIndex = event.pageIndex;
      this.paginator.pageSize = event.pageSize;
      this.paginator.length = event.length;

      if (this.dataSource.paginator && event.pageSize !== this.dataSource.paginator.pageSize) {
        this.dataSource.paginator = this.paginator;
        console.log('Paginator: Updated with pageIndex:', event.pageIndex, 'pageSize:', event.pageSize, 'length:', event.length);
      }
    }
  }

  onSelectedServerChange(event: string): void {
    console.log('Event: Selected server changed with event:', event);
    console.log('Available servers:', this.servers);

    const server = this.servers.find(element => event === element.language);

    if (server) {
      console.log('Found server:', server);
      this.recordService.setServerResource(server.api);
      this.dataSource.data = [];
      this.onDatasetChange(this.totalRecords);
      this.selectedServer = server;
      console.log('Server: Selected server updated to:', this.selectedServer.name);
      console.log('API Endpoint:', this.selectedServer.api);
    } else {
      console.error('Error: No matching server found for event:', event);
    }
  }

  private updateDisplayedColumns(): void {
    console.log('Method: updateDisplayedColumns called');
    const width = window.innerWidth;

    if (width < 800) {
      this.displayedColumns = ['userID', 'icons'];
      console.log('Displayed Columns: Width < 800, updated to:', this.displayedColumns);
    } else if (width < 900) {
      this.displayedColumns = ['userID', 'name', 'icons'];
      console.log('Displayed Columns: Width < 900, updated to:', this.displayedColumns);
    } else if (width < 1000) {
      this.displayedColumns = ['userID', 'name', 'icons'];
      console.log('Displayed Columns: Width < 1000, updated to:', this.displayedColumns);
    } else if (width < 1200) {
      this.displayedColumns = ['userID', 'name', 'state', 'zip', 'icons'];
      console.log('Displayed Columns: Width < 1200, updated to:', this.displayedColumns);
    } else if (width < 1400) {
      this.displayedColumns = ['userID', 'name', 'city', 'state', 'zip', 'icons'];
      console.log('Displayed Columns: Width < 1400, updated to:', this.displayedColumns);
    } else {
      this.displayedColumns = ['userID', 'name', 'address', 'city', 'state', 'zip', 'phone', 'icons'];
      console.log('Displayed Columns: Width >= 1400, updated to:', this.displayedColumns);
    }
  }

  onDatasetChange(count: number): void {
    debugger;
    this.resolved = false;
    this.totalRecords = 0;

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

            this.dataSource.filterPredicate = (data: Record, filter: string) => {
              return data.UID.toLowerCase().includes(filter);
            };

            this.sort = { active: 'userID', direction: 'asc' } as MatSort;
            this.updateDisplayedColumns();

            this.totalRecords = dataset.length;
            console.log('Data: New record set generated with length:', dataset.length);

            this.updateCreationTime();
          }
          return of([]);
        }),
        catchError(error => {
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
    console.log('Event: Row expand requested for record:', record);
    this.expandedElement = this.expandedElement?.UID === record.UID ? null : record;
    console.log('Row: Expanded state updated');
  }

  showDetailView(record: Record): void {
    console.log('Event: Show detail view requested for record:', record);
    this.recordService.setSelectedUID(record.UID);
    this.router.navigate(['table/:', record.UID]);
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
  
  private updateCreationTime(): void {
    this.recordService
      .getCreationTime()
      .pipe(
        takeUntil(this.destroy$),
        tap((generationTime: number) => {
          const endTime = new Date().getTime();
          const roundtrip = endTime - this.startTime;
          this.roundtripLabel = roundtrip > 1000 ? `${(roundtrip / 1000).toFixed(2)} seconds` : `${roundtrip.toFixed(2)} milliseconds`;
          this.generationTimeLabel = generationTime > 1000 ? `${(generationTime / 1000).toFixed(2)} seconds` : `${generationTime.toFixed(2)} milliseconds`;
          console.log('Timing: Data generation time:', this.generationTimeLabel, 'Roundtrip time:', this.roundtripLabel);
          this.resolvedSubject.next(true);
          console.log('Resolved: Subject updated');
          this.changeDetectorRef.detectChanges();
        }),
        catchError(error => {
          console.error('Error: getCreationTime failed:', error);
          this.resolvedSubject.next(true);
          this.changeDetectorRef.detectChanges();
          return of('');
        }),
      )
      .subscribe();
  }
}
