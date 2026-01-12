import { DatabaseManager } from '../config/database';

// ==================== 类型定义 ====================

/**
 * 性能指标记录
 */
export interface PerformanceMetric {
  id: string;
  execution_id: string;
  metric_type: string; // 'execution_time', 'token_usage', 'tool_call', 'llm_call', etc.
  metric_name: string;
  value: number;
  unit: string; // 'ms', 'tokens', 'count', etc.
  metadata?: string; // JSON字符串
  created_at: string;
}

/**
 * DTO接口
 */
export interface CreatePerformanceMetricDTO {
  id?: string;
  execution_id: string;
  metric_type: string;
  metric_name: string;
  value: number;
  unit: string;
  metadata?: any;
}

// ==================== 模型类 ====================

/**
 * 性能指标模型
 */
export class PerformanceMetricModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 确保数据库连接
   */
  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库管理器未初始化');
    }
    await this.db.connect();
  }

  /**
   * 初始化表
   */
  async initializeTable(): Promise<void> {
    await this.ensureConnection();

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_execution_id 
      ON performance_metrics(execution_id)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type 
      ON performance_metrics(metric_type)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at 
      ON performance_metrics(created_at)
    `);
  }

  /**
   * 创建性能指标记录
   */
  async create(data: CreatePerformanceMetricDTO): Promise<PerformanceMetric> {
    await this.ensureConnection();

    const id = data.id || `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

    await this.db.query(
      `INSERT INTO performance_metrics 
       (id, execution_id, metric_type, metric_name, value, unit, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.execution_id,
        data.metric_type,
        data.metric_name,
        data.value,
        data.unit,
        metadataJson,
        now
      ]
    );

    return await this.getById(id) as PerformanceMetric;
  }

  /**
   * 批量创建性能指标记录
   */
  async createBatch(metrics: CreatePerformanceMetricDTO[]): Promise<void> {
    await this.ensureConnection();

    for (const metric of metrics) {
      await this.create(metric);
    }
  }

  /**
   * 根据ID获取性能指标记录
   */
  async getById(id: string): Promise<PerformanceMetric | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM performance_metrics WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      execution_id: row.execution_id,
      metric_type: row.metric_type,
      metric_name: row.metric_name,
      value: row.value,
      unit: row.unit,
      metadata: row.metadata,
      created_at: row.created_at
    };
  }

  /**
   * 根据执行ID获取所有性能指标
   */
  async getByExecutionId(executionId: string): Promise<PerformanceMetric[]> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM performance_metrics WHERE execution_id = ? ORDER BY created_at ASC';
    const result = await this.db.query(sql, [executionId]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.map((row: any) => ({
      id: row.id,
      execution_id: row.execution_id,
      metric_type: row.metric_type,
      metric_name: row.metric_name,
      value: row.value,
      unit: row.unit,
      metadata: row.metadata,
      created_at: row.created_at
    }));
  }

  /**
   * 获取性能统计信息
   */
  async getStatistics(executionId?: string, metricType?: string, startTime?: string, endTime?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byName: Record<string, { sum: number; avg: number; min: number; max: number; count: number }>;
    timeRange: { start: string; end: string } | null;
  }> {
    await this.ensureConnection();

    let sql = 'SELECT * FROM performance_metrics WHERE 1=1';
    const params: any[] = [];

    if (executionId) {
      sql += ' AND execution_id = ?';
      params.push(executionId);
    }

    if (metricType) {
      sql += ' AND metric_type = ?';
      params.push(metricType);
    }

    if (startTime) {
      sql += ' AND created_at >= ?';
      params.push(startTime);
    }

    if (endTime) {
      sql += ' AND created_at <= ?';
      params.push(endTime);
    }

    sql += ' ORDER BY created_at ASC';

    const result = await this.db.query(sql, params);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    const byType: Record<string, number> = {};
    const byName: Record<string, { sum: number; avg: number; min: number; max: number; count: number }> = {};
    let timeRange: { start: string; end: string } | null = null;

    rows.forEach((row: any) => {
      // 统计按类型
      byType[row.metric_type] = (byType[row.metric_type] || 0) + 1;

      // 统计按名称
      if (!byName[row.metric_name]) {
        byName[row.metric_name] = { sum: 0, avg: 0, min: Infinity, max: -Infinity, count: 0 };
      }
      const stat = byName[row.metric_name];
      stat.sum += row.value;
      stat.count += 1;
      stat.min = Math.min(stat.min, row.value);
      stat.max = Math.max(stat.max, row.value);
    });

    // 计算平均值
    Object.keys(byName).forEach(name => {
      const stat = byName[name];
      stat.avg = stat.count > 0 ? stat.sum / stat.count : 0;
    });

    // 计算时间范围
    if (rows.length > 0) {
      timeRange = {
        start: rows[0].created_at,
        end: rows[rows.length - 1].created_at
      };
    }

    return {
      total: rows.length,
      byType,
      byName,
      timeRange
    };
  }

  /**
   * 删除执行相关的性能指标
   */
  async deleteByExecutionId(executionId: string): Promise<boolean> {
    await this.ensureConnection();

    const sql = 'DELETE FROM performance_metrics WHERE execution_id = ?';
    const result: any = await this.db.query(sql, [executionId]);

    return (result.changes && result.changes > 0) || false;
  }
}

