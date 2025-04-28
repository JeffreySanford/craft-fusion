# Authentication and Authorization Structure

## Overview

The authentication and authorization services have been moved to a dedicated `auth` folder to improve code organization and maintain separation of concerns. This document outlines the new structure and how to use these services.

## Folder Structure

```
c:\repos\craft-fusion\apps\craft-web\src\app\common\services\
├── auth\
│   ├── authentication.service.ts  # Handles user authentication 
│   ├── authorization.service.ts   # Manages user permissions
│   ├── auth-guards\               # Route guards for protected routes
│   │   ├── admin.guard.ts         # Admin role guard
│   │   ├── auth.guard.ts          # Basic authenticated user guard
│   │   └── role.guard.ts          # Role-based guard
│   ├── auth-interceptors\         # HTTP interceptors
│   │   ├── token.interceptor.ts   # Adds auth tokens to requests
│   │   └── auth-error.interceptor.ts # Handles authentication errors
│   └── models\                    # Authentication-related models
│       ├── user.model.ts          # User data structure
│       ├── credentials.model.ts   # Login credentials structure
│       └── token.model.ts         # Auth token structure
```

## Services

### AuthenticationService
(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\auth\authentication.service.ts`)

This service handles user authentication operations including login, logout, registration, password reset, and token management.

#### Key Methods:
- `login(credentials: Credentials): Observable<User>`
- `logout(): void`
- `register(userData: UserRegistration): Observable<User>`
- `refreshToken(): Observable<TokenResponse>`
- `forgotPassword(email: string): Observable<void>`
- `resetPassword(token: string, newPassword: string): Observable<void>`
- `isAuthenticated(): boolean`
- `getCurrentUser(): Observable<User>`

### AuthorizationService
(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\auth\authorization.service.ts`)

This service manages user permissions and access control throughout the application.

#### Key Methods:
- `hasPermission(permission: string): boolean`
- `hasRole(role: string | string[]): boolean`
- `getUserRoles(): string[]`
- `getUserPermissions(): string[]`
- `canAccess(resource: string, action: string): boolean`

## Usage Example

```typescript
import { AuthenticationService } from '../../common/services/auth/authentication.service';
import { AuthorizationService } from '../../common/services/auth/authorization.service';

@Component({
  selector: 'app-login',
  template: `
    <div *ngIf="isOffline" class="offline-banner">
      You are currently offline. Some features may be unavailable.
    </div>
    <div class="content">
      <!-- Component content -->
    </div>
  `
})
export class LoginComponent {
  constructor(
    private authService: AuthenticationService,
    private authzService: AuthorizationService
  ) {}
  
  login(username: string, password: string): void {
    this.authService.login({ username, password })
      .subscribe(user => {
        // Handle successful login
      });
  }
  
  checkAccess(): boolean {
    return this.authzService.hasPermission('users:edit');
  }
}
```

## Additional Resources
- See [API-SERVICE.md](./API-SERVICE.md) for details on secure API communication
- See [STATE-MANAGEMENT.md](./STATE-MANAGEMENT.md) for details on user state management
- See [CODING-STANDARDS.md](./CODING-STANDARDS.md) for authentication and authorization coding guidelines