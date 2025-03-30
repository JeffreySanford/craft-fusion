# Admin Console Documentation

The Admin Console provides comprehensive monitoring and management capabilities for the Craft Fusion platform.

## Overview

The Admin Console is a central hub for administrators to monitor system health, view logs, track performance metrics, manage security settings, and monitor API activities.

## Features

- **Real-time Monitoring**: View live system statistics and server status
- **Multi-server Support**: Monitor both Nest.js and Go servers from a single interface
- **Detailed Logging**: Advanced log filtering, categorization, and visualization
- **Performance Tracking**: Track CPU, memory, and network performance over time
- **API Monitoring**: Monitor API calls, response times, and error rates
- **Security Management**: Centralized security administration

## Getting Started

1. Access the Admin Console at `/admin`
2. Authentication is required - only users with admin privileges can access
3. Navigate between tabs to access different functionality

## Components

### Dashboard

The Dashboard provides an at-a-glance view of system health:

- Server status for Nest and Go servers
- System metrics (CPU, memory, network)
- Recent errors and API calls
- User activity statistics
- Performance score

### Logs

The Logs component offers comprehensive logging capabilities:

- View logs across all system components
- Filter by log level, category, or free text search
- View log details including timestamps, source, and message
- Group logs by category with visual indicators
- Performance and API-specific log views

### Performance

Track detailed performance metrics:

- CPU and memory utilization over time
- Network latency and throughput
- API response times and call volumes
- Client-side performance metrics

### Security

Manage security settings and monitor security events:

- User authentication activity
- Access control management
- Security alerts and audit logs
- OAuth configuration

### API Monitor

Monitor API activity across the platform:

- Real-time API call tracking
- Response time analysis
- Error rate monitoring
- Endpoint usage statistics

## Technical Implementation

- The Admin Console is implemented as a lazy-loaded Angular module
- Uses Angular Material for UI components
- Implements OnPush change detection for performance
- Responsive design for desktop and mobile views
- Standalone components used where appropriate

## Architecture

The Admin Console follows a modular architecture:

