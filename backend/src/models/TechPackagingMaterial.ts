import { DatabaseManager } from '../config/database';
import { 
  TechPackagingMaterial, 
  CreateTechPackagingMaterialDTO, 
  UpdateTechPackagingMaterialDTO, 
  QueryOptions, 
  PaginatedResult
} from '../types/database';

export class TechPackagingMaterialModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建技术包装材料
   */
  async create(data: CreateTechPackagingMaterialDTO): Promise<TechPackagingMaterial> {
    const sql = `
      INSERT INTO tech_packaging_materials (
        tech_point_id, project_id, title, content, material_type, 
        target_audience, language, status, generation_params, 
        dify_task_id, created_by, reviewed_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.tech_point_id,
      data.project_id || null,
      data.title,
      data.content,
      data.material_type,
      data.target_audience,
      data.language || 'zh',
      data.status || 'draft',
      data.generation_params ? JSON.stringify(data.generation_params) : null,
      data.dify_task_id || null,
      data.created_by || null,
      data.reviewed_by || null
    ];

    const result = await this.db.query(sql, values);
    const lastId = (result as any).lastID || (result as any).id;
    return this.findById(lastId) as Promise<TechPackagingMaterial>;
  }

  /**
   * 根据ID获取技术包装材料
   */
  async findById(id: number): Promise<TechPackagingMaterial | null> {
    const sql = 'SELECT * FROM tech_packaging_materials WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return result.length > 0 ? this.parseRow(result[0]) as TechPackagingMaterial : null;
  }

  /**
   * 获取所有技术包装材料
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<TechPackagingMaterial>> {
    let sql = 'SELECT * FROM tech_packaging_materials';
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
    const data = result.map((row: any) => this.parseRow(row)) as TechPackagingMaterial[];
    
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
   * 更新技术包装材料
   */
  async update(id: number, data: UpdateTechPackagingMaterialDTO): Promise<TechPackagingMaterial | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'generation_params') {
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
      UPDATE tech_packaging_materials 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.query(sql, values);
    return this.findById(id);
  }

  /**
   * 删除技术包装材料
   */
  async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM tech_packaging_materials WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return (result as any).changes > 0;
  }

  /**
   * 添加对话关联
   */
  async addConversation(packagingId: number, conversationId: string, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO tech_packaging_conversations (packaging_id, conversation_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [packagingId, conversationId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 移除对话关联
   */
  async removeConversation(packagingId: number, conversationId: string): Promise<boolean> {
    const sql = 'DELETE FROM tech_packaging_conversations WHERE packaging_id = ? AND conversation_id = ?';
    const result = await this.db.query(sql, [packagingId, conversationId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取关联的对话列表
   */
  async getConversations(packagingId: number): Promise<string[]> {
    const sql = 'SELECT conversation_id FROM tech_packaging_conversations WHERE packaging_id = ?';
    const result = await this.db.query(sql, [packagingId]);
    return result.map((row: any) => row.conversation_id);
  }

  /**
   * 添加来源信息关联
   */
  async addSource(packagingId: number, sourceId: number, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO tech_packaging_sources (packaging_id, source_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [packagingId, sourceId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 移除来源信息关联
   */
  async removeSource(packagingId: number, sourceId: number): Promise<boolean> {
    const sql = 'DELETE FROM tech_packaging_sources WHERE packaging_id = ? AND source_id = ?';
    const result = await this.db.query(sql, [packagingId, sourceId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取关联的来源信息ID列表
   */
  async getSources(packagingId: number): Promise<number[]> {
    const sql = 'SELECT source_id FROM tech_packaging_sources WHERE packaging_id = ?';
    const result = await this.db.query(sql, [packagingId]);
    return result.map((row: any) => row.source_id);
  }

  /**
   * 解析数据库行
   */
  private parseRow(row: any): any {
    if (!row) return row;
    
    const parsed = { ...row };
    
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
