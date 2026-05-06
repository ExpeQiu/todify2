import { useEffect, useState } from 'react';
import {
  getToken,
  parseToken,
  isTokenExpired,
  redirectToLogin,
  buildSafeReturnPath,
  isGeelyhubAuthEnforced,
} from '@/lib/geelyhubAuth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * 认证初始化组件
 * - 从 URL 参数提取 token 并存储
 * - 检查登录状态，未登录则跳转
 * - 提供用户信息给下游消费
 */
export function AuthInitializer({ children }: AuthInitializerProps) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // 1. 从 URL 参数中提取 token（OAuth 回调场景）
    const url = new URL(window.location.href);
    const urlToken = (url.searchParams.get('token') || '').trim();
    if (urlToken) {
      localStorage.setItem('geelyhub_auth_token', urlToken);
      localStorage.setItem('auth_token', urlToken);
      // 清除 URL 中的 token 参数
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    // 2. 兼容旧 auth_token key → 迁移到 geelyhub_auth_token
    const oldToken = localStorage.getItem('auth_token');
    if (oldToken && !localStorage.getItem('geelyhub_auth_token')) {
      localStorage.setItem('geelyhub_auth_token', oldToken);
    }

    // 3. 检查登录状态（开发默认不强制跳转，见 isGeelyhubAuthEnforced）
    const token = getToken();
    if (isGeelyhubAuthEnforced() && (!token || isTokenExpired())) {
      redirectToLogin(buildSafeReturnPath());
      return;
    }

    // 4. 解析用户信息并输出到 console
    const payload = parseToken(token);
    if (payload) {
      console.log('[Auth] User logged in:', payload.name, payload.employee_id);
    }

    setAuthReady(true);
  }, []);

  if (!authReady) {
    return null;
  }

  return <>{children}</>;
}
