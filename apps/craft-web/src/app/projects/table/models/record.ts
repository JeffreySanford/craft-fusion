import { Company } from './company';
import { Phone } from './phone';


export interface Record {
    UID: string;
    name: string;
    avatar: any;
    flicker: any;
    firstName: string;
    lastName: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipcode: string;
    };
    city: string;
    state: string;
    zip: string;
    phone: Phone;
    salary: Company[];
    totalHouseholdIncome: number;
  }