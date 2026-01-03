import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordListComponent } from './record-list.component';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Record } from '@craft-fusion/craft-library';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { RecordService } from './services/record.service';
import { NotificationService } from '../../common/services/notification.service';
import { LoggerService } from '../../common/services/logger.service';
import {
  MockRecordService,
  MockBreakpointObserver,
  MockSpinnerService,
  MockNotificationService,
  MockLoggerService,
  MockChangeDetectorRef,
  mockRouter,
} from '../../testing/test-mocks';

@Component({
  selector: 'app-record-detail',
  template: '<div></div>',
  standalone: false,
})
class MockRecordDetailComponent {
  @Input() user?: Record;
}

describe('RecordListComponent', () => {
  let component: RecordListComponent;
  let fixture: ComponentFixture<RecordListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecordListComponent, MockRecordDetailComponent],
      imports: [
        FormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
      ],
      providers: [
        { provide: RecordService, useClass: MockRecordService },
        { provide: BreakpointObserver, useClass: MockBreakpointObserver },
        { provide: NgxSpinnerService, useClass: MockSpinnerService },
        { provide: NotificationService, useClass: MockNotificationService },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: ChangeDetectorRef, useClass: MockChangeDetectorRef },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Ensure mock data is available synchronously for assertions
    const svc = TestBed.inject(RecordService) as any;
    if (svc?.getMockRecords) {
      component.dataSource.data = svc.getMockRecords();
      fixture.detectChanges();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a non-empty data source', () => {
    expect(component.dataSource.data.length).toBeGreaterThan(0);
  });

  it('should render rows when data exists', () => {
    const compiled = fixture.nativeElement;
    const rows = compiled.querySelectorAll('.flex-row');
    expect(rows.length).toBeGreaterThan(0);
  });
});
