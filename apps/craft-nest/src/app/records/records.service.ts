import { Injectable } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Phone, Record, Address } from './entities/record.interface';
import { faker } from '@faker-js/faker';
import { Company } from './entities/company.interface';

@Injectable()
export class RecordsService {
  private mockDatabase: Record[] = [];
  recordGenerationTime: number = 0;
  

  getRecordByUID(UID: string): Record {
    // Mock database fetch
    const record = this.mockDatabase.find(record => record.UID === UID);
    if (!record) {
      throw new Error(`Record with UID ${UID} not found`);
    }
    return record;
  }

  getAllRecords(): Record[] {
    // Mock database fetch
    return this.mockDatabase;
  }

  calculateTotalIncome(UID: string): number {
    const record = this.getRecordByUID(UID);
    if (record) {
      return record.salary.reduce((acc, companySalary) => acc + companySalary.annualSalary, 0);
    }
    return 0;
  }

  generateCompany(): Company {
    return {
      companyName: faker.company.name(),
      annualSalary: faker.number.int({ min: 30000, max: 500000 }),
    };
  }

  generatePhone(): Phone {
    const rawPhoneNumber = '##########'.replace(/#/g, () => faker.number.int({ max: 9 }).toString());
    const formattedPhoneNumber = rawPhoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');

    const areaCode = faker.phone.number().slice(0, 3);
    const hasExtension = faker.datatype.boolean();
    const extension = hasExtension ? faker.number.int({ min: 1000, max: 9999 }).toString() : null;

    const phone = {
      number: formattedPhoneNumber,
      areaCode,
      hasExtension,
      extension
    };

    return phone;
  }

  generateAddress(): Address {
    const address: Address = {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipcode: faker.location.zipCode()
    };

    return address;
  }

  generateRecord(): Record {
    const generateRecord: Record = {
      UID: faker.number.int({ min: 100000000, max: 999999999 }).toString(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: this.generateAddress(),
      phone: this.generatePhone(),
      salary: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => this.generateCompany()),
      totalHouseholdIncome: faker.number.int({ min: 50000, max: 50000000 }),
    };

    return generateRecord;
  }

  generateMultipleRecords(count: number): Record[] {
    const startTime = performance.now();

    this.mockDatabase = Array.from({ length: count }, () => this.generateRecord());
    
    const endTime = performance.now();

    this.recordGenerationTime = endTime - startTime;

    console.log('Generated ' + count + ' records');

    return this.mockDatabase;
  }

  getCreationTime(): number {
    return this.recordGenerationTime;
  }
}