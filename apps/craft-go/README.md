# Craft Go

This is the Go implementation of the Craft Fusion API.

## Development Guidelines

### Package Management

> **Important**: This application follows monorepo architecture principles.
>
> - While Go uses go.mod for dependencies, JavaScript/TypeScript dependencies
>   should only be managed at the root of the monorepo
> - **DO NOT** create a package.json file in this directory
> - Any Node.js tooling needed for this application must be added to the root package.json

## Dependency Management

Go's dependency injection is handled differently than Angular, but we follow similar principles to avoid circular imports:

### Interface-based Design

- Define interfaces in separate packages to break import cycles
- Implement interfaces in the consuming packages

### Dependency Inversion

- Higher-level packages define interfaces that lower-level packages implement
- Avoid direct references between packages at the same level

### Wire Package Pattern

- Use a dedicated "wire" package for dependency initialization
- Separates the dependency graph from business logic

These patterns complement the frontend's `HttpClientWrapperService` approach by ensuring clean dependency management throughout the stack.

## Health Monitoring

Craft-Go implements robust health monitoring endpoints compatible with the frontend monitoring system and other backend services:

### Health Endpoints

The application exposes several health check endpoints:

- **`/health`**: Primary health endpoint that requires no authentication
- **`/api/health`**: API-prefixed version of the health endpoint
- **`/status`**: Simplified status information
- **`/api/status`**: API-prefixed status endpoint

### Health Response Format

Health endpoints return a standardized JSON response that matches the NestJS implementation:

```go
type HealthStatus struct {
    Status      string `json:"status"`       // "online", "degraded", or "offline"
    Uptime      int64  `json:"uptime"`       // Milliseconds since start
    Timestamp   int64  `json:"timestamp"`    // Current Unix timestamp
    Hostname    string `json:"hostname"`     // Server hostname
    Version     string `json:"version"`      // Application version
    Environment string `json:"environment"`  // Deployment environment
    Memory      struct {
        Free  int64 `json:"free"`            // Free memory in bytes
        Total int64 `json:"total"`           // Total memory in bytes
        Usage int   `json:"usage"`           // Usage percentage
    } `json:"memory"`
    Services struct {
        Database string `json:"database"`     // "up", "down", or "degraded"
        Cache    string `json:"cache"`        // "up", "down", or "degraded"
    } `json:"services"`
}
```

### Implementation Details

- **No Authentication Required**: Health endpoints are exempt from authentication middleware
- **Multiple Entry Points**: Multiple URL paths are supported for maximum compatibility with various clients
- **Low Overhead**: Health checks are designed to be lightweight and have minimal performance impact

## Getting Started

### Craft-Go: Go Backend Service

## Architecture Overview

