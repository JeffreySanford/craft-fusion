# Craft Fusion Installation Guide

This guide will walk you through the process of setting up Craft Fusion for local development.

## Prerequisites

Make sure you have the following installed on your development machine:

| **Software**     | **Minimum Version** | **Recommended** | **Installation Link** |
|------------------|---------------------|-----------------|------------------------|
| **Node.js**      | v18.0.0             | v20.16.0        | [Node.js Download](https://nodejs.org/en/) |
| **npm**          | v9.0.0              | v10.8.1         | Included with Node.js |
| **Go**           | v1.20.0             | v1.23.4         | [Go Download](https://golang.org/dl/) |
| **Docker**       | Latest              | Latest          | [Docker Download](https://www.docker.com/products/docker-desktop/) |
| **Git**          | Latest              | Latest          | [Git Download](https://git-scm.com/downloads) |

### Dev Tools (Optional but Recommended)

- **NX CLI**: `npm install -g nx`
- **Angular CLI**: `npm install -g @angular/cli`
- **NestJS CLI**: `npm install -g @nestjs/cli`
- **Visual Studio Code**: [Download](https://code.visualstudio.com/)
  - Recommended extensions:
    - Angular Language Service
    - ESLint
    - Prettier
    - Go
    - Docker

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/craft-fusion.git
cd craft-fusion
```

### 2. Install Dependencies

```bash
# Install npm dependencies
npm install

# Install Go dependencies
cd apps/craft-go
go mod tidy
cd ../..
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following content:

## In-Memory Mongo Setup
For local development, Craft Fusion uses an in-memory MongoDB instance. Install the package:
```bash
npm install --save-dev mongodb-memory-server
```
Then in your NestJS or Node code, configure mongodb-memory-server for ephemeral data storage.

