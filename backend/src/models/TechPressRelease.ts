/**
 * ⚠️ 警告: 此模型已废弃
 * 
 * tech_press_releases 表已从数据库中移除。
 * 技术通稿现在采用JSON存储策略，数据存储在 workflow_executions.outputs 字段中。
 * 
 * 原因:
 * - 这些内容采用"临时生成、立即使用"的业务模式
 * - 不需要独立的搜索、筛选、版本控制功能
 * - 存储在 workflow_executions.outputs 中更灵活、更轻量
 * 
 * 如需使用技术通稿数据，请从 workflow_executions 表中查询 outputs 字段。
 * 
 * @deprecated 此模型已废弃，请使用 workflow_executions 表
 */

import { DatabaseManager } from '../config/database';
import { 
  TechPressRelease, 
  CreateTechPressReleaseDTO, 
  UpdateTechPressReleaseDTO, 
  QueryOptions, 
  PaginatedResult
} from '../types/database';

/**
 * @deprecated 此模型已废弃，tech_press_releases 表已移除
 */
export class TechPressReleaseModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建技术通稿
   */
  async create(data: CreateTechPressReleaseDTO): Promise<TechPressRelease> {
    const sql = `
      INSERT INTO tech_press_releases (
        project_id, title, subtitle, content, summary, release_type, 
        target_media, publication_date, status, seo_keywords, 
        generation_params, dify_task_id, created_by, reviewed_by, published_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.project_id || null,
      data.title,
      data.subtitle || null,
      data.content,
      data.summary || null,
      data.release_type,
      data.target_media ? JSON.stringify(data.target_media) : null,
      data.publication_date || null,
      data.status || 'draft',
      data.seo_keywords ? JSON.stringify(data.seo_keywords) : null,
      data.generation_params ? JSON.stringify(data.generation_params) : null,
      data.dify_task_id || null,
      data.created_by || null,
      data.reviewed_by || null,
      data.published_by || null
    ];

    const result = await this.db.query(sql, values);
    const lastId = (result as any).lastID || (result as any).id;
    return this.findById(lastId) as Promise<TechPressRelease>;
  }

  /**
   * 根据ID获取技术通稿
   */
  async findById(id: number): Promise<TechPressRelease | null> {
    const sql = 'SELECT * FROM tech_press_releases WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return result.length > 0 ? this.parseRow(result[0]) as TechPressRelease : null;
  }

  /**
   * 获取所有技术通稿
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<TechPressRelease>> {
    let sql = 'SELECT * FROM tech_press_releases';
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
    const data = result.map((row: any) => this.parseRow(row)) as TechPressRelease[];
    
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
   * 更新技术通稿
   */
  async update(id: number, data: UpdateTechPressReleaseDTO): Promise<TechPressRelease | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'target_media' || key === 'seo_keywords' || key === 'generation_params') {
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
      UPDATE tech_press_releases 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.query(sql, values);
    return this.findById(id);
  }

  /**
   * 删除技术通稿
   */
  async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM tech_press_releases WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return (result as any).changes > 0;
  }

  /**
   * 添加对话关联
   */
  async addConversation(pressReleaseId: number, conversationId: string, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO tech_press_conversations (press_release_id, conversation_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [pressReleaseId, conversationId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 移除对话关联
   */
  async removeConversation(pressReleaseId: number, conversationId: string): Promise<boolean> {
    const sql = 'DELETE FROM tech_press_conversations WHERE press_release_id = ? AND conversation_id = ?';
    const result = await this.db.query(sql, [pressReleaseId, conversationId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取关联的对话列表
   */
  async getConversations(pressReleaseId: number): Promise<string[]> {
    const sql = 'SELECT conversation_id FROM tech_press_conversations WHERE press_release_id = ?';
    const result = await this.db.query(sql, [pressReleaseId]);
    return result.map((row: any) => row.conversation_id);
  }

  /**
   * 添加来源信息关联
   */
  async addSource(pressReleaseId: number, sourceId: number, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO tech_press_sources (press_release_id, source_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [pressReleaseId, sourceId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 移除来源信息关联
   */
  async removeSource(pressReleaseId: number, sourceId: number): Promise<boolean> {
    const sql = 'DELETE FROM tech_press_sources WHERE press_release_id = ? AND source_id = ?';
    const result = await this.db.query(sql, [pressReleaseId, sourceId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取关联的来源信息ID列表
   */
  async getSources(pressReleaseId: number): Promise<number[]> {
    const sql = 'SELECT source_id FROM tech_press_sources WHERE press_release_id = ?';
    const result = await this.db.query(sql, [pressReleaseId]);
    return result.map((row: any) => row.source_id);
  }

  /**
   * 解析数据库行
   */
  private parseRow(row: any): any {
    if (!row) return row;
    
    const parsed = { ...row };
    
    if (parsed.target_media && typeof parsed.target_media === 'string') {
      try {
        parsed.target_media = JSON.parse(parsed.target_media);
      } catch {
        parsed.target_media = [];
      }
    }
    
    if (parsed.seo_keywords && typeof parsed.seo_keywords === 'string') {
      try {
        parsed.seo_keywords = JSON.parse(parsed.seo_keywords);
      } catch {
        parsed.seo_keywords = [];
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
    if (parsed.publication_date && typeof parsed.publication_date === 'string') {
      parsed.publication_date = new Date(parsed.publication_date);
    }
    
    return parsed;
  }
}
