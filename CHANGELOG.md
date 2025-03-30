# Changelog

All notable changes to the Craft Fusion project will be documented in this file.

## [Unreleased]

### Added
- Comprehensive health monitoring system across all backend services
- Frontend health status indicators and visualizations
- Resilient multi-endpoint health checking with fallbacks
- Environment detection service for improved diagnostics
- HttpClientWrapperService to mediate HTTP operations
- Improved error handling for service initialization
- Documentation for preventing and resolving circular dependencies

### Fixed
- Critical circular dependency issue between ApiService and UserStateService
- Architectural refactoring to use HttpClientWrapperService as an intermediary
- Updated authentication flow to prevent circular reference issues
- Added proper service initialization order to prevent DI errors
- Health endpoints now correctly bypass authentication requirements

### Changed
- Modified ApiService to use HttpClientWrapperService instead of HttpClient directly
- Updated UserStateService to remove direct dependency on ApiService
- User and authentication services use optional dependencies with forwardRef where appropriate
- Health services now implement consistent interfaces across both backend frameworks

### Technical Debt
- Legacy shared dependencies need further refactoring to fully separate concerns
- Some services still rely on Injector pattern which should be replaced with cleaner DI

## [1.0.0] - 2023-03-15

### Added
- Initial release of Craft Fusion
- Angular frontend with Material Design 3
- NestJS and Go backend services
- Responsive layout system
