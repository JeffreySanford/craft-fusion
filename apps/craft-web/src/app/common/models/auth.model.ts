export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  isAdmin: boolean;
  permissions?: string[];
  preferences?: UserPreferences;
  profile?: UserProfile;
  [key: string]: any;
}

export interface UserPreferences {
  theme?: string;
  avatar?: string;
  notifications?: boolean;
  [key: string]: any;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  issuedAt: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface TokenPayload {
  sub: string; // subject (user id)
  name?: string; // username
  email?: string;
  roles: string[];
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  iss?: string; // issuer
  aud?: string; // audience
  jti?: string; // JWT ID
  [key: string]: any;
}
