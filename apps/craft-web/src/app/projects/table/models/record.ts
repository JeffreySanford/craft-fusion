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

  export interface Phone {
    UID: string;
    number: string;
    type: string;
    countryCode?: string;
    areaCode?: string;
    extension?: string | null;
    hasExtension?: boolean;
  }
  
  export interface Company {
    UID: string;
    employeeName: string; // Renamed from 'name'
    annualSalary: number;
    companyName: string; // Made required
    companyPosition?: string; // Added optional field
  }