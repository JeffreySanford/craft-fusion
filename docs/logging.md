# Craft Fusion Logging System

## Overview

Craft Fusion features a comprehensive logging system with a flexible, interactive UI for viewing and filtering logs. The system is designed to be developer-friendly while providing robust security controls.

## Features

- **Dual Layout Options**: 
  - **Grid Layout**: Split-view with a full log stream on the left and categorized collapsible cards on the right
  - **Inline Layout**: Traditional table view of all logs

- **Security Levels**:
  - Low-security access
  - Medium-security access
  - High-security access

- **Role-Based Access Control**:
  - User roles: Admin, User, Testing
  - Configurable permissions per log level

- **Log Filtering**:
  - By log level (debug, info, warn, error)
  - By security level
  - By user role
  - By content

- **Log Processing**:
  - Automated message parsing to remove boilerplate
  - Clean and concise display of log messages
  - Export capabilities (JSON, CSV)

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

## Usage in Components

To use the logger in any component:

```typescript
constructor(private logger: LoggingService) {
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
