import { Pipe, PipeTransform } from '@angular/core';
import { Company } from '@craft-fusion/craft-library';

@Pipe({
  name: 'employmentIncome',
  standalone: false
})
export class EmploymentIncomePipe implements PipeTransform {
  transform(companies: Company[]): number {
    // Ensure companies is an array before reducing
    if (!Array.isArray(companies)) {
      return 0;
    }
    return companies.reduce((total, company) => total + (company.annualSalary || 0), 0);
  }
}