# Craft Fusion

![Project Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Craft Fusion is a modern web application framework that combines Angular, NestJS, and Go microservices to provide a robust foundation for building sophisticated web applications with a focus on performance, scalability, and developer experience.

## 🚀 Features

- **Angular Frontend**: Modern Angular application with Material Design
- **NestJS Backend**: Type-safe API with dependency injection
- **Go Microservices**: High-performance auxiliary services
- **Nx Workspace**: Monorepo management with efficient caching
- **Integrated Testing**: Comprehensive testing setup with Jest
- **Design System**: Consistent design tokens and styling
- **Health Monitoring**: System-wide health checks and diagnostics

## 📋 Prerequisites

- Node.js (v18 or later)
- Go (v1.21 or later) - for Go microservices
- Docker (optional, for containerized development)

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/craft-fusion.git
   cd craft-fusion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   ```bash
   cp .env.template .env
   ```

4. Update the `.env` file with your credentials and API keys.

## 📊 Development

### Start the Angular frontend:

```bash
nx serve craft-web
```

Access the application at `http://localhost:4200/`

### Start the NestJS API:

```bash
nx serve craft-nest
```

API will be running at `http://localhost:3000/`

### Run Go service:

```bash
nx serve craft-go
```

## 🧪 Testing

### Run tests for all projects:

```bash
nx run-many --target=test --all
```

### Run tests for a specific project:

```bash
nx test craft-web
nx test craft-nest
```

### Run end-to-end tests:

```bash
nx e2e craft-web-e2e
```

## 📚 Project Structure

The project follows a monorepo structure managed by Nx. See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed information about the codebase organization.

## 🏗️ Building for Production

```bash
# Build all projects
nx run-many --target=build --all --prod

# Build specific project
nx build craft-web --prod
nx build craft-nest --prod
```

Production builds output to `./dist/` directory.

## 🔍 Code Quality

- **Linting**: `nx lint craft-web`
- **Formatting**: `nx format:check` or `nx format:write`
- **Type checking**: `nx workspace-lint`

## 📋 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.

## 🙏 Acknowledgments

- Angular team for the amazing frontend framework
- NestJS team for the elegant backend framework
- Go team for their high-performance language
- Nx team for the powerful monorepo tooling
