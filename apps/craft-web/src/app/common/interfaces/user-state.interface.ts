export interface UserState {
  id: string;
  username: string;
  email?: string;
  isAdmin: boolean;
  roles: string[];
  preferences?: any;
  isAuthenticated: boolean;
  
  // Additional properties needed by UserStateModel
  name?: string;
  displayName?: string;
  isGuest?: boolean;
  permissions?: string[];
  avatarUrl?: string;
}

export interface UserStateChange {
  previous?: UserState;
  current: UserState;
  changedProperties: string[];
}

export interface LoginDateTimeDTO {
  timestamp: string;
  formatted: string;
  timeAgo: string;
}
