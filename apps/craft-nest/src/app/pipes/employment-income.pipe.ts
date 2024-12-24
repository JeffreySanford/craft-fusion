import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'employmentIncome'
})
export class EmploymentIncomePipe implements PipeTransform {
  transform(records: any[]): number {
    if (!records || !Array.isArray(records)) {
      return 0; // Return a default value if records is null or not an array
    }
    return records.reduce((total, record) => total + (record.income || 0), 0);
  }
}
