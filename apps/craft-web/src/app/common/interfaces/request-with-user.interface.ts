export interface RequestWithUser {
  user?: {
    id: string;
    username?: string;
    email?: string;
    roles?: string[];
    [key: string]: unknown;
  };
}
