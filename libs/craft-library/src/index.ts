// Shared types and interfaces for Craft Fusion monorepo

// Example type
export interface User {
  id: string;
  name: string;
  email: string;
}

// Logging metadata shared across backend and frontend
export interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  // allow any metadata payload; using unknown avoids the index-signature
  // requirement of Record<string, unknown> which was too strict for some
  // event objects passed through the logger.
  metadata?: unknown;
}

// Timeline event payloads
export interface TimelineEvent {
  title: string;
  date: string | Date;
  description?: string;
  type?: string;
  [key: string]: unknown;
}

// Security report DTOs
export interface ControlResult {
  status: 'fail' | 'pass' | 'notapplicable' | string;
  [key: string]: unknown;
}

export interface OscalReport {
  controlResults?: ControlResult[];
  [key: string]: unknown;
}

// Service metrics payloads
export interface ServiceMetric {
  time: string;
  memory: number;
  cpu: number;
  latency: number;
}

// AppRecord, Phone, and Company interfaces (renamed to avoid collision with the built-in Record<T,U>)
export interface AppRecord {
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
    memoryUsage: any; // NodeJS.MemoryUsage, but keep as any for cross-platform
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
