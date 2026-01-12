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

## Getting Started

# Craft-Go: Go Backend Service

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
- **Web Framework**: Gin
- **Database**: MongoDB via the official Go driver
- **Caching**: Redis for distributed caching
- **Configuration**: Viper for configuration management
- **Logging**: Zap for structured logging
- **Real-time**: Gorilla WebSocket for WebSocket support
- **Documentation**: Swagger/OpenAPI via Swaggo
- **Testing**: Go's built-in testing package with Testify
- **Containerization**: Docker with multi-stage builds

## Application Structure

The application follows a clean, domain-driven architecture:
