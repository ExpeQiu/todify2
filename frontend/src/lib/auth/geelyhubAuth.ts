import { getToken, parseToken } from '@/lib/geelyhubAuth';

export interface UseAuthResult {
  user: {
    name: string;
    employee_id: string;
    department?: string;
  } | null;
}

export function useAuth(): UseAuthResult {
  const token = getToken();
  const payload = token ? parseToken(token) : null;
  return {
    user: payload ? {
      name: payload.name,
      employee_id: payload.employee_id,
      department: payload.department,
    } : null,
  };
}
