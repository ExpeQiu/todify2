/**
 * 性能监控中间件
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/lib/logger';

interface PerformanceMetrics {
  method: string;
  path: string;
  duration: number;
  statusCode: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000;

  /**
   * Express 中间件：记录请求性能
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const metric: PerformanceMetrics = {
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode,
          timestamp: Date.now(),
        };

        this.recordMetric(metric);

        // 记录慢请求
        if (duration > 1000) {
          logger.warn('慢请求检测', {
            method: req.method,
            path: req.path,
            duration,
            statusCode: res.statusCode,
          });
        }
      });

      next();
    };
  }

  /**
   * 记录性能指标
   */
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    if (this.metrics.length === 0) {
      return {
        total: 0,
        avgDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        slowRequests: [],
      };
    }

    const durations = this.metrics.map((m) => m.duration).sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    const slowRequests = this.metrics
      .filter((m) => m.duration > 1000)
      .slice(-10)
      .reverse();

    return {
      total: this.metrics.length,
      avgDuration: Math.round(avgDuration),
      p50,
      p95,
      p99,
      slowRequests: slowRequests.map((m) => ({
        method: m.method,
        path: m.path,
        duration: m.duration,
        statusCode: m.statusCode,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    };
  }

  /**
   * 清空指标
   */
  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

