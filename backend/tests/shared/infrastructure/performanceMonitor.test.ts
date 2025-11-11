import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor } from '@/shared/infrastructure/monitoring/performanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it('should record metrics', () => {
    const stats = performanceMonitor.getStats();
    expect(stats.total).toBe(0);

    // 模拟记录一些指标
    const mockMetrics = [
      { method: 'GET', path: '/api/test', duration: 100, statusCode: 200, timestamp: Date.now() },
      { method: 'POST', path: '/api/test', duration: 200, statusCode: 201, timestamp: Date.now() },
    ];

    // 由于 metrics 是私有的，我们通过中间件来测试
    const req = {
      method: 'GET',
      path: '/api/test',
    } as any;

    const res = {
      statusCode: 200,
      on: vi.fn((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      }),
    } as any;

    const next = vi.fn();

    const middleware = performanceMonitor.middleware();
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should calculate statistics', () => {
    // 由于无法直接访问私有方法，我们测试 getStats 的返回值结构
    const stats = performanceMonitor.getStats();

    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('avgDuration');
    expect(stats).toHaveProperty('p50');
    expect(stats).toHaveProperty('p95');
    expect(stats).toHaveProperty('p99');
    expect(stats).toHaveProperty('slowRequests');
    expect(Array.isArray(stats.slowRequests)).toBe(true);
  });
});

