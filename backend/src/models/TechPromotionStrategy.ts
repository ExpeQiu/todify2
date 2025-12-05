import { DatabaseManager } from '../config/database';
import { 
  TechPromotionStrategy, 
  CreateTechPromotionStrategyDTO, 
  UpdateTechPromotionStrategyDTO, 
  QueryOptions, 
  PaginatedResult
} from '../types/database';

export class TechPromotionStrategyModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建技术推广策略
   */
  async create(data: CreateTechPromotionStrategyDTO): Promise<TechPromotionStrategy> {
    const sql = `
      INSERT INTO tech_promotion_strategies (
        project_id, title, content, strategy_type, target_market, 
        timeline, budget_range, kpi_metrics, status, generation_params, 
        dify_task_id, created_by, reviewed_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.project_id || null,
      data.title,
      data.content,
      data.strategy_type,
      data.target_market || null,
      data.timeline ? JSON.stringify(data.timeline) : null,
      data.budget_range || null,
      data.kpi_metrics ? JSON.stringify(data.kpi_metrics) : null,
      data.status || 'draft',
      data.generation_params ? JSON.stringify(data.generation_params) : null,
      data.dify_task_id || null,
      data.created_by || null,
      data.reviewed_by || null
    ];

    const result = await this.db.query(sql, values);
    const lastId = (result as any).lastID || (result as any).id;
    return this.findById(lastId) as Promise<TechPromotionStrategy>;
  }

  /**
   * 根据ID获取技术推广策略
   */
  async findById(id: number): Promise<TechPromotionStrategy | null> {
    const sql = 'SELECT * FROM tech_promotion_strategies WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return result.length > 0 ? this.parseRow(result[0]) as TechPromotionStrategy : null;
  }

  /**
   * 获取所有技术推广策略
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<TechPromotionStrategy>> {
    let sql = 'SELECT * FROM tech_promotion_strategies';
    const values: any[] = [];
    const conditions: string[] = [];

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          conditions.push(`${key} IS NULL`);
        } else {
          conditions.push(`${key} = ?`);
          values.push(value);
        }
      });
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.db.query(countSql, values);
    const total = countResult[0].count;

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.db.query(sql, values);
    const data = result.map((row: any) => this.parseRow(row)) as TechPromotionStrategy[];
    
    const pageSize = options.limit || total;
    const page = options.offset ? Math.floor(options.offset / pageSize) + 1 : 1;
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 更新技术推广策略
   */
  async update(id: number, data: UpdateTechPromotionStrategyDTO): Promise<TechPromotionStrategy | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'timeline' || key === 'kpi_metrics' || key === 'generation_params') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    
    const sql = `
      UPDATE tech_promotion_strategies 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.query(sql, values);
    return this.findById(id);
  }

  /**
   * 删除技术推广策略
   */
  async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM tech_promotion_strategies WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return (result as any).changes > 0;
  }

  /**
   * 添加对话关联
   */
  async addConversation(promotionId: number, conversationId: string, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO tech_promotion_conversations (promotion_id, conversation_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [promotionId, conversationId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 移除对话关联
   */
  async removeConversation(promotionId: number, conversationId: string): Promise<boolean> {
    const sql = 'DELETE FROM tech_promotion_conversations WHERE promotion_id = ? AND conversation_id = ?';
    const result = await this.db.query(sql, [promotionId, conversationId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取关联的对话列表
   */
  async getConversations(promotionId: number): Promise<string[]> {
    const sql = 'SELECT conversation_id FROM tech_promotion_conversations WHERE promotion_id = ?';
    const result = await this.db.query(sql, [promotionId]);
    return result.map((row: any) => row.conversation_id);
  }

  /**
   * 添加来源信息关联
   */
  async addSource(promotionId: number, sourceId: number, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO tech_promotion_sources (promotion_id, source_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [promotionId, sourceId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 移除来源信息关联
   */
  async removeSource(promotionId: number, sourceId: number): Promise<boolean> {
    const sql = 'DELETE FROM tech_promotion_sources WHERE promotion_id = ? AND source_id = ?';
    const result = await this.db.query(sql, [promotionId, sourceId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取关联的来源信息ID列表
   */
  async getSources(promotionId: number): Promise<number[]> {
    const sql = 'SELECT source_id FROM tech_promotion_sources WHERE promotion_id = ?';
    const result = await this.db.query(sql, [promotionId]);
    return result.map((row: any) => row.source_id);
  }

  /**
   * 解析数据库行
   */
  private parseRow(row: any): any {
    if (!row) return row;
    
    const parsed = { ...row };
    
    if (parsed.timeline && typeof parsed.timeline === 'string') {
      try {
        parsed.timeline = JSON.parse(parsed.timeline);
      } catch {
        parsed.timeline = {};
      }
    }
    
    if (parsed.kpi_metrics && typeof parsed.kpi_metrics === 'string') {
      try {
        parsed.kpi_metrics = JSON.parse(parsed.kpi_metrics);
      } catch {
        parsed.kpi_metrics = {};
      }
    }
    
    if (parsed.generation_params && typeof parsed.generation_params === 'string') {
      try {
        parsed.generation_params = JSON.parse(parsed.generation_params);
      } catch {
        parsed.generation_params = {};
      }
    }
    
    if (parsed.created_at && typeof parsed.created_at === 'string') {
      parsed.created_at = new Date(parsed.created_at);
    }
    if (parsed.updated_at && typeof parsed.updated_at === 'string') {
      parsed.updated_at = new Date(parsed.updated_at);
    }
    
    return parsed;
  }
}
