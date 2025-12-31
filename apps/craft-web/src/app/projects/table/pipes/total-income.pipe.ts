import { Pipe, PipeTransform } from '@angular/core';
import { Record, Company } from '@craft-fusion/craft-library';

@Pipe({
  name: 'totalIncome',
  standalone: false,
})
export class TotalIncomePipe implements PipeTransform {
  transform(records: Record[]): number {
    console.log('TotalIncomePipe transform called for records:', records);
    return records.reduce((total, record) => total + record.salary.reduce((sum: number, company: Company) => sum + company.annualSalary, 0), 0);
  }
}
