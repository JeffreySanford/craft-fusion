# 🔐 Authentication & Authorization in Craft Fusion

This document details the authentication and authorization mechanisms implemented in Craft Fusion, with a focus on enterprise-grade security without external dependencies.

## Table of Contents

- [Overview](#overview)
- [Current Implementation](#current-implementation)
- [Enterprise Authentication Architecture](#enterprise-authentication-architecture)
- [Authorization Framework](#authorization-framework)
- [Secure Token Management](#secure-token-management)
- [Implementation Guide](#implementation-guide)
- [Security Best Practices](#security-best-practices)
- [Auditing Integration](#auditing-integration)

## Overview

Craft Fusion implements a secure, standards-compliant authentication system that can be entirely self-hosted for organizations with strict security requirements. This approach eliminates dependencies on external identity providers while maintaining enterprise-grade security.

## Current Implementation

### Frontend-to-Backend Authentication Flow

```ascii
┌─────────────┐      1. Login Request       ┌─────────────┐
│  craft-web  │ ──────────────────────────► │ craft-nest/ │
│  (Angular)  │                             │  craft-go   │
└─────────────┘                             └─────────────┘
       ▲                                           │
       │                                           │
       │      2. JWT + Refresh Token               │
       └───────────────────────────────────────────┘
```

1. The Angular frontend submits credentials via HTTPS POST endpoint
2. Backend validates credentials against hashed password store
3. Upon successful validation, the backend:
   - Creates a short-lived JWT (default: 15 minutes)
   - Issues a longer-lived refresh token (default: 7 days)
   - Stores refresh token hash in database with user context
4. Frontend stores tokens securely:
   - JWT in memory only (never in localStorage)
   - Refresh token in HttpOnly, Secure, SameSite=Strict cookie
5. Subsequent requests include JWT in Authorization header
6. When JWT expires, refresh token is used to obtain a new JWT

### Implementation Details

```typescript
// Sample Angular authentication service excerpt
@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<User | null>(null);
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<AuthResponseData> {
    return this.http.post<AuthResponseData>(
      `${environment.apiUrl}/auth/login`,
      { email, password }
    ).pipe(
      tap(response => {
        this.handleAuthentication(
          response.id,
          response.email,
          response.token,
          response.expiresIn,
          response.roles
        );
      })
    );
  }

  // In-memory token management
  private handleAuthentication(
    id: string,
    email: string,
    token: string,
    expiresIn: number,
    roles: string[]
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(id, email, token, expirationDate, roles);
    this.user$.next(user);
    
    // Auto-logout when token expires
    this.autoLogout(expiresIn * 1000);
  }
  
  // HttpOnly refresh token handled by browser automatically
}
```

## Enterprise Authentication Architecture

Enterprises can replace external authentication providers with an integrated self-hosted identity service:

### Self-Hosted Identity Provider

```ascii
                   ┌─────────────────────────────┐
                   │ Enterprise Identity Service │
                   │ (Extended craft-auth module)│
                   └──────────────┬──────────────┘
                                  │
                                  ▼
 ┌───────────────┐    ┌─────────────────────┐    ┌───────────────┐
 │  Directory    │◄───┤ Authentication API  │───►│  PKI System   │
 │  Services     │    │     (craft-auth)    │    │  (Optional)   │
 └───────────────┘    └─────────────────────┘    └───────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │      Applications       │
                     │ (craft-web, craft-nest) │
                     └─────────────────────────┘
```

### Core Components

1. **Central User Directory**
   - LDAP integration for corporate directories
   - Database-backed user store with policy enforcement
   - Multi-factor authentication support

2. **Enterprise SSO Capabilities**
   - SAML 2.0 provider for internal applications
   - OpenID Connect provider capabilities
   - Custom identity federation

3. **Advanced Authentication Methods**
   - X.509 certificate authentication
   - Smart card/PIV card integration
   - Hardware token support
   - FIDO2/WebAuthn support

### Implementation Example

```typescript
// In craft-auth module - LDAP integration
@Injectable()
export class LdapAuthenticationProvider implements AuthenticationProvider {
  constructor(
    private ldapService: LdapService,
    private configService: ConfigService
  ) {}

  async authenticate(username: string, password: string): Promise<User | null> {
    try {
      // Bind to LDAP server with provided credentials
      const ldapUser = await this.ldapService.authenticate(username, password);
      
      if (!ldapUser) {
        return null;
      }
      
      // Map LDAP attributes to user model
      return this.mapLdapUserToUser(ldapUser);
    } catch (error) {
      this.logger.error('LDAP authentication failed', error);
      return null;
    }
  }
  
  private mapLdapUserToUser(ldapUser: LdapUser): User {
    // Map LDAP groups to application roles
    const roles = this.mapLdapGroupsToRoles(ldapUser.groups);
    
    return {
      id: ldapUser.objectGUID,
      username: ldapUser.sAMAccountName,
      email: ldapUser.mail,
      displayName: ldapUser.displayName,
      roles: roles,
      // Additional properties
    };
  }
}
```

## Authorization Framework

Craft Fusion implements a robust authorization framework built on:

### Role-Based Access Control (RBAC)

```typescript
// Core roles with hierarchical permissions
export enum Role {
  VIEWER = 'viewer',     // Read-only access
  CONTRIBUTOR = 'contributor', // Can create/edit
  REVIEWER = 'reviewer', // Can approve/reject
  ADMIN = 'admin',       // Full system access
  SYSTEM = 'system'      // For service accounts
}

// Role-based guard implementation
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredRoles = route.data.roles as Role[];
    
    return this.authService.user$.pipe(
      take(1),
      map(user => {
        if (!user) {
          return false;
        }
        
        return requiredRoles.some(role => user.roles.includes(role));
      })
    );
  }
}
```

### Attribute-Based Access Control (ABAC)

For more granular control, ABAC extends RBAC with contextual attributes:

```typescript
// Policy evaluation service
@Injectable()
export class PolicyEvaluationService {
  evaluatePolicy(
    user: User,
    resource: any,
    action: string,
    context: Record<string, any>
  ): boolean {
    // Evaluate basic role permissions
    if (!this.hasRolePermission(user.roles, action)) {
      return false;
    }
    
    // Check attribute-based conditions
    switch (action) {
      case 'edit':
        // Users can only edit their own content unless they're admins
        return resource.ownerId === user.id || 
               user.roles.includes(Role.ADMIN);
      
      case 'approve':
        // Reviewers can approve, but not their own content
        return user.roles.includes(Role.REVIEWER) && 
               resource.ownerId !== user.id;
      
      case 'delete':
        // Check department-specific restrictions
        return this.evaluateDepartmentRestrictions(user, resource);
      
      default:
        return false;
    }
  }
}
```

### Permission Enforcement

Permissions are enforced at multiple levels:

1. **Route Guards**: Protect frontend routes
2. **API Guards**: Protect backend endpoints
3. **UI Adaptation**: Show/hide elements based on permissions
4. **Business Logic**: Enforce rules within service layer

## Secure Token Management

### JWT Structure

```typescript
// JWT payload structure
interface JwtPayload {
  sub: string;          // User ID
  email: string;        // User email
  roles: string[];      // User roles
  jti: string;          // Unique token ID
  iat: number;          // Issued at timestamp
  exp: number;          // Expiration timestamp
  custom_claims?: {     // Custom application-specific claims
    department?: string;
    region?: string;
    permissions?: string[];
  }
}
```

### Key Rotation Strategy

The system implements regular key rotation for all cryptographic materials:

1. **JWT Signing Keys**: Rotated every 90 days
2. **Refresh Tokens**: Individual expiry with forced rotation
3. **Encryption Keys**: Rotated according to security policy

### Token Revocation

For immediate access revocation:

```typescript
// Token blacklist service
@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private configService: ConfigService
  ) {}

  async blacklistToken(tokenId: string, expiryTime: number): Promise<void> {
    // Store token ID in Redis with TTL matching token expiry
    const ttl = expiryTime - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis.set(
        `blacklist:${tokenId}`, 
        '1',
        'EX',
        ttl
      );
    }
  }

  async isBlacklisted(tokenId: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${tokenId}`);
    return result !== null;
  }
}
```

## Implementation Guide

### Step 1: Setup Authentication Module

1. Create a dedicated `craft-auth` module in the monorepo
2. Configure JWT signing using asymmetric keys (RS256)
3. Implement token service for JWT creation and validation
4. Add secure cookie handling for refresh tokens

### Step 2: Integrate with Frontend

1. Create authentication service in Angular
2. Implement login, logout, and token refresh functionality
3. Add HTTP interceptor for attaching tokens to requests
4. Create route guards for protected routes

### Step 3: Add Authorization Framework

1. Define roles and permissions
2. Implement role-based guards
3. Add attribute-based policy evaluation
4. Create UI directives for permission-based rendering

### Step 4: Enterprise Extensions

1. Add LDAP/Active Directory integration
2. Implement SAML identity provider
3. Add support for X.509 certificates
4. Create MFA integration points

## Security Best Practices

The authentication system follows these security best practices:

- 🔴 **Never store JWT in localStorage or sessionStorage**
- ⚪ **Use HttpOnly cookies for persistent tokens**
- 🔵 **Implement proper CORS restrictions**
- 🔴 **Rate-limit authentication endpoints**
- ⚪ **Set appropriate token expiration times**
- 🔵 **Implement MFA for sensitive operations**
- 🔴 **Regularly rotate cryptographic keys**
- ⚪ **Log all authentication events**

## Auditing Integration

All authentication and authorization events are logged to the real-time auditing system:

```typescript
@Injectable()
export class AuthAuditService {
  constructor(private auditService: AuditService) {}
  
  logAuthEvent(
    userId: string, 
    event: AuthEventType, 
    metadata: Record<string, any>
  ): void {
    this.auditService.log({
      category: 'AUTH',
      action: event,
      userId: userId,
      timestamp: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      details: metadata
    });
  }
}
```

For complete details on audit logging, see the [Real-Time Auditing](./REAL-TIME-AUDITING.md) documentation.

---

For enterprise deployment details and advanced configurations, please contact the security team.
