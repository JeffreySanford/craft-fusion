# Timestamp Handling in Craft Fusion

This document explains how timestamps are handled throughout the Craft Fusion application.

## Overview

Timestamps in Craft Fusion can be represented in two formats:

1. As JavaScript `Date` objects
2. As numbers (milliseconds since Unix epoch)

The `LoggerHelperService` provides utilities for handling both formats consistently.

## LoggerHelperService

The `LoggerHelperService` is a utility service that standardizes timestamp handling across the application.

### Key Methods

- `toDate(timestamp: Date | number)`: Converts any timestamp format to a Date object
- `toMilliseconds(timestamp: Date | number)`: Converts any timestamp format to milliseconds
- `compareTimestamps(a: Date | number, b: Date | number)`: Safely compares timestamps of either format
- `formatTimeAgo(timestamp: Date | number)`: Formats a timestamp as a relative time string
- `formatDate(timestamp: Date | number)`: Formats a timestamp as a date string
- `formatTime(timestamp: Date | number)`: Formats a timestamp as a time string
- `formatDateTime(timestamp: Date | number)`: Formats a timestamp as a full date and time string

## Usage Examples

### Component Example

```typescript
@Component({
  // component metadata
})
export class MyComponent {
  constructor(private loggerHelper: LoggerHelperService) {}
  
  formatTime(timestamp: Date | number): string {
    return this.loggerHelper.formatTimeAgo(timestamp);
  }
  
  sortByTimestamp(items: any[]): any[] {
    return items.sort((a, b) => 
      this.loggerHelper.compareTimestamps(b.timestamp, a.timestamp)
    );
  }
}
```

### Template Example

```html
<div class="timestamp">
  {{ loggerHelper.formatTimeAgo(item.timestamp) }}
</div>
```

### Sorting Example

When sorting arrays containing timestamps:

```typescript
// Before
items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

// After - handles both Date and number formats
items.sort((a, b) => this.loggerHelper.compareTimestamps(b.timestamp, a.timestamp));
```

## Best Practices

1. Always use `LoggerHelperService` methods when working with timestamps
2. Don't assume timestamps are Date objects
3. Don't call `getTime()` directly on timestamps
4. Use type annotations `Date | number` for timestamp parameters
5. Use the comparison helper for sorting

## Integration with Backend

Both the Nest.js and Go backends may return timestamps as either:

- ISO strings (which become Date objects when parsed by Angular's HttpClient)
- Numbers (milliseconds)

The LoggerHelperService handles both formats seamlessly.
