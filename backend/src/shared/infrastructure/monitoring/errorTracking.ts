/**
 * 错误追踪服务
 * 支持 Sentry 集成
 */
import * as Sentry from '@sentry/node';
import { logger } from '@/shared/lib/logger';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // 允许额外的字段
}

class ErrorTrackingService {
  private initialized = false;
  private sentryEnabled = false;

  /**
   * 初始化错误追踪服务
   */
  init() {
    if (this.initialized) {
      return;
    }

    // 初始化 Sentry（如果配置了 DSN）
    const sentryDsn = process.env.SENTRY_DSN;
    if (sentryDsn) {
      try {
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          beforeSend(event, hint) {
            // 过滤掉一些不重要的错误
            if (event.exception) {
              const error = hint.originalException;
              if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
                return null; // 忽略连接拒绝错误
              }
            }
            return event;
          },
        });
        this.sentryEnabled = true;
        logger.info('Sentry 错误追踪已启用');
      } catch (error) {
        logger.warn('Sentry 初始化失败', { error });
      }
    } else {
      logger.info('Sentry DSN 未配置，使用本地日志记录');
    }

    // 捕获未处理的异常
    process.on('uncaughtException', (error) => {
      this.captureException(error, {
        level: 'fatal',
        tags: { type: 'uncaughtException' },
      });
    });

    // 捕获未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason) => {
      this.captureException(
        reason instanceof Error ? reason : new Error(String(reason)),
        {
          level: 'error',
          tags: { type: 'unhandledRejection' },
        },
      );
    });

    this.initialized = true;
    logger.info('错误追踪服务已初始化');
  }

  /**
   * 捕获异常
   */
  captureException(
    error: Error,
    options?: {
      level?: 'error' | 'warning' | 'info' | 'fatal';
      context?: ErrorContext;
      tags?: Record<string, string>;
    },
  ) {
    const { level = 'error', context, tags } = options || {};

    // 记录到日志
    const logLevel = level === 'fatal' ? 'error' : level === 'warning' ? 'warn' : level;
    logger[logLevel as 'error' | 'warn' | 'info'](error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      tags,
    });

    // 发送到 Sentry
    if (this.sentryEnabled) {
      Sentry.withScope((scope) => {
        // 设置级别
        scope.setLevel(this.mapLevelToSentry(level));

        // 设置上下文
        if (context) {
          if (context.userId) {
            scope.setUser({ id: context.userId });
          }
          if (context.metadata) {
            scope.setContext('custom', context.metadata);
          }
        }

        // 设置标签
        if (tags) {
          Object.entries(tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        Sentry.captureException(error);
      });
    }
  }

  /**
   * 捕获消息
   */
  captureMessage(
    message: string,
    options?: {
      level?: 'error' | 'warning' | 'info';
      context?: ErrorContext;
      tags?: Record<string, string>;
    },
  ) {
    const { level = 'info', context, tags } = options || {};

    const logLevel = level === 'warning' ? 'warn' : level;
    logger[logLevel as 'error' | 'warn' | 'info'](message, { context, tags });

    // 发送到 Sentry
    if (this.sentryEnabled) {
      Sentry.withScope((scope) => {
        scope.setLevel(this.mapLevelToSentry(level));

        if (context) {
          if (context.userId) {
            scope.setUser({ id: context.userId });
          }
          if (context.metadata) {
            scope.setContext('custom', context.metadata);
          }
        }

        if (tags) {
          Object.entries(tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        Sentry.captureMessage(message);
      });
    }
  }

  /**
   * 设置用户上下文
   */
  setUser(userId: string, metadata?: Record<string, unknown>) {
    if (this.sentryEnabled) {
      Sentry.setUser({ id: userId, ...metadata });
    }
  }

  /**
   * 设置标签
   */
  setTag(key: string, value: string) {
    if (this.sentryEnabled) {
      Sentry.setTag(key, value);
    }
  }

  /**
   * 映射日志级别到 Sentry 级别
   */
  private mapLevelToSentry(level: string): Sentry.SeverityLevel {
    switch (level) {
      case 'fatal':
        return 'fatal';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'error';
    }
  }
}

export const errorTracking = new ErrorTrackingService();

