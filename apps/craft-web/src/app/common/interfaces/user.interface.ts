export interface User {

  id: number;                                                                                    

  username: string;

  name?: string;

  firstName: string;

  lastName: string;

  email: string;

  password: string;

  roles: string[];

  isAdmin?: boolean;

  avatar?: string;

  bio?: string;

  jobTitle?: string;

  department?: string;

  contact?: {
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  status?: 'active' | 'inactive' | 'suspended' | 'pending';

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

  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    facebook?: string;
  };

  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastLoginAt?: Date | string;

  sessionData?: {
    token?: string;
    expiresAt?: Date | string;
    deviceInfo?: string;
  };

  permissions?: string[];

  [key: string]: unknown;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  expiresIn?: number;
  refreshExpiresIn?: number;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}
