# Dashboard Component

The Dashboard component provides a high-level overview of system health and activity.

## Features

- Server status monitoring for multiple backend servers (Nest and Go)
- System metrics visualization (CPU, memory, network)
- Recent error logs display
- Recent API calls tracking
- User activity statistics
- System uptime display

## Screenshots

![Dashboard Overview](../assets/images/dashboard-overview.png)

## Server Status Cards

Each server monitored by the system has a status card showing:

- Online/Offline/Degraded/Warning status
- Current latency
- CPU usage
- Memory usage
- Last update time

These cards use color coding to indicate status:
- Green: Online
- Yellow: Degraded
- Red: Warning
- Gray: Offline

## System Metrics

The dashboard displays key system metrics:

- CPU Usage: Current CPU utilization with trend indicator
- Memory Usage: Current memory utilization with trend indicator
- Network Latency: Current network latency with quality indicator
- API Call Rate: Number of API calls per minute

## Recent Activity

Recent activity is displayed in two sections:

1. **Recent Errors**: Shows the most recent system errors with timestamp and source
2. **Recent API Calls**: Shows the most recent API calls with method, URL, status, and response time

## Technical Implementation

The Dashboard component:

- Uses real-time data from multiple services
- Implements OnPush change detection for performance
- Handles both Date and number timestamp formats
- Uses responsive design for different screen sizes
- Periodically refreshes data (every 10s for dashboard data, 30s for server metrics)
- Provides mock data when servers are offline for demonstration purposes

## Usage

```typescript
// Import the component
import { DashboardComponent } from './dashboard/dashboard.component';

// Use in template
<app-dashboard></app-dashboard>
```

## Dependencies

- ThemeService: For theme management
- LoggerService: For logging
- PerformanceMetricsService: For system metrics
- UserActivityService: For user activity data
- ApiLoggerService: For API logs
- ApiService: For server metrics
- LoggerHelperService: For timestamp formatting and comparison

## Recent Updates

- Added comprehensive server connectivity status monitoring
- Improved timestamp handling and display of "time ago" values
- Enhanced error logging and visualization
- Implemented API call tracking with response time indicators
- Added trend indicators for system metrics
