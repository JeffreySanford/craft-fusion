import { Component, OnDestroy, OnInit } from '@angular/core';
import { Record, Company } from '../models/record';
import { RecordService } from '../services/record.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-record-detail',
  standalone: false,
  templateUrl: './record-detail.component.html',
  styleUrls: ['./record-detail.component.scss'],
  providers: [RecordService],
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
export class RecordDetailComponent implements OnInit, OnDestroy {
  user?: Record;
  totalAnnualSalary = 0;
  salaryDisplayedColumns: string[] = ['company', 'salary'];
  salaryArray!: Company[];
  selectedUserId!: string;
  loading = true;
  
  // Array for displaying stars based on salary
  wealthIndicator: number[] = [];

  userSub: Subscription;

  constructor(private recordService: RecordService, private router: Router) {
    this.selectedUserId = recordService.getSelectedUID();
    if (this.selectedUserId === "0000000") {
      this.router.navigate(['/table']);
    }

    this.userSub = this.recordService.getRecordByUID(this.selectedUserId).subscribe((user: Record) => {
      this.user = user;
      this.loading = false;
      
      // Calculate and generate wealth indicator stars (1-5)
      if (user && user.salary) {
        this.totalAnnualSalary = this.getTotalSalary();
        const starCount = Math.min(5, Math.max(1, Math.floor(this.totalAnnualSalary / 20000)));
        this.wealthIndicator = new Array(starCount).fill(0);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  ngOnInit(): void {
    // Already set in property initialization
  }

  public getTotalSalary(): number {
    this.totalAnnualSalary = 0;
    this.user?.salary.forEach((company) => {
      // Use the correct property based on the company structure
      this.totalAnnualSalary += company.annualSalary;
    });

    return this.totalAnnualSalary;
  }
  
  public formatPhoneNumber(phoneNumber: string): string {
    // Format phone numbers like (123) 456-7890
    if (!phoneNumber || phoneNumber.length < 10) return phoneNumber;
    
    return `(${phoneNumber.substring(0, 3)}) ${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
  }
  
  navigateBack(): void {
    this.router.navigate(['/table']);
  }
}
