export interface AuthenticatedUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles: string[];
  role: string;
}
