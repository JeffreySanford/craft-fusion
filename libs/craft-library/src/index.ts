// Shared types and interfaces for Craft Fusion monorepo

// Example type
export interface User {
  id: string;
  name: string;
  email: string;
}

// Record, Phone, and Company interfaces
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
  email: string;
  birthDate: string;
  totalHouseholdIncome: number;
  registrationDate: string;
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

// Add more shared types/interfaces here
