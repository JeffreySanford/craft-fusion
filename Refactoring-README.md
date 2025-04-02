# Craft Fusion Refactoring Guide

This document provides guidelines for refactoring code within the Craft Fusion project.

## Refactoring Principles

1. **Incremental Changes**: Make small, focused changes rather than large rewrites
2. **Maintain Tests**: Ensure tests pass before and after refactoring
3. **Code Coverage**: Add tests for untested code before refactoring
4. **One Concern at a Time**: Separate refactoring from feature work
5. **Documentation**: Update documentation to reflect architectural changes

## Common Refactoring Patterns

### Angular Frontend

#### Circular Dependencies

Circular dependencies are a common issue, particularly between services. Here's how to resolve them:

1. **Identify the cycle**: Use tools like Madge to find circular dependencies
2. **Apply Mediator Pattern**: Create an intermediary service that both dependencies use
3. **Use Injection Tokens**: For complex cases, use injection tokens and factories
4. **Forward References**: As a last resort, use `forwardRef()` in Angular DI system

Example:

```typescript
// Before: Circular dependency between ServiceA and ServiceB

// After: Using an intermediary service
@Injectable({ providedIn: 'root' })
export class MediatorService {
  // Shared functionality
}

@Injectable({ providedIn: 'root' })
export class ServiceA {
  constructor(private mediator: MediatorService) {}
}

@Injectable({ providedIn: 'root' })
export class ServiceB {
  constructor(private mediator: MediatorService) {}
}
```

#### Component Decomposition

When components grow too large:

1. Extract reusable parts into separate components
2. Move complex logic to services
3. Use presentation/container component pattern
4. Consider using facade services to simplify component logic

### NestJS Backend

#### Module Restructuring

To improve maintainability:

1. Group related functionality into feature modules
2. Use shared modules for common functionality
3. Ensure each module has a single responsibility
4. Use providers properly for better dependency injection

#### Performance Optimization

1. Add caching for expensive operations
2. Use streams for large data transfers
3. Implement proper error handling and retry mechanisms

## Refactoring Workflow

1. **Identify**: Use metrics and code analysis to identify areas needing refactoring
2. **Plan**: Document the current architecture and planned changes
3. **Test**: Ensure adequate test coverage before starting
4. **Implement**: Make incremental changes with frequent commits
5. **Verify**: Run tests after each significant change
6. **Document**: Update documentation to reflect new architecture
7. **Review**: Have team members review the changes

## Tools

- **Code Analysis**: SonarQube, ESLint
- **Dependency Analysis**: Madge, npm-check
- **Performance Testing**: Lighthouse, WebPageTest
- **Visualization**: Angular Compiler Visualization, NestJS graph

## Examples

See the `examples/refactoring/` directory for sample refactorings:

- Converting to reactive forms
- Implementing repository pattern
- Optimizing change detection
- Breaking down monolithic services

## Additional Resources

- [Angular Style Guide](https://angular.io/guide/styleguide)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Effective Go](https://golang.org/doc/effective_go)
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html) by Martin Fowler
