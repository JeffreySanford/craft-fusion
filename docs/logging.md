# Craft Fusion Logging System

## Overview

The Craft Fusion Logging System provides comprehensive visibility into application behavior and performance. It captures events across the frontend and backend, providing real-time monitoring and debugging capabilities.

## Features

- **Categorized Logs**: Automatically categorizes logs by type (API, security, navigation, etc.)
- **Color-Coded Output**: Visual distinction between log levels and categories
- **Role-Based Access**: Different user roles have appropriate log access
- **Real-Time Monitoring**: Live log updates in the admin interface
- **Performance Metrics**: Tracks API response times and application performance
- **Customizable Filters**: Filter logs by level, component, time period, etc.

## Color Scheme

Our logging system uses a carefully designed color scheme to help quickly identify log types:

| Log Type | Color | Usage |
|----------|-------|-------|
| Error | Red (#BF0A30) | Reserved exclusively for actual errors |
| Warning | Orange (#FF8C00) | For potential issues and warnings |
| Info | Blue (#0052B4) | Standard informational messages |
| Debug | Light Blue (#3b82f6) | Detailed debug information |
| Security | Purple (#8B008B) | Security-related events |
| Performance | Navy (#3C3B6E) | Performance metrics and timing |
| User | Teal (#008080) | User-related activities |
| API | Blue (#0052B4) | API calls and responses |
| Storage | Green (#006400) | Storage and persistence operations |

## Logger UI Components

### Log Display Filter

Allows users to filter logs based on multiple criteria:
- Log level (debug, info, warn, error)
- Security level
- User roles
- Entry limit

### Logger Display

Provides two layouts for viewing logs:

1. **Grid Layout**:
   - Left panel: Full log stream in chronological order
   - Right panel: Categorized logs in collapsible cards (errors, warnings, info, general)
   - Color-coded by log level for easy identification

2. **Inline Layout**:
   - Traditional table view
   - Sortable columns
   - Clickable rows for details

## Message Parser

The system includes an intelligent message parser that:
- Removes redundant prefixes and boilerplate text
- Makes messages more concise and readable
- Formats technical details appropriately
- Handles JSON data elegantly

## Security Considerations

The logging system implements robust security controls:
- Role-based access ensures logs are only visible to authorized users
- Security levels allow for categorizing sensitive information
- Export controls respect security settings
- Sensitive data is automatically redacted from logs

## Usage in Components

To use the logger in any component:

```typescript
constructor(private logger: LoggerService) {
  this.logger.registerService('MyComponent');
}

// Log examples
this.logger.info('User logged in successfully');
this.logger.warn('Connection attempt failed', { attempts: 3 });
this.logger.error('Database connection failed', { errorCode: 500 });
```

## Admin Configuration

Administrators can configure log permissions through the admin interface:
- Set which roles can view each log level
- Configure default security levels
- Toggle public visibility options

## Integration with State Management

The logging system integrates with our state management solution (Ward Bell's state mechanism and Dan Wahlin's RXJS methodology) to:
- Track state changes
- Log state transitions
- Provide debugging tools for state-related issues
- Maintain an audit trail of user activities

Last Updated: 2023-10-21
