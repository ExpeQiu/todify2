const TOKEN_KEY = 'geelyhub_auth_token';
const GEELYHUB_LOGIN_URL =
  import.meta.env.VITE_GEELYHUB_LOGIN_URL || 'http://localhost:5180/login';

/** 与 Router basename 一致；开发时 Vite base 可能为 /，不能依赖 import.meta.env.BASE_URL */
const TODIFY_PATH_PREFIX = '/todify';

/**
 * 获取当前 token（与门户统一 key 兼容）
 */
export function getToken(): string | null {
  const a = localStorage.getItem('auth_token')?.trim();
  const g = localStorage.getItem(TOKEN_KEY)?.trim();
  return g || a || null;
}

/**
 * 登录后回跳路径：去掉 target/return_url/token，避免未登录时在同域反复 ?target= 嵌套编码
 */
/**
 * 是否强制未登录跳转 Geelyhub：
 * 默认不强制，只有显式配置 VITE_REQUIRE_GEELYHUB_AUTH=true 才启用。
 */
export function isGeelyhubAuthEnforced(): boolean {
  const v = (import.meta.env.VITE_REQUIRE_GEELYHUB_AUTH || '').trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return false;
}

export function buildSafeReturnPath(): string {
  if (typeof window === 'undefined') {
    return `${TODIFY_PATH_PREFIX}/`;
  }
  const u = new URL(window.location.href);
  for (const k of ['token', 'target', 'return_url']) {
    u.searchParams.delete(k);
  }
  let path = `${u.pathname}${u.search}${u.hash}`;
  if (!path || path === '/' || !path.startsWith(TODIFY_PATH_PREFIX)) {
    path = `${TODIFY_PATH_PREFIX}/`;
  }
  return path;
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
  const sep = GEELYHUB_LOGIN_URL.includes('?') ? '&' : '?';
  window.location.href = `${GEELYHUB_LOGIN_URL}${sep}return_url=${returnUrl}`;
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
