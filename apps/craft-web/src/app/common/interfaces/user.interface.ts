/**
 * Core user interface for authentication and user management
 * Used throughout the application to maintain consistent user data structure
 */
export interface User {
  /** Unique identifier for the user */
  id: string | number;

  /** Username for login (unique) */
  username: string;

  /** Display name (may be different from username) */
  name?: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** Email address (should be unique) */
  email: string;

  /** Password - required for compatibility with SessionService */
  password: string;

  /**
   * User's role - determines permissions
   * Note: This may be a single role or a list of roles depending on the system
   */
  roles: string[];

  /** Flag indicating if user has administrative privileges */
  isAdmin?: boolean;

  /** URL to user's avatar/profile picture */
  avatar?: string;

  /** Short biography or description */
  bio?: string;

  /** User's job title or position */
  jobTitle?: string;

  /** User's department within organization */
  department?: string;

  /** User's contact information */
  contact?: {
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  /** User account status */
  status?: 'active' | 'inactive' | 'suspended' | 'pending';

  /** User interface preferences */
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    accessibility?: {
      fontSize?: number;
      highContrast?: boolean;
      reducedMotion?: boolean;
    };
  };

  /** Social media links */
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    facebook?: string;
  };

  /** Timestamps */
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastLoginAt?: Date | string;

  /** Session information */
  sessionData?: {
    token?: string;
    expiresAt?: Date | string;
    deviceInfo?: string;
  };

  /** Application-specific permissions beyond role */
  permissions?: string[];

  /**
   * Dynamic property access for custom fields
   * Allows adding additional properties not explicitly defined in the interface
   */
  [key: string]: unknown;
}

/**
 * Interface for user creation requests
 * Contains only the minimum fields required to create a new user
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

/**
 * Interface representing user authentication response
 */
export interface AuthResponse {
  user: User;
  expiresIn?: number;
  refreshExpiresIn?: number;
  message?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Interface for user login request
 */
export interface LoginRequest {
  username: string;
  password?: string;
  rememberMe?: boolean;
  roles?: string[];
}
