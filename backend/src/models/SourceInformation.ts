import { DatabaseManager } from '../config/database';
import { 
  SourceInformation, 
  CreateSourceInformationDTO, 
  UpdateSourceInformationDTO, 
  QueryOptions, 
  PaginatedResult
} from '../types/database';

export class SourceInformationModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建来源信息
   */
  async create(data: CreateSourceInformationDTO): Promise<SourceInformation> {
    const sql = `
      INSERT INTO source_information (
        source_id, title, type, url, description, page_type, 
        conversation_id, project_id, metadata, status, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.source_id,
      data.title,
      data.type,
      data.url || null,
      data.description || null,
      data.page_type || null,
      data.conversation_id || null,
      data.project_id || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.status || 'active',
      data.created_by || null
    ];

    const result = await this.db.query(sql, values);
    const id = result.lastID || result.insertId;
    
    const sourceInfo = await this.findById(id);
    if (!sourceInfo) {
      throw new Error('Failed to create source information');
    }
    
    return sourceInfo;
  }

  /**
   * 根据ID获取来源信息
   */
  async findById(id: number): Promise<SourceInformation | null> {
    const sql = 'SELECT * FROM source_information WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const row = Array.isArray(result) ? result[0] : result;
    
    if (!row) return null;
    
    return this.parseJsonFields(row) as SourceInformation;
  }

  /**
   * 根据source_id获取来源信息
   */
  async findBySourceId(sourceId: string): Promise<SourceInformation | null> {
    const sql = 'SELECT * FROM source_information WHERE source_id = ?';
    const result = await this.db.query(sql, [sourceId]);
    const row = Array.isArray(result) ? result[0] : result;
    
    if (!row) return null;
    
    return this.parseJsonFields(row) as SourceInformation;
  }

  /**
   * 获取所有来源信息
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<SourceInformation>> {
    let sql = 'SELECT * FROM source_information';
    const values: any[] = [];
    const conditions: string[] = [];

    // 添加WHERE条件
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        conditions.push(`${key} = ?`);
        values.push(value);
      });
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.db.query(countSql, values);
    const total = Array.isArray(countResult) ? countResult[0].count : countResult.count;

    // 添加分页
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.db.query(sql, values);
    const rows = Array.isArray(result) ? result : [result];
    const data = rows.map((row: any) => this.parseJsonFields(row)) as SourceInformation[];
    
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
   * 根据对话ID获取来源信息列表
   */
  async findByConversationId(conversationId: string): Promise<SourceInformation[]> {
    const sql = `
      SELECT * FROM source_information 
      WHERE conversation_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(sql, [conversationId]);
    const rows = Array.isArray(result) ? result : [result];
    return rows.map((row: any) => this.parseJsonFields(row)) as SourceInformation[];
  }

  /**
   * 根据页面类型获取来源信息列表
   */
  async findByPageType(pageType: string): Promise<SourceInformation[]> {
    const sql = `
      SELECT * FROM source_information 
      WHERE page_type = ? AND status = 'active'
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.query(sql, [pageType]);
    const rows = Array.isArray(result) ? result : [result];
    return rows.map((row: any) => this.parseJsonFields(row)) as SourceInformation[];
  }

  /**
   * 根据项目ID获取来源信息列表（通过关联表）
   */
  async findByProjectId(projectId: number): Promise<SourceInformation[]> {
    const sql = `
      SELECT si.* FROM source_information si
      INNER JOIN project_source_informations psi ON si.id = psi.source_information_id
      WHERE psi.project_id = ? AND si.status = 'active'
      ORDER BY si.created_at DESC
    `;
    
    const result = await this.db.query(sql, [projectId]);
    const rows = Array.isArray(result) ? result : [result];
    return rows.map((row: any) => this.parseJsonFields(row)) as SourceInformation[];
  }

  /**
   * 根据项目ID和分类获取来源信息列表
   */
  async findByProjectIdAndCategory(projectId: number, category: string): Promise<SourceInformation[]> {
    const sql = `
      SELECT si.* FROM source_information si
      INNER JOIN project_source_informations psi ON si.id = psi.source_information_id
      WHERE psi.project_id = ? 
        AND si.status = 'active'
        AND json_extract(si.metadata, '$.category') = ?
      ORDER BY si.created_at DESC
    `;
    
    const result = await this.db.query(sql, [projectId, category]);
    const rows = Array.isArray(result) ? result : [result];
    return rows.map((row: any) => this.parseJsonFields(row)) as SourceInformation[];
  }

  /**
   * 创建项目-来源关联
   */
  async createProjectAssociation(projectId: number, sourceInformationId: number, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO project_source_informations 
      (project_id, source_information_id, notes, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    try {
      await this.db.query(sql, [projectId, sourceInformationId, notes || null]);
      return true;
    } catch (error) {
      console.error('创建项目-来源关联失败:', error);
      return false;
    }
  }

  /**
   * 更新来源信息
   */
  async update(id: number, data: UpdateSourceInformationDTO): Promise<SourceInformation | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'metadata') {
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
      UPDATE source_information 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.query(sql, values);
    return this.findById(id);
  }

  /**
   * 根据source_id更新来源信息
   */
  async updateBySourceId(sourceId: string, data: UpdateSourceInformationDTO): Promise<SourceInformation | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'metadata') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      return this.findBySourceId(sourceId);
    }

    values.push(sourceId);
    
    const sql = `
      UPDATE source_information 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE source_id = ?
    `;

    await this.db.query(sql, values);
    return this.findBySourceId(sourceId);
  }

  /**
   * 删除来源信息（软删除）
   */
  async delete(id: number): Promise<boolean> {
    const sql = `
      UPDATE source_information 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await this.db.query(sql, [id]);
    return (result.changes || result.affectedRows) > 0;
  }

  /**
   * 根据source_id删除来源信息（软删除）
   */
  async deleteBySourceId(sourceId: string): Promise<boolean> {
    const sql = `
      UPDATE source_information 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE source_id = ? AND status != 'deleted'
    `;
    
    const result = await this.db.query(sql, [sourceId]);
    return (result.changes || result.affectedRows) > 0;
  }

  /**
   * 物理删除来源信息
   */
  async hardDelete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM source_information WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return (result.changes || result.affectedRows) > 0;
  }

  /**
   * 批量创建来源信息
   */
  async createBatch(dataList: CreateSourceInformationDTO[]): Promise<SourceInformation[]> {
    const results: SourceInformation[] = [];
    
    for (const data of dataList) {
      const result = await this.create(data);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 解析JSON字段
   */
  private parseJsonFields(row: any): any {
    if (!row) return row;
    
    const parsed = { ...row };
    
    if (parsed.metadata && typeof parsed.metadata === 'string') {
      try {
        parsed.metadata = JSON.parse(parsed.metadata);
      } catch (e) {
        parsed.metadata = null;
      }
    }
    
    // 转换日期字段
    if (parsed.created_at) {
      parsed.created_at = new Date(parsed.created_at);
    }
    if (parsed.updated_at) {
      parsed.updated_at = new Date(parsed.updated_at);
    }
    
    return parsed;
  }
}