Craft-Go is a high-performance Go backend service designed to deliver exceptional throughput for the Craft Fusion platform. This document outlines the development standards, architectural patterns, and best practices for maintaining and extending the service.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Application Structure](#application-structure)
3. [Development Standards](#development-standards)
4. [API Design](#api-design)
5. [Data Access Layer](#data-access-layer)
6. [Real-time Communication](#real-time-communication)
7. [Performance Optimization](#performance-optimization)
8. [Testing Strategy](#testing-strategy)
9. [Security Considerations](#security-considerations)
10. [Deployment Guidelines](#deployment-guidelines)

## Technology Stack

- **Language**: Go 1.21+
- **Web Framework**: Angular with Material Design 3 support advanced data visualization
- **Database**: MongoDB via the official Go driver
- **Caching**: Redis for distributed caching
- **Configuration**: Viper for configuration management
- **Logging**: Zap for structured logging
- **Real-time**: Gorilla WebSocket for WebSocket support
- **Documentation**: Swagger/OpenAPI via Swaggo
- **Testing**: Go's built-in testing package with Testify
- **Containerization**: Docker with multi-stage builds

### Visual Overview (Sample ASCII Diagram)

```ascii
    [ Go 1.21+ ] ----> [ Angular UI ]   
           |                |
       [ MongoDB ]     [ Redis ]
           |                |   
        [ NX Monorepo ]  [ CI/CD ]
```

^ A simple chart representing primary components and interactions

## Development Standards

- :red_circle: **CRITICAL**: Code must pass all linters before commits
- :white_circle: **STANDARD**: Follow idiomatic Go patterns (<https://github.com/golang/go/wiki/CodeReviewComments>)
- :blue_circle: **ORGANIZATION**: Package structure follows domain-driven design

### Standards Compliance Chart

```ascii
Code Quality Metrics
|                🔴 Critical Issues
| 100% ┌─────────────────────┐
|  80% │         ↘           │
|  60% │            ↘        │
|  40% │               ↘     │
|  20% │                  ↘  │
|   0% └─────────────────────┘
      Week1  Week2  Week3  Week4
```

### Coding Standards Matrix

| 🔴 Critical Standards | ⚪ Core Practices | 🔵 Team Preferences |
|---------------------|-----------------|-------------------|
| Security scanning   | Test coverage   | Code formatting   |
| Error handling      | Documentation   | Naming conventions|
| Input validation    | Code reviews    | Logging practices |
| Memory management   | Performance     | Comment style     |

### Review Process

```ascii
Code Submission ──► PR Creation ──► Automated Tests ──► Peer Review
       ▲                                                    │
       │                                                    ▼
  Code Updates ◄─── Revision Requests ◄─── Manual Testing ◄─┘
```

### Performance Expectations

🔴 **Critical Path Performance**

- API response: < 100ms (95th percentile)
- Database queries: < 50ms average
- Memory usage: < 256MB per instance

⚪ **Standard Operations**

- Background tasks: Complete within SLA
- Cache hit ratio: > 85%
- Connection pool efficiency: > 90%

🔵 **Development Experience**

- Build time: < 30 seconds
- Test suite: < 2 minutes
- Lint checks: < 10 seconds

## Application Structure

The application follows a clean, domain-driven architecture:

```ascii
🔵 PRESENTATION LAYER
├── api/      - HTTP handlers, middleware
├── websocket - Real-time communication
└── docs/     - API documentation

⚪ BUSINESS LAYER
├── services/ - Business logic implementation
├── domain/   - Core domain models & interfaces
└── events/   - Event management

🔴 DATA LAYER
├── repositories/ - Data access implementations
├── migrations/   - Database schema changes
└── cache/        - Redis operations
```

### Project Directory Overview

```ascii
📁 craft-go/
├── 📄 main.go         - Application entry point
├── 📁 cmd/            - Command-line utilities
├── 📁 internal/       - Private application code
│   ├── 📁 config/     - Configuration handling
│   ├── 📁 handlers/   - HTTP request handlers
│   ├── 📁 middleware/ - HTTP middleware components
│   └── 📁 models/     - Domain models
├── 📁 pkg/            - Public libraries for external use
└── 📄 go.mod          - Go module definition
```

### Architecture Decision Records

The project maintains ADRs (Architecture Decision Records) in the `/docs/adr` directory to document significant architectural decisions. Review these before proposing structural changes.

### Component Interaction Flow

```ascii
🔴 Client Request
      │
      ▼
🔴 Load Balancer
      │
      ▼
⚪ API Gateway
      │
      ▼
🔵 Craft-Go Service ◄─────┐
      │                   │
      ▼                   │
⚪ Business Logic          │
      │                   │
      ▼                   │
🔵 Data Access Layer      │
      │                   │
      ▼                   │
🔴 Database               │
      │                   │
      ▼                   │
⚪ Cache ──────────────────┘
```

## Craft-Go Service

### Installation

1. Install Go 1.23+.
2. From the project root:  
   - go mod tidy  
   - go install ./...

### Nx Integration

- This service works under Nx; ensure all Nx dependencies are installed at the workspace root.
- Set up tasks in nx.json or project.json if you want Nx commands (e.g., nx serve craft-go).

### Deployment

- Build your Go binary (e.g., go build) and run it via PM2 or another process manager.
- For production, bump the go.mod version to match the required Go release.

### Maintenance

- Keep go.mod and go.sum updated with go mod tidy.
- Regularly pull new dependencies and update Nx-based configurations when needed.

### Method Functions

- Provide common handlers, middlewares, or domain logic in separate Go files.
- Register them in main.go or expose them as needed for external usage.

Include icons/emoji for quick scanning:

- :wrench: For installation steps
- :rocket: For deployment pointers

## Environment Variables

In production, configure environment variables for:

- 🔴 **SECURITY**: `API_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY`
- ⚪ **NETWORK**: `PORT` (default 4000), `HOST`, `ALLOWED_ORIGINS`
- 🔵 **STORAGE**: `DB_URL`, `REDIS_HOST`, `S3_BUCKET`

### Configuration Priority Pyramid

```ascii
        🔴
       /   \
      /     \
     ⚪⚪⚪⚪⚪
    /         \
   🔵🔵🔵🔵🔵🔵🔵
  /             \
 ─────────────────
 Security → Network → Storage
```

## Advanced Topics

Implement logging and metrics collection (e.g., Prometheus or Grafana). Add structured logs (e.g., using Zap) and track performance metrics via gin middleware.

Add a simple bar chart to represent typical performance benefits of concurrency:

```ascii
Concurrency Gains (Requests/sec)
|      # of Goroutines
| 500 -------------------
| 400 -------------------
| 300 -------------------
| 200 -------------------
| 100 -------------------
|________________________
         10   50   100
```

### Scaling & Performance

- Use load balancing or orchestration (Kubernetes) for scaling.
- Optimize data access patterns or offload work with async queues.

## Contributing

- Please open issues or merge requests for enhancements or bug fixes.
- Follow conventional commits and code style guidelines.

## API Design

This monorepo supports four primary applications (e.g., craft-go, craft-ui, craft-admin, craft-automation). All follow a consistent pattern:

- Use REST conventions
- Version APIs appropriately (e.g., /v1/, /v2/)
- Include proper error handling with JSON responses

## Data Access Layer

For MongoDB, keep lightweight repositories. Avoid business logic in data-access layers.

## Real-time Communication

Use Gorilla WebSocket for any real-time connections. Follow standard concurrency patterns to handle multiple clients safely.

## Performance Optimization

Leverage Go’s concurrency (goroutines, channels). Always measure performance with tools like pprof or Benchmarks before optimizing further.

## Testing Strategy

- Unit tests for isolated functionality (with Testify for assertions).
- Integration tests to confirm cross-service compatibility.
- Nx tasks can coordinate multi-service test runs.

## Security Considerations

- Never commit secrets; use environment variables or secure vaults.
- Validate each request thoroughly (input sanitization, auth checks).
- Keep dependencies and libraries updated.

## Deployment Guidelines

- Each app can be built via Nx tasks or Go build steps.
- Containerize with Docker multi-stage builds.
- CI/CD can be orchestrated at the root Nx configuration for consistent releases.

## Nx Monorepo Architecture

The Nx monorepo currently supports four main applications—craft-go, craft-ui, craft-admin, and craft-automation. Each application leverages shared libraries, tooling, and consistent configuration to streamline development:

- Shared config and scripts in the repo root
- Cross-project references managed by Nx
- Unified versioning strategy to minimize dependency drift
- Consistent lint/test/build commands

Use bright highlighted tips or notes for cross-application references. Encourage linking to other apps’ docs for deeper integration details.

Use Nx tasks or the native Go CLI for craft-go. Nx tasks can handle cross-application builds and orchestrated deployments for all apps in the monorepo.

## Application Comparison

| Feature         | 🔴 craft-go | ⚪ craft-ui | 🔵 craft-admin | ⚪ craft-automation |
|----------------|------------|------------|---------------|-------------------|
| Language       | Go         | TypeScript | TypeScript    | TypeScript        |
| Primary role   | API server | Frontend   | Admin panel   | Workflow engine   |
| Build time     | Fast       | Medium     | Medium        | Slow              |
| Test coverage  | 90%        | 75%        | 80%           | 85%               |
| Dependencies   | Few        | Many       | Medium        | Many              |

### Cross-Service Communication

```ascii
             ┌──────────────┐
  🔴         │ ⚪ craft-ui  │
craft-go ◄───┼──────────────┤
  ▲ ▲        │⚪craft-auto. │
  │ │        └──────────────┘
  │ │
  │ └───────┐
  │         │
┌─┴────────┐│
│🔵craft-  ││
│  admin   │◄
└──────────┘
```

## Quick Reference Guide

Use this patriotic color system throughout documentation and diagrams:

- 🔴 **RED**: Critical components, security features, primary services
- ⚪ **WHITE**: Standard utilities, documentation, connecting components
- 🔵 **BLUE**: Supporting services, UI elements, future enhancements

## Additional Infographics & Visuals

Enhance readability using red, white, and blue (🇺🇸) color coding:

- :red_circle: Critical paths or urgent tasks
- :white_large_square: Neutral or informational content
- :large_blue_circle: Future improvements or planned features

### Sample Red-White-Blue Chart

```ascii
Monorepo Adoption
| Features Added (In Red)
| 10 -----------  
|  8 ----------  
|  6 ----------  
|  4 ----------  
|  2 ----------  
|_______________  
   Q1   Q2   Q3  
      (In Blue)
```

Use this approach to highlight progress across releases. Leverage these patriotic colors in diagrams, bullet points, or headings to help the team visualize priority areas.

## System Requirements

- Go 1.21+ (required for core functionality)
- Docker (for containerized development and deployment)
- MongoDB 5.0+ (for data persistence)
- Redis 6.0+ (for caching layer)
- Git 2.30+ (for version control)

## Local Development Setup

```bash
# Clone the repository (if not already done)
git clone https://github.com/your-org/craft-fusion.git
cd craft-fusion

# Install Nx dependencies at the workspace root
npm install

# Navigate to the Go application directory
cd apps/craft-go

# Initialize Go modules
go mod tidy

# Run tests
go test ./...

# Start the application in development mode
go run main.go
# Or using Nx
nx serve craft-go
```

## API Documentation

API documentation is available at `/api/docs` when the server is running. The Swagger UI provides interactive documentation for all endpoints.

For generating updated API docs:

```bash
# Generate Swagger docs
swag init -g main.go
```

## Troubleshooting Common Issues

### Connection Issues

- Ensure MongoDB and Redis are running and accessible
- Verify environment variables for connection strings are set correctly
- Check firewall settings if running in a networked environment

### Build Failures

- Run `go mod tidy` to ensure dependencies are correctly resolved
- Check Go version compatibility
- Verify that imported packages exist and are accessible

## Project Roadmap

See [ROADMAP.md](../../docs/ROADMAP.md) for upcoming features and improvements.

## 💡 Tips for Go Newcomers

New to Go or backend development? Welcome! Here are some tips to help you get comfortable:

### Getting Comfortable with Go

1. **Start Small**: Focus on understanding single file examples in the `examples/` directory
2. **Embrace Go's Simplicity**: Go intentionally has fewer language features than other languages
3. **Learn by Modifying**: Try making small changes to existing handlers to see how things work
4. **Use Go Playground**: Test small snippets at [Go Playground](https://play.golang.org/)

### Common Gotchas for Beginners

```go
// MISTAKE: Not handling errors
result := someFunction()  // Error ignored!

// BETTER: Always handle errors
result, err := someFunction()
if err != nil {
    // Handle the error appropriately
    return err
}
```

### Debugging Tips

- Use `fmt.Printf("Value: %+v\n", myVariable)` liberally while learning
- Check our Go Style Guide in the `/docs/go-style-guide.md` file
- Run tests frequently with `go test ./...`

Remember that Go's simplicity is its strength! The language has a small feature set by design, making it easier to master than you might think.
