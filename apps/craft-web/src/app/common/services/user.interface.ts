export interface User {
    username: string;
    email: string;
    password: string;
    id: number;
    firstName: string;
    lastName: string;
    name?: string; // Optional string that can be set manually
    roles: string[];
  }