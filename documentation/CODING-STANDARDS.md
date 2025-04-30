# Craft Fusion Coding Standards

## Angular Guidelines

- **NEVER use standalone components** - They introduce many errors and compatibility issues. All components must be part of an NgModule.
- Always use NgModule-based architecture for all components.
- Always maintain `standalone: false` for all components. This is the required configuration.
- Components must always be declared within their respective NgModules.
- **Never use CUSTOM_ELEMENTS_SCHEMA** - Always properly import required Angular Material modules in the NgModule.
- Leverage Angular dependency injection for services.
- Implement lazy loading for all feature modules.
- Use resolvers for preloading necessary data before route activation.
- Follow reactive forms approach instead of template-driven forms for complex scenarios.

### Component Configuration Example

```typescript
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  standalone: false  // CRITICAL: Must always be explicitly set to false for all components
})
export class ExampleComponent implements OnInit {
  // Component implementation
  constructor() {}

  ngOnInit(): void {}
}
```

### Module Configuration Example

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module'; // Example shared module
import { ExampleComponent } from './example.component';
import { OtherComponent } from './other.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    ExampleComponent,  // Always declare components here
    OtherComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatButtonModule,  // Explicitly import all needed Angular Material modules
    MatIconModule     // rather than using CUSTOM_ELEMENTS_SCHEMA
  ],
  exports: [
    ExampleComponent  // Export components intended for use outside this module
  ]
})
export class FeatureModule { }
```

## Real-Time Communication Standards

### Socket.IO Implementation

When implementing Socket.IO functionality, follow these standards:

```typescript
// Backend Socket Emission (NestJS)
import { Injectable } from '@nestjs/common';
import { SocketService } from '../socket/socket.service'; // Assuming SocketService exists

@Injectable()
export class DataService {
  constructor(private socketService: SocketService) {}

  updateData(data: any): void {
    // Process data
    // ...

    // Emit to clients - use specific, namespaced event names
    this.socketService.emitToAll('data:update', data);
  }
}

// Frontend Socket Reception (Angular)
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { SocketClientService } from './socket-client.service'; // Assuming SocketClientService exists
import { DataType } from '../models/data-type.model'; // Assuming DataType model exists

@Injectable({
  providedIn: 'root'
})
export class DataFacade implements OnDestroy {
  private dataSubject = new BehaviorSubject<DataType[]>([]);
  readonly data$ = this.dataSubject.asObservable();
  private destroyed$ = new Subject<void>();

  constructor(private socketClient: SocketClientService) {
    // Subscribe to socket events
    this.socketClient.on<DataType[]>('data:update')
      .pipe(
        takeUntil(this.destroyed$),
        // Compare stringified versions for deep equality check if needed
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(data => {
        this.dataSubject.next(data);
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
```

### When to Use Sockets vs. HTTP

| Data Characteristic          | Recommended Approach        | Rationale                                           |
|------------------------------|-----------------------------|-----------------------------------------------------|
| High frequency updates       | Socket.IO                   | Efficient for real-time, continuous data streams    |
| Large initial dataset        | HTTP + Socket for updates   | Load bulk data via HTTP, push changes via Socket.IO |
| User-specific updates        | Socket.IO with rooms/users  | Target specific clients without broadcasting        |
| Infrequent updates           | Traditional HTTP (Polling)  | Simpler, less overhead for non-real-time data       |
| Critical transactions        | HTTP with confirmation      | Ensures delivery and allows for transactional logic |
| Collaborative features       | Socket.IO                   | Essential for real-time multi-user interactions     |
| Server-sent events (SSE)     | HTTP (SSE)                  | Suitable for one-way server-to-client push          |

### Socket Event Naming Conventions

Socket events should use a consistent, namespaced approach with colon separators to avoid collisions and improve clarity:

- **Format:** `domain:entity:action`
- **Examples:**
  - `chat:message:new`
  - `user:profile:updated`
  - `order:status:changed`
  - `admin:logs:stream`
  - `finance:stock:priceUpdate`

See [SOCKET-SERVICES.md](./services/SOCKET-SERVICES.md) for more detailed implementation guidelines and best practices related to WebSocket communication.

## Large Dataset Handling

### Server-Side vs. Client-Side Rendering

For optimal performance with large datasets, follow these guidelines:

- For datasets under 100,000 records: Use client-side rendering with full dataset loaded
- For datasets over 100,000 records: Use server-side rendering with pagination
  
### Implementation Pattern

```typescript
// Backend Service (NestJS)
@Injectable()
export class RecordService {
  async getRecords(page: number, pageSize: number, total: number): Promise<RecordResponse> {
    // If total exceeds threshold, use server-side pagination
    if (total > 100000) {
      return this.getServerSidePaginatedRecords(page, pageSize);
    }
    
    // Otherwise, return full dataset for client-side handling
    return this.getAllRecords(total);
  }
  
  private async getServerSidePaginatedRecords(page: number, pageSize: number): Promise<RecordResponse> {
    // Calculate offset
    const skip = page * pageSize;
    
    // Fetch only the required chunk from database
    const records = await this.recordRepository.find({
      take: pageSize,
      skip: skip,
      order: { id: 'ASC' }
    });
    
    // Get total count for pagination info
    const totalCount = await this.recordRepository.count();
    
    return {
      records,
      totalCount,
      serverSidePagination: true
    };
  }
  
  private async getAllRecords(total: number): Promise<RecordResponse> {
    // Generate or fetch all records
    const records = await this.generateMockRecords(total);
    
    return {
      records,
      totalCount: records.length,
      serverSidePagination: false
    };
  }
}

// Angular Component
@Component({...})
export class RecordListComponent implements OnInit {
  // Properties
  dataSource: MatTableDataSource<Record> | null = null;
  serverSidePagination = false;
  
  // Handle pagination
  onTableChange(event: PageEvent): void {
    if (this.serverSidePagination) {
      // For server-side pagination, fetch only the required page
      this.recordService.getRecords(event.pageIndex, event.pageSize, this.totalRecords)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          this.dataSource.data = response.records;
        });
    } else {
      // For client-side pagination, Angular Material handles it automatically
      // No additional action required
    }
  }
  
  // Switch between servers or dataset sizes
  onDatasetChange(size: number): void {
    this.totalRecords = size;
    this.serverSidePagination = size > 100000;
    
    // Reset to first page when changing dataset size
    if (this.paginator) {
      this.paginator.firstPage();
    }
    
    // Fetch records with new parameters
    this.fetchRecords();
  }
}
```
