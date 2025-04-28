# Authentication and Authorization

Authentication and authorization are primarily managed by `AuthenticationService`, `SessionService`, and `AuthorizationService`. An alternative `AuthService` also exists.

## AuthenticationService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\authentication.service.ts`)

This is the main service for handling user authentication state and operations.

### Responsibilities

*   **Login/Logout:** Provides `login()` and `logout()` methods.
    *   `login()`: Sends credentials (`username`, `password`) to `/api/auth/login`. On success, stores the received token, updates user state (`currentUserSubject`, `isLoggedIn`, `isAuthenticated`, `isAdminSubject`), updates `SessionService`, logs the event, and relies on the calling component for navigation. Includes basic offline/dev mode fallback for user 'test'/'test'. Uses a request timeout.
    *   `logout()`: Clears the token, resets user/auth state subjects, clears `SessionService`, logs the event, and navigates to the login page.
*   **Token Management:** Stores the authentication token (`auth_token`) in `localStorage` (`setAuthToken`, `getAuthToken`, `TOKEN_KEY`). *Note: Security comment suggests considering HttpOnly cookies.*
*   **User State:** Maintains the current user's information (`User` interface from `SessionService`) in a `BehaviorSubject` (`currentUserSubject`, exposed as `currentUser$`). Initializes with a default anonymous user.
*   **Authentication Status:** Tracks login status (`isLoggedIn$`), authentication status (`isAuthenticated`), and admin status (`isAdmin$`) via `BehaviorSubject`s.
*   **Initialization (`initializeAuthentication`):** Checks for an existing token on startup. If found, attempts to validate it via `SessionService.validateToken` and fetch user details from `/api/auth/user`. Updates state accordingly or logs out if validation fails. *Note: Currently clears any existing token on init, effectively disabling auto-login.*

### Dependencies

*   `HttpClient`: For making login and user info requests.
*   `Router`: For navigation after logout.
*   `NotificationService`: (Injected but not used in the provided snippet).
*   `SessionService`: For setting/clearing user session data and validating tokens.
*   `LoggerService`: For logging authentication events.

## SessionService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\session.service.ts`)

Provides basic interaction with `sessionStorage` for user session information and includes a placeholder token validation.

### Responsibilities

*   **Session Storage:** Stores/retrieves the username in `sessionStorage` (`getUserSession`, `setUserSession`, `clearUserSession`). Uses the `User` interface.
*   **Token Validation (`validateToken`):** A placeholder method comparing the provided token with the username stored in `sessionStorage`. *Note: This is insecure and should involve backend validation in a real application.* Returns an `Observable<boolean>`.
*   **Status (`status`):** Placeholder method returning `false`.

## AuthorizationService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\authorization.service.ts`)

A placeholder service for checking resource access permissions.

### Responsibilities

*   **Access Check (`canAccessResource`):** A placeholder method returning `true` only if the resource name is 'admin'. *Note: Needs implementation based on actual user roles/permissions.* Returns an `Observable<boolean>`.

## AuthService (Alternative)

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\auth.service.ts`)

This service appears to be a simpler or alternative implementation for authentication state, potentially for components not needing full user details.

### Responsibilities

*   **Login/Logout:** Simulates login/logout (`login`, `logout`). Updates `isLoggedIn$` and `isAdmin$` subjects. Stores/removes a token in `localStorage`.
*   **Token Management:** Stores/retrieves a token (`auth_token`) from `localStorage` (`getAuthToken`).
*   **State:** Exposes `isLoggedIn$` and `isAdmin$` observables. Checks for token on initialization.

*Note: There is a significant overlap between `AuthenticationService` and `AuthService`. Clarify which one is the primary service and consider consolidating or clearly defining their distinct roles.*
