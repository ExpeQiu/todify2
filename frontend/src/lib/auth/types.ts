export interface UserPayload {
  sub: string;
  employee_id: string;
  name: string;
  department?: string;
  email?: string;
  role?: 'admin' | 'user';
  iat: number;
  exp: number;
}

export interface AuthState {
  user: UserPayload | null;
  token: string | null;
  isAuthenticated: boolean;
}
