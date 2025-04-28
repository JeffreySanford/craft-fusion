export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isAdmin?: boolean;
}
