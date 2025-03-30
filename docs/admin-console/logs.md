# Logs Component

The Logs component provides detailed logging capabilities with advanced filtering and visualization options.

## Features

- View all system logs in a centralized location
- Filter logs by level, category, or free text search
- Toggle between list and tile view modes
- Group logs by category
- Specialized views for metrics and API logs
- Performance metrics visualization
- Time-based log display with relative timestamps

## Screenshots

![Logs Overview](../assets/images/logs-overview.png)

## Log Levels

The component supports multiple log levels, each with distinct visual styling:

- **Error**: Critical issues that require immediate attention
- **Warning**: Important issues that should be reviewed
- **Info**: Informational messages about system operation
- **Debug**: Detailed messages for debugging purposes
- **Performance**: Performance-related metrics and events

## Filtering

Logs can be filtered in several ways:

- **Text Search**: Filter logs containing specific text
- **Level Filter**: Show only logs of a specific level
- **Category Filter**: Show only logs from a specific category
- **Display Mode**: Filter by log type (all, performance metrics, API logs)

## Categories

Logs are organized into categories with distinct colors and icons:

- Security (red)
- API (blue)
- Database (teal)
- User (yellow)
- System (purple)
- Performance (orange)
- Network (green)
- And more...

## Technical Implementation

The Logs component:

- Is implemented as a standalone Angular component
- Uses OnPush change detection for performance
- Handles both Date and number timestamp formats
- Supports real-time log updates
- Provides sample logs for demonstration purposes

## Usage

```typescript
// Import the component
import { LogsComponent } from './logs/logs.component';

// Use in template
<app-logs></app-logs>

// Since it's a standalone component, import it in your module
@NgModule({
  imports: [
    // ... other imports
    LogsComponent
  ]
})
```

## Dependencies

- LoggerService: For accessing log data
- ThemeService: For theme management
- ApiLoggerService: For API logs
- PerformanceMetricsService: For performance metrics
- LoggerHelperService: For timestamp formatting and comparison

## Recent Updates

- Fixed timestamp handling to support both Date and number formats
- Added category-based log filtering
- Improved search performance
- Enhanced log visualization with better categorization
- Added support for performance metrics display
