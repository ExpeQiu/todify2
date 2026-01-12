import { DatabaseManager } from '../config/database';

// ==================== 类型定义 ====================

/**
 * 执行追踪记录
 */
export interface ExecutionTrace {
  id: string;
  execution_id: string;
  agent_id: string;
  step_name: string;
  step_type: string;
  input?: string; // JSON字符串
  output?: string; // JSON字符串
  duration?: number; // 毫秒
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  metadata?: string; // JSON字符串
  created_at: string;
}

/**
 * DTO接口
 */
export interface CreateExecutionTraceDTO {
  id?: string;
  execution_id: string;
  agent_id: string;
  step_name: string;
  step_type: string;
  input?: any;
  output?: any;
  duration?: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  metadata?: any;
}

// ==================== 模型类 ====================

/**
 * 执行追踪模型
 */
export class ExecutionTraceModel {
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
      CREATE TABLE IF NOT EXISTS execution_traces (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        step_name TEXT NOT NULL,
        step_type TEXT NOT NULL,
        input TEXT,
        output TEXT,
        duration INTEGER,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
        error TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_execution_traces_execution_id 
      ON execution_traces(execution_id)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_execution_traces_agent_id 
      ON execution_traces(agent_id)
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_execution_traces_created_at 
      ON execution_traces(created_at)
    `);
  }

  /**
   * 创建追踪记录
   */
  async create(data: CreateExecutionTraceDTO): Promise<ExecutionTrace> {
    await this.ensureConnection();

    const id = data.id || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const inputJson = data.input ? JSON.stringify(data.input) : null;
    const outputJson = data.output ? JSON.stringify(data.output) : null;
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

    await this.db.query(
      `INSERT INTO execution_traces 
       (id, execution_id, agent_id, step_name, step_type, input, output, duration, status, error, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.execution_id,
        data.agent_id,
        data.step_name,
        data.step_type,
        inputJson,
        outputJson,
        data.duration || null,
        data.status,
        data.error || null,
        metadataJson,
        now
      ]
    );

    return await this.getById(id) as ExecutionTrace;
  }

  /**
   * 根据ID获取追踪记录
   */
  async getById(id: string): Promise<ExecutionTrace | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM execution_traces WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      execution_id: row.execution_id,
      agent_id: row.agent_id,
      step_name: row.step_name,
      step_type: row.step_type,
      input: row.input,
      output: row.output,
      duration: row.duration,
      status: row.status,
      error: row.error,
      metadata: row.metadata,
      created_at: row.created_at
    };
  }

  /**
   * 根据执行ID获取所有追踪记录
   */
  async getByExecutionId(executionId: string): Promise<ExecutionTrace[]> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM execution_traces WHERE execution_id = ? ORDER BY created_at ASC';
    const result = await this.db.query(sql, [executionId]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.map((row: any) => ({
      id: row.id,
      execution_id: row.execution_id,
      agent_id: row.agent_id,
      step_name: row.step_name,
      step_type: row.step_type,
      input: row.input,
      output: row.output,
      duration: row.duration,
      status: row.status,
      error: row.error,
      metadata: row.metadata,
      created_at: row.created_at
    }));
  }

  /**
   * 根据Agent ID获取追踪记录
   */
  async getByAgentId(agentId: string, limit: number = 100): Promise<ExecutionTrace[]> {
    await this.ensureConnection();

    const sql = `
      SELECT * FROM execution_traces 
      WHERE agent_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const result = await this.db.query(sql, [agentId, limit]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.map((row: any) => ({
      id: row.id,
      execution_id: row.execution_id,
      agent_id: row.agent_id,
      step_name: row.step_name,
      step_type: row.step_type,
      input: row.input,
      output: row.output,
      duration: row.duration,
      status: row.status,
      error: row.error,
      metadata: row.metadata,
      created_at: row.created_at
    }));
  }

  /**
   * 删除执行追踪记录
   */
  async deleteByExecutionId(executionId: string): Promise<boolean> {
    await this.ensureConnection();

    const sql = 'DELETE FROM execution_traces WHERE execution_id = ?';
    const result: any = await this.db.query(sql, [executionId]);

    return (result.changes && result.changes > 0) || false;
  }
}

