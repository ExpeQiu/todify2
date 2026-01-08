import { performanceMetricModel } from '../models';

/**
 * 性能监控器
 * 用于收集和分析性能指标
 */
export class PerformanceMonitor {
  private currentExecutionId: string | null = null;
  private metrics: Array<{
    metric_type: string;
    metric_name: string;
    value: number;
    unit: string;
    metadata?: any;
  }> = [];

  /**
   * 开始监控
   */
  start(executionId: string): void {
    this.currentExecutionId = executionId;
    this.metrics = [];
  }

  /**
   * 结束监控并保存指标
   */
  async end(): Promise<void> {
    if (!this.currentExecutionId || this.metrics.length === 0) {
      return;
    }

    try {
      await performanceMetricModel.createBatch(
        this.metrics.map(metric => ({
          execution_id: this.currentExecutionId!,
          ...metric
        }))
      );
    } catch (error) {
      console.error('保存性能指标失败:', error);
    } finally {
      this.currentExecutionId = null;
      this.metrics = [];
    }
  }

  /**
   * 记录执行时间
   */
  recordExecutionTime(name: string, duration: number, metadata?: any): void {
    this.record('execution_time', name, duration, 'ms', metadata);
  }

  /**
   * 记录Token使用量
   */
  recordTokenUsage(name: string, tokens: number, metadata?: any): void {
    this.record('token_usage', name, tokens, 'tokens', metadata);
  }

  /**
   * 记录工具调用
   */
  recordToolCall(name: string, duration: number, metadata?: any): void {
    this.record('tool_call', name, 1, 'count', { duration, ...metadata });
  }

  /**
   * 记录LLM调用
   */
  recordLLMCall(name: string, duration: number, tokens: number, metadata?: any): void {
    this.record('llm_call', name, duration, 'ms', { tokens, ...metadata });
  }

  /**
   * 记录自定义指标
   */
  record(metric_type: string, metric_name: string, value: number, unit: string, metadata?: any): void {
    if (!this.currentExecutionId) {
      return;
    }

    this.metrics.push({
      metric_type,
      metric_name,
      value,
      unit,
      metadata
    });
  }

  /**
   * 获取当前执行的指标
   */
  getMetrics(): Array<{
    metric_type: string;
    metric_name: string;
    value: number;
    unit: string;
    metadata?: any;
  }> {
    return [...this.metrics];
  }
}

