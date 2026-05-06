import { DatabaseManager } from '../config/database';
import { toCountSql } from '../utils/toCountSql';
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
    const countResult = await this.db.query(toCountSql(sql), values);
    const countRow = Array.isArray(countResult) ? countResult[0] : (countResult as any);
    const total = Number(countRow?.count ?? 0);

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
   * 根据项目ID获取来源信息列表
   * 统一使用 project_id 字段查询
   */
  async findByProjectId(projectId: number): Promise<SourceInformation[]> {
    const sql = `
      SELECT * FROM source_information
      WHERE project_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await this.db.query(sql, [projectId]);
      const rows = Array.isArray(result) ? result : [result];
      return rows.map((row: any) => this.parseJsonFields(row)) as SourceInformation[];
    } catch (error: any) {
      // 如果 project_id 字段不存在，返回空数组（兼容旧数据库）
      if (error?.message?.includes('no such column: project_id') || 
          error?.message?.includes('column "project_id" does not exist')) {
        console.warn('project_id 字段不存在，请运行数据迁移脚本');
        return [];
      }
      throw error;
    }
  }
  
  /**
   * 根据项目ID获取来源信息列表（旧方法，已废弃）
   * @deprecated 请使用 findByProjectId，此方法仅用于兼容
   */
  async findByProjectIdLegacy(projectId: number): Promise<SourceInformation[]> {
    const pageType = `project-${projectId}`;
    const results: SourceInformation[] = [];
    const seenIds = new Set<number>();
    
    try {
      // 方式1: 通过 project_id 字段查询
      try {
        const sql1 = `
          SELECT * FROM source_information
          WHERE project_id = ? AND status = 'active'
          ORDER BY created_at DESC
        `;
        const result1 = await this.db.query(sql1, [projectId]);
        const rows1 = Array.isArray(result1) ? result1 : [result1];
        for (const row of rows1) {
          const parsed = this.parseJsonFields(row) as SourceInformation;
          if (parsed.id && !seenIds.has(parsed.id)) {
            results.push(parsed);
            seenIds.add(parsed.id);
          }
        }
      } catch (error: any) {
        if (!error?.message?.includes('no such column: project_id')) {
          console.warn('查询 project_id 字段失败:', error?.message);
        }
      }
      
      // 方式2: 通过关联表查询
      try {
        const sql2 = `
          SELECT si.* FROM source_information si
          INNER JOIN project_source_informations psi ON si.id = psi.source_information_id
          WHERE psi.project_id = ? AND si.status = 'active'
          ORDER BY si.created_at DESC
        `;
        const result2 = await this.db.query(sql2, [projectId]);
        const rows2 = Array.isArray(result2) ? result2 : [result2];
        for (const row of rows2) {
          const parsed = this.parseJsonFields(row) as SourceInformation;
          if (parsed.id && !seenIds.has(parsed.id)) {
            results.push(parsed);
            seenIds.add(parsed.id);
          }
        }
      } catch (error: any) {
        if (!error?.message?.includes('no such table: project_source_informations')) {
          console.warn('查询关联表失败:', error?.message);
        }
      }
      
      // 方式3: 通过 page_type 查询（兼容旧数据）
      try {
        const sql3 = `
          SELECT * FROM source_information
          WHERE page_type = ? AND status = 'active'
          ORDER BY created_at DESC
        `;
        const result3 = await this.db.query(sql3, [pageType]);
        const rows3 = Array.isArray(result3) ? result3 : [result3];
        for (const row of rows3) {
          const parsed = this.parseJsonFields(row) as SourceInformation;
          if (parsed.id && !seenIds.has(parsed.id)) {
            results.push(parsed);
            seenIds.add(parsed.id);
          }
        }
      } catch (error: any) {
        console.warn('查询 page_type 失败:', error?.message);
      }
      
      // 按创建时间排序
      results.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
      
      return results;
    } catch (error: any) {
      console.error('查询项目来源信息失败（旧方法）:', error);
      return [];
    }
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
   * 确保 project_id 字段存在
   */
  private async ensureProjectIdColumn(): Promise<void> {
    try {
      const tableInfo = await this.db.query(`PRAGMA table_info(source_information)`);
      const columns = Array.isArray(tableInfo) ? tableInfo : [tableInfo];
      const hasProjectId = columns.some((col: any) => col.name === 'project_id');
      
      if (!hasProjectId) {
        console.log('检测到 source_information 表缺少 project_id 字段，正在添加...');
        await this.db.query(`ALTER TABLE source_information ADD COLUMN project_id INTEGER`);
        await this.db.query(`CREATE INDEX IF NOT EXISTS idx_source_information_project_id ON source_information(project_id)`);
        console.log('成功添加 project_id 字段');
      }
    } catch (error: any) {
      // 如果字段已存在或其他错误，记录但不中断
      if (!error?.message?.includes('duplicate column') && 
          !error?.message?.includes('already exists')) {
        console.warn('检查/添加 project_id 字段时出现警告:', error?.message);
      }
    }
  }

  /**
   * 更新来源信息
   */
  async update(id: number, data: UpdateSourceInformationDTO): Promise<SourceInformation | null> {
    const fields: string[] = [];
    const values: any[] = [];

    // 验证ID
    if (!id || isNaN(id)) {
      throw new Error(`无效的来源信息ID: ${id}`);
    }

    // 如果需要更新 project_id，先确保字段存在
    if (data.project_id !== undefined) {
      await this.ensureProjectIdColumn();
    }

    // 构建更新字段
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        // 验证字段名（防止SQL注入）
        const validFields = [
          'title', 'type', 'url', 'description', 'page_type', 
          'conversation_id', 'project_id', 'metadata', 'status', 'created_by'
        ];
        if (!validFields.includes(key)) {
          console.warn(`忽略无效字段: ${key}`);
          return;
        }

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
      console.log(`没有字段需要更新，返回现有记录 id=${id}`);
      return this.findById(id);
    }

    values.push(id);
    
    const sql = `
      UPDATE source_information 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      console.log(`更新来源信息 id=${id}, SQL: ${sql}, Values:`, values);
      await this.db.query(sql, values);
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error(`更新后无法找到来源信息 id=${id}`);
      }
      return updated;
    } catch (error: any) {
      console.error(`更新来源信息失败 id=${id}:`, error);
      console.error(`SQL: ${sql}`);
      console.error(`Values:`, values);
      console.error(`Error details:`, {
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        stack: error?.stack
      });
      
      // 如果是字段不存在的错误，尝试添加字段后重试
      if (error?.message?.includes('no such column: project_id')) {
        console.log('检测到 project_id 字段不存在，尝试添加后重试...');
        try {
          await this.ensureProjectIdColumn();
          // 重试更新
          await this.db.query(sql, values);
          const updated = await this.findById(id);
          if (!updated) {
            throw new Error(`更新后无法找到来源信息 id=${id}`);
          }
          console.log(`重试更新成功 id=${id}`);
          return updated;
        } catch (retryError: any) {
          console.error(`重试更新失败:`, retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
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

