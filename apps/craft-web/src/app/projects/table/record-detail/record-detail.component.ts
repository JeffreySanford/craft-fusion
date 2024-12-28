import { Component, OnDestroy, OnInit } from '@angular/core';
import { Company } from '../models/company';
import { Record } from '../models/record';
import { RecordService } from '../record.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-record-detail',
  templateUrl: './record-detail.component.html',
  styleUrls: ['./record-detail.component.scss'] // Updated to styleUrls
})
export class RecordDetailComponent implements OnInit, OnDestroy {
  user?: Record;
  totalAnnualSalary = 0;
  salaryDisplayedColumns!: string[];
  salaryArray!: Company[];
  selectedUserId!: string;

  userSub: Subscription;

  constructor(private recordService: RecordService, private router: Router) {
    this.selectedUserId = recordService.getSelectedUID();
    if (this.selectedUserId === "0000000") {
      this.router.navigate(['/records']);
    }

    this.userSub = this.recordService.getRecordByUID(this.selectedUserId).subscribe((user: Record) => {
      this.user = user;
      this.user.phone = user.phone;
      this.user.address = user.address;
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.salaryDisplayedColumns = ['company', 'salary'];
  }

  public getTotalSalary(): number {
    this.totalAnnualSalary = 0;
    this.user?.salary.forEach((company: Company) => {
      this.totalAnnualSalary += company.annualSalary;
    });

    return this.totalAnnualSalary;
  }
}
