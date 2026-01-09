import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SecurityReportModalComponent } from './security-report-modal.component';

describe('SecurityReportModalComponent', () => {
  let component: SecurityReportModalComponent;
  let fixture: ComponentFixture<SecurityReportModalComponent>;
  let mockDialogRef: { close: () => void };

  beforeEach(async () => {
    mockDialogRef = { close: () => {} };

    await TestBed.configureTestingModule({
      imports: [SecurityReportModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test Report',
            reportType: 'oscal',
            data: {
              name: 'Test OSCAL Scan',
              status: 'passing',
              pass: 10,
              fail: 2
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityReportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have pdf as default format', () => {
    expect(component.selectedFormat).toBe('pdf');
  });
});
