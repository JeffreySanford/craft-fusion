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
  avatar: unknown;
  flicker: unknown;
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

// Health types (shared with backend)
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface SystemMetrics {
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  cpu: {
    loadAvg: number[];
    usage: number;
  };
  process: {
    pid: number;
    memoryUsage: unknown; // NodeJS.MemoryUsage, but keep as any for cross-platform
    uptime: number;
  };
  timestamp: number;
}

export interface HealthData {
  status: HealthStatus;
  services: globalThis.Record<string, boolean>;
  uptime: number;
  version: string;
  metrics?: SystemMetrics;
}

// Add more shared types/interfaces here
