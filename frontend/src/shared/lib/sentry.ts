/**
 * Sentry 错误追踪初始化
 */
import * as Sentry from '@sentry/react';

/**
 * 初始化 Sentry
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.info('Sentry DSN 未配置，错误追踪已禁用');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // 过滤掉一些不重要的错误
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // 忽略网络错误
          if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            return null;
          }
          // 忽略取消的请求
          if (error.message.includes('canceled') || error.message.includes('aborted')) {
            return null;
          }
        }
      }
      return event;
    },
  });

  console.info('Sentry 错误追踪已启用');
}

/**
 * 设置用户上下文
 */
export function setSentryUser(userId: string, metadata?: Record<string, unknown>) {
  Sentry.setUser({ id: userId, ...metadata });
}

/**
 * 设置标签
 */
export function setSentryTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * 捕获异常
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
}

/**
 * 捕获消息
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

