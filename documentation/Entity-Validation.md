# Entity Validation Pattern

This document describes the standardized entity validation pattern used across the Craft Fusion project.

## Overview

The Entity Validation Pattern ensures data consistency and type safety between frontend and backend implementations by:

1. Making all entity fields required by default
2. Using TypeScript interfaces with runtime type guards
3. Implementing consistent validation across platforms
4. Preventing partial or malformed data from entering the system

## Backend Implementation (NestJS)

### Entity Definition

```typescript
// Record entity with all required fields
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Phone {
  home: string;
  mobile: string;
  work: string;
  preferred: 'home' | 'mobile' | 'work';
}

export class Record {
  id: number;
  UID: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  address: Address;
  phone: Phone;
  salary: Company[];
  totalHouseholdIncome: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Type Guard Function

```typescript
// Runtime validation with comprehensive checks
export function isRecord(value: any): value is Record {
  return (
    value &&
    typeof value.id === 'number' &&
    typeof value.UID === 'string' &&
    typeof value.name === 'string' &&
    // Additional property checks...
    // Complete validation ensuring all fields exist with correct types
  );
}
```

## Frontend Implementation (Angular)

### Entity Definition

```typescript
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
  phone: {
    number: string;
    hasExtension: boolean;
    extension: string;
    areaCode: string;
  };
  salary: {
    name: string;
    salary: number;
    title: string;
  }[];
  totalHouseholdIncome: number;
}
```

### Validation Functions

```typescript
// Complete record validation
export function isValidRecord(value: any): value is Record {
  return (
    value &&
    typeof value.UID === 'string' &&
    // Additional property checks...
  );
}

// Partial record validation for forms
export function isValidPartialRecord(value: Partial<Record>): boolean {
  if (!value) return false;
  
  // Only validate fields that are present
  if (value.UID !== undefined && typeof value.UID !== 'string') return false;
  // Additional optional property checks...
  
  return true;
}
```

## Best Practices

1. **Never assume field existence**: Always use type guards before accessing properties
2. **Validate early**: Check data as close to the entry point as possible
3. **Complete validation**: Never skip fields in validation functions
4. **Keep in sync**: Update both frontend and backend validation when entity models change
5. **Document expectations**: Make required fields clear in all APIs

## Implementation in Services

```typescript
// Backend (NestJS)
@Injectable()
export class RecordsService {
  createRecord(data: any): Record {
    if (!isRecord(data)) {
      throw new BadRequestException('Invalid record data');
    }
    // Process valid record...
  }
}

// Frontend (Angular)
@Injectable()
export class RecordService {
  saveRecord(data: any): Observable<Record> {
    if (!isValidRecord(data)) {
      return throwError(() => new Error('Invalid record data'));
    }
    return this.apiService.post<Record>('records', data);
  }
}
```
