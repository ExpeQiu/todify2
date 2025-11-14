/**
 * Prometheus 指标导出
 */
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

class PrometheusMetrics {
  private register: Registry;
  private httpRequestDuration: Histogram<string>;
  private httpRequestTotal: Counter<string>;
  private httpRequestErrors: Counter<string>;
  private activeConnections: Gauge<string>;
  private memoryUsage: Gauge<string>;

  constructor() {
    this.register = new Registry();

    // HTTP 请求持续时间（直方图）
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP 请求持续时间（秒）',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // HTTP 请求总数（计数器）
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'HTTP 请求总数',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // HTTP 错误请求数（计数器）
    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'HTTP 错误请求总数',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // 活跃连接数（仪表盘）
    this.activeConnections = new Gauge({
      name: 'http_active_connections',
      help: '当前活跃的 HTTP 连接数',
      registers: [this.register],
    });

    // 内存使用量（仪表盘）
    this.memoryUsage = new Gauge({
      name: 'process_memory_usage_bytes',
      help: '进程内存使用量（字节）',
      labelNames: ['type'],
      registers: [this.register],
    });

    // 收集默认指标（CPU、内存、事件循环等）
    collectDefaultMetrics({
      register: this.register,
      prefix: 'nodejs_',
    });
  }

  /**
   * Express 中间件：记录 HTTP 请求指标
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      this.activeConnections.inc();

      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000; // 转换为秒
        const route = req.route?.path || req.path || 'unknown';
        const labels = {
          method: req.method,
          route,
          status_code: res.statusCode.toString(),
        };

        // 记录请求持续时间
        this.httpRequestDuration.observe(labels, duration);

        // 记录请求总数
        this.httpRequestTotal.inc(labels);

        // 记录错误请求
        if (res.statusCode >= 400) {
          this.httpRequestErrors.inc(labels);
        }

        this.activeConnections.dec();
      });

      next();
    };
  }

  /**
   * 更新内存使用指标
   */
  updateMemoryMetrics() {
    const usage = process.memoryUsage();
    this.memoryUsage.set({ type: 'heap_used' }, usage.heapUsed);
    this.memoryUsage.set({ type: 'heap_total' }, usage.heapTotal);
    this.memoryUsage.set({ type: 'external' }, usage.external);
    this.memoryUsage.set({ type: 'rss' }, usage.rss);
  }

  /**
   * 获取指标注册表
   */
  getRegister(): Registry {
    return this.register;
  }

  /**
   * 获取指标文本格式（Prometheus 格式）
   */
  async getMetrics(): Promise<string> {
    this.updateMemoryMetrics();
    return this.register.metrics();
  }

  /**
   * 重置所有指标
   */
  reset() {
    this.register.resetMetrics();
  }
}

export const prometheusMetrics = new PrometheusMetrics();

