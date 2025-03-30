# Craft Fusion

A comprehensive admin dashboard and monitoring system built with Angular, Nest.js, and Go.

## Features

- Multi-server monitoring (Nest.js and Go)
- Real-time metrics visualization
- Detailed logging and error tracking
- API monitoring and performance analysis
- User activity tracking
- OAuth integration

## Architecture

Craft Fusion consists of three main applications:

1. **craft-web**: Angular frontend application
2. **craft-nest**: Nest.js backend server
3. **craft-go**: Go backend server

## Quick Start

### Prerequisites

- Node.js 16+
- Go 1.18+
- Angular CLI
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/craft-fusion.git
cd craft-fusion

# Install dependencies
npm install

# Start the development servers
npm run start:nest
npm run start:go
npm run start:web
```

### Accessing the Admin Console

Navigate to `http://localhost:4200/admin` in your browser to access the Admin Console.

## Project Structure
