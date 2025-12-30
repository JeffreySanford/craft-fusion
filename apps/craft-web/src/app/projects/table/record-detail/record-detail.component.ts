import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { Record, Company } from '@craft-fusion/craft-library';
import { MatTableDataSource } from '@angular/material/table';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { RecordService } from '../services/record.service';

@Component({
  selector: 'app-record-detail',
  standalone: false,
  templateUrl: './record-detail.component.html',
  styleUrls: ['./record-detail.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.6s ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger('100ms', [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ]
})
export class RecordDetailComponent implements OnChanges, OnInit {
  @Input() user!: Record;
  @Input() loading = false;

  totalAnnualSalary = 0;
  salaryDisplayedColumns: string[] = ['company', 'salary'];
  salaryArray!: MatTableDataSource<Company>;

  // Array for displaying stars based on salary
  wealthIndicator: number[] = [];

  constructor(private route: ActivatedRoute, private recordService: RecordService) {}

  ngOnInit(): void {
    if (!this.user) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loading = true;
        this.recordService.getRecordByUID(id).subscribe({
          next: (record) => {
            if (record) {
              this.user = record;
              this.loading = false;
              this.ngOnChanges({ user: { currentValue: record, previousValue: null, firstChange: true, isFirstChange: () => true } });
            } else {
              this.loading = false;
            }
          },
          error: () => {
            this.loading = false;
          }
        });
        return;
      }
      this.loading = true;
      return;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      // Defensive: ensure all nested properties exist
      this.user = {
        ...this.user,
        address: this.user.address || { street: '', city: '', state: '', zipcode: '' },
        phone: this.user.phone || { UID: '', number: '', type: '' },
        salary: Array.isArray(this.user.salary) ? this.user.salary : [],
      };
      // Calculate and generate wealth indicator stars (1-5)
      if (this.user.salary) {
        this.salaryArray = new MatTableDataSource<Company>(this.user.salary);
        this.totalAnnualSalary = this.getTotalSalary();
        const starCount = Math.min(5, Math.max(1, Math.floor(this.totalAnnualSalary / 20000)));
        this.wealthIndicator = new Array(starCount).fill(0);
      }
    }
  }

  public getTotalSalary(): number {
    let total = 0;
    this.user?.salary.forEach((company: Company) => {
      // Use the correct property based on the company structure
      total += company.annualSalary;
    });

    return total;
  }
  
  public formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) {
      // US standard 10-digit
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // US with country code
      return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
    } else if (digits.length > 10) {
      // International, just group
      return `+${digits.substring(0, digits.length - 10)} (${digits.substring(digits.length - 10, digits.length - 7)}) ${digits.substring(digits.length - 7, digits.length - 4)}-${digits.substring(digits.length - 4)}`;
    }
    // Fallback: return as is
    return phoneNumber;
  }
}
