# 🎨 Craft Fusion

<p align="center">
  <img src="assets/logo.png" alt="Craft Fusion Logo" width="200"/>
  <br>
  <em>A modern web development monorepo showcasing Angular, NestJS, and Go with a patriotic theme</em>
</p>

<p align="center">
  <a href="https://jeffreysanford.us"><img src="https://img.shields.io/badge/Live%20Demo-jeffreysanford.us-blue?style=for-the-badge" alt="Live Demo"></a>
  <a href="https://jeffreysanford.us/api/swagger"><img src="https://img.shields.io/badge/API%20Docs-Swagger-green?style=for-the-badge" alt="API Documentation"></a>
  <a href="https://angular.io/"><img src="https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular" alt="Angular 19"></a>
  <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS"></a>
  <a href="https://golang.org/"><img src="https://img.shields.io/badge/Go-1.21-00ADD8?style=for-the-badge&logo=go" alt="Go"></a>
</p>

## 📚 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Applications](#-applications)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Live Documentation](#-live-documentation)
- [Performance Testing](#-performance-testing)
- [Contributing](#-contributing)
- [About the Author](#-about-the-author)
- [License](#-license)

## 🔭 Overview

Craft Fusion is an advanced monorepo built with Nx that demonstrates enterprise-grade architecture with a focus on performance, scalability, and developer experience. The project features a patriotic theme throughout its design system and showcases modern web development best practices.

### Visit the Live Site

🌐 [jeffreysanford.us](https://jeffreysanford.us)

### API Documentation

📘 [Swagger API Docs](https://jeffreysanford.us/api/swagger)

## 🛠 Tech Stack

- **Monorepo Management**: [Nx](https://nx.dev/)
- **Frontend**: [Angular 19](https://angular.io/) with Material Design 3
- **API Services**: 
  - [NestJS](https://nestjs.com/) (TypeScript-based API)
  - [Go](https://golang.org/) (High-performance API alternative)
- **Storage**: 
  - MongoDB for document storage
  - File-based storage for documents and assets
- **Real-time Communication**: WebSockets with Socket.IO
- **Documentation**: Comprehensive markdown docs with vibrant themes

## 🧩 Applications

### 🎭 craft-web (Angular Frontend)

Our Angular 19 frontend features:

- Material Design 3 implementation with a patriotic theme
- Adaptive components for mobile and desktop
- Real-time data visualization
- WebSocket integration
- Advanced state management
- Accessibility-first approach

```bash
# Start Angular frontend
nx serve craft-web
```

### 🪶 craft-nest (NestJS Backend)

The NestJS backend provides:

- RESTful API endpoints
- WebSocket servers for real-time updates
- MongoDB integration
- JWT authentication
- Role-based access control
- Swagger API documentation

```bash
# Start NestJS backend
nx serve craft-nest
```

### 🚀 craft-go (Go Backend)

Our Go backend offers:

- High-performance alternative API
- Enhanced throughput for data-intensive operations
- Comparable interface to the NestJS backend
- Superior memory management for large datasets

```bash
# Start Go backend
nx serve craft-go
```

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- npm v10+
- Go v1.21+
- MongoDB (optional for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/JeffreySanford/craft-fusion.git
cd craft-fusion

# Install dependencies (ONE package.json at the root only!)
npm install

# Build all projects
npx nx run-many --target=build --all

# Start all applications
npx nx run-many --target=serve --all
```

## 📚 Documentation

> 📣 **ATTENTION!** We have extensive documentation available in the `documentation` folder!

For more detailed information, check out our comprehensive documentation:

| Document | Description |
|----------|-------------|
| [WEBSOCKET-BEHAVIOR.md](documentation/WEBSOCKET-BEHAVIOR.md) | WebSocket architecture and connection patterns |
| [UTILITIES.md](documentation/UTILITIES.md) | Common utility services reference |
| [TROUBLESHOOTING.md](documentation/TROUBLESHOOTING.md) | Solutions to common development issues |
| [THIRD-PARTY-SERVICES.md](documentation/THIRD-PARTY-SERVICES.md) | External service integrations |
| [STATE-MANAGEMENT.md](documentation/STATE-MANAGEMENT.md) | Application state management approach |
| [SOCKET-SERVICES.md](documentation/SOCKET-SERVICES.md) | Real-time socket communication services |
| [PROJECT_STATUS.md](documentation/PROJECT_STATUS.md) | Current development status and roadmap |
| [MARKDOWN-STANDARDS.md](documentation/MARKDOWN-STANDARDS.md) | Documentation formatting guidelines |
| [LOGGING.md](documentation/logging.md) | Logger service and monitoring features |
| [ENTITY-VALIDATION.md](documentation/Entity-Validation.md) | Data validation patterns and best practices |
| [DESIGN.md](documentation/DESIGN.md) | Design system specifications |
| [CONTRIBUTING.md](documentation/CONTRIBUTING.md) | Guide for contributors |
| [CODING-STANDARDS.md](documentation/CODING-STANDARDS.md) | Code style and best practices |
| [CHANGELOG.md](documentation/CHANGELOG.md) | Version history and changes |
| [AUTH-STRUCTURE.md](documentation/AUTH-STRUCTURE.md) | Authentication architecture |
| [API-SERVICE.md](documentation/API-SERVICE.md) | API communication layer details |
| [API-SERVICE-ARCHITECTURE.md](documentation/API-SERVICE-ARCHITECTURE.md) | API service design patterns |
| [API-INTEGRATION.md](documentation/API-INTEGRATION.md) | External API integration guidelines |
| [AUTHENTICATION.md](documentation/AUTHENTICATION.md) | Authentication and authorization details |

## 🌟 Live Documentation

<p align="center">
  <img src="assets/documentation-preview.png" alt="Documentation Preview" width="600"/>
</p>

### ✨ Learn as You Build

Our documentation isn't just static text – it's a living resource that grows with the project! 

> 🔥 **HOT TIP**: Navigate to http://jeffreysanford.us/docs for the latest interactive documentation with live examples!

### 📊 Visual Learning with Interactive Examples

The documentation includes interactive diagrams, code snippets you can run directly in your browser, and performance visualizations that showcase real-time metrics.

### 🛠 Craft Your Understanding

Like the project itself, our documentation embraces a craft mentality – building knowledge piece by piece with practical examples and clear guidance.

## 📈 Performance Testing

Compare the performance of our dual backend implementations:

```bash
# Generate 100,000 records with NestJS
curl http://localhost:3000/api/records/generate?count=100000

# Generate 100,000 records with Go
curl http://localhost:4000/records/generate?count=100000

# Benchmark retrieval performance
time curl http://localhost:3000/api/records?limit=10000
time curl http://localhost:4000/records?limit=10000
```

## 🤝 Contributing

We welcome contributions from the community! Please read our [CONTRIBUTING.md](documentation/CONTRIBUTING.md) guide to get started.

**Important Repository Rules:**
- **ONLY ONE package.json** is allowed in the entire repository (at the root)
- Individual applications must NOT have their own package.json files
- All dependencies must be managed through the root package.json

## 👨‍💻 About the Author

**Jeffrey Sanford** is a seasoned full-stack developer and solution architect with over a decade of experience in enterprise applications and cutting-edge web technologies. With expertise spanning Angular, TypeScript, NestJS, Go, and cloud infrastructure, Jeffrey has delivered robust solutions across FinTech, healthcare, e-commerce, and government sectors. Through Craft Fusion, he demonstrates his passion for clean architecture, modern development practices, and innovative design patterns while incorporating a distinctive patriotic aesthetic throughout the platform.

> **Message to Junior Developers:** I intentionally keep this repository public so you can freely use whatever code you find helpful—after all, I learned the same way! Real coding isn't about perfection; it's about writing, breaking, and fixing code thousands of times. That grueling, nerve-wracking process of trial and error is truly the only way to learn. So fork away, break things, and build your own solutions!

Connect with Jeffrey:
- 🌐 [jeffreysanford.us](https://jeffreysanford.us)
- 💼 [LinkedIn](https://linkedin.com/in/jeffreysanford)
- 🐦 [Twitter](https://twitter.com/jeffreysanford)
- 📧 [jeffreysanford@gmail.com](mailto:jeffreysanford@gmail.com)

## 📜 License

### The "WITH LOVE" License

Copyright (c) 2025 Jeffrey Sanford

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

1. The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

2. The Software shall be used WITH LOVE, kindness, and respect for others.

3. Users of the Software agree to spread positivity and helpfulness in the developer community.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

<p align="center">
  Made with ❤️ and 🇺🇸 patriotic spirit by Jeffrey Sanford
</p>
