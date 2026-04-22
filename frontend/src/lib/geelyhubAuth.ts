const TOKEN_KEY = 'geelyhub_auth_token';
const GEELYHUB_LOGIN_URL = process.env.GEELYHUB_LOGIN_URL || 'http://localhost/';

/**
 * 获取当前 token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 保存 token
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 清除 token
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 检查 token 是否过期
 */
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;

  try {
    const payload = parseToken(token);
    if (!payload || !payload.exp) return true;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true;
  }
}

/**
 * 解析 token payload
 */
export function parseToken(token?: string): UserPayload | null {
  const t = token || getToken();
  if (!t) return null;

  try {
    const base64 = t.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * 跳转到 Geelyhub 统一登录
 */
export function redirectToLogin(targetPath: string = '/'): void {
  const returnUrl = encodeURIComponent(targetPath);
  window.location.href = `${GEELYHUB_LOGIN_URL}?return_url=${returnUrl}`;
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !isTokenExpired();
}

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
