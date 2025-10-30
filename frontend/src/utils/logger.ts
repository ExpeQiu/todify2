/**
 * 前端日志工具类
 * 提供统一的日志接口，根据环境自动切换日志行为
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  minLevel: LogLevel;
  remoteLogging: boolean;
  remoteUrl?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class FrontendLogger {
  private config: LogConfig;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;

    this.config = {
      enabled: true,
      minLevel: this.isDevelopment ? 'debug' : 'warn',
      remoteLogging: !this.isDevelopment,
      remoteUrl: import.meta.env.VITE_LOG_ENDPOINT,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  private logToConsole(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    const style = this.getLogStyle(level);

    switch (level) {
      case 'debug':
        console.debug(`%c${formattedMessage}`, style);
        break;
      case 'info':
        console.info(`%c${formattedMessage}`, style);
        break;
      case 'warn':
        console.warn(`%c${formattedMessage}`, style);
        break;
      case 'error':
        console.error(`%c${formattedMessage}`, style);
        if (meta?.stack) {
          console.error(meta.stack);
        }
        break;
    }
  }

  private getLogStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #6366f1; font-weight: normal',
      info: 'color: #22c55e; font-weight: normal',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
    };
    return styles[level];
  }

  private async sendToRemote(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.remoteLogging || !this.config.remoteUrl) return;

    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          meta,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      // 静默失败，避免日志上报影响用户体验
      if (this.isDevelopment) {
        console.error('Failed to send log to remote:', error);
      }
    }
  }

  // 基础日志方法
  debug(message: string, meta?: Record<string, unknown>): void {
    this.logToConsole('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logToConsole('info', message, meta);
    this.sendToRemote('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logToConsole('warn', message, meta);
    this.sendToRemote('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logToConsole('error', message, meta);
    this.sendToRemote('error', message, meta);
  }

  // 专用日志方法
  api(method: string, url: string, status?: number, duration?: number): void {
    const meta = { method, url, status, duration };
    const message = `API ${method} ${url}`;

    if (status && status >= 400) {
      this.warn(message, meta);
    } else {
      this.debug(message, meta);
    }
  }

  component(componentName: string, action: string, details?: Record<string, unknown>): void {
    this.debug(`[Component] ${componentName} - ${action}`, details);
  }

  workflow(step: string, action: string, details?: Record<string, unknown>): void {
    this.info(`[Workflow] ${step} - ${action}`, details);
  }

  exception(error: Error, context?: string): void {
    this.error(`[Exception] ${context || 'Unknown context'}`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }

  // 性能监控
  performance(metric: string, value: number, unit = 'ms'): void {
    this.debug(`[Performance] ${metric}: ${value}${unit}`);
  }

  // 用户行为追踪
  track(event: string, properties?: Record<string, unknown>): void {
    this.info(`[Track] ${event}`, properties);
  }

  // 更新配置
  configure(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 禁用所有日志
  disable(): void {
    this.config.enabled = false;
  }

  // 启用所有日志
  enable(): void {
    this.config.enabled = true;
  }
}

// 导出单例
export const logger = new FrontendLogger();

// 在开发环境下挂载到window对象，方便调试
if (import.meta.env.DEV) {
  (window as unknown as { logger: FrontendLogger }).logger = logger;
}

export default logger;
