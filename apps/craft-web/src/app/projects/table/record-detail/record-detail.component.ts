import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Record, Company } from '@craft-fusion/craft-library';
import { MatTableDataSource } from '@angular/material/table';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

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
export class RecordDetailComponent implements OnChanges {
  @Input() user!: Record;
  @Input() loading = false;

  totalAnnualSalary = 0;
  salaryDisplayedColumns: string[] = ['company', 'salary'];
  salaryArray!: MatTableDataSource<Company>;

  // Array for displaying stars based on salary
  wealthIndicator: number[] = [];

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
    // Format phone numbers like (123) 456-7890
    if (!phoneNumber || phoneNumber.length < 10) return phoneNumber;
    
    return `(${phoneNumber.substring(0, 3)}) ${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
  }
}
