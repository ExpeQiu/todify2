import { DatabaseManager } from '../config/database';
import { Status } from '../types/database';

export interface Technology {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  version?: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface CreateTechnologyDTO {
  name: string;
  name_en?: string;
  description?: string;
  version?: string;
  status?: Status;
}

export interface UpdateTechnologyDTO {
  name?: string;
  name_en?: string;
  description?: string;
  version?: string;
  status?: Status;
}

export interface FindAllTechnologiesOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: any;
}

export class TechnologyModel {
  private db: DatabaseManager;

  constructor(db?: DatabaseManager) {
    this.db = db || new DatabaseManager();
  }

  /**
   * 确保数据库连接
   */
  private async ensureConnection(): Promise<void> {
    try {
      await this.db.connect();
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw new Error('数据库连接失败');
    }
  }

  /**
   * 创建技术IP
   */
  async create(data: CreateTechnologyDTO): Promise<Technology> {
    await this.ensureConnection();
    
    const sql = `
      INSERT INTO technologies (name, name_en, description, version, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.name,
      data.name_en || null,
      data.description || null,
      data.version || null,
      data.status || Status.ACTIVE
    ];

    try {
      const result = await this.db.query(sql, params);
      const insertId = result.lastID || result.insertId;
      
      return await this.findById(insertId);
    } catch (error: any) {
      console.error('创建技术IP失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('技术IP名称已存在');
      }
      throw new Error('创建技术IP失败');
    }
  }

  /**
   * 根据ID查找技术IP
   */
  async findById(id: number): Promise<Technology> {
    await this.ensureConnection();
    
    const sql = 'SELECT * FROM technologies WHERE id = ?';
    
    try {
      const result = await this.db.query(sql, [id]);
      const technologies = Array.isArray(result) ? result : result.rows || [result];
      
      if (technologies.length === 0) {
        throw new Error('技术IP不存在');
      }
      
      return technologies[0] as Technology;
    } catch (error: any) {
      console.error('查找技术IP失败:', error);
      if (error.message === '技术IP不存在') {
        throw error;
      }
      throw new Error('查找技术IP失败');
    }
  }

  /**
   * 查找所有技术IP
   */
  async findAll(options: FindAllTechnologiesOptions = {}): Promise<{ technologies: Technology[]; total: number }> {
    await this.ensureConnection();
    
    const {
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC'
    } = options;

    // 构建WHERE条件
    let whereClause = '';
    let whereParams: any[] = [];
    
    if (options.where) {
      const conditions: string[] = [];
      
      if (options.where.name) {
        conditions.push('name LIKE ?');
        whereParams.push(`%${options.where.name}%`);
      }
      
      if (options.where.status) {
        conditions.push('status = ?');
        whereParams.push(options.where.status);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    try {
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM technologies ${whereClause}`;
      const countResult = await this.db.query(countSql, whereParams);
      const total = Array.isArray(countResult) ? countResult[0].total : countResult.total;

      // 查询数据
      const sql = `
        SELECT * FROM technologies 
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT ? OFFSET ?
      `;
      
      const params = [...whereParams, limit, offset];
      const result = await this.db.query(sql, params);
      const technologies = Array.isArray(result) ? result : result.rows || [];
      
      return {
        technologies: technologies as Technology[],
        total
      };
    } catch (error: any) {
      console.error('查询技术IP列表失败:', error);
      // 如果表不存在，返回空数组而不是抛出错误
      if (error.message?.includes('no such table: technologies') || error.message?.includes('relation "technologies" does not exist')) {
        console.warn('technologies 表不存在，返回空数组');
        return {
          technologies: [],
          total: 0
        };
      }
      throw new Error('查询技术IP列表失败');
    }
  }

  /**
   * 更新技术IP
   */
  async update(id: number, data: UpdateTechnologyDTO): Promise<Technology> {
    await this.ensureConnection();
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    
    if (data.name_en !== undefined) {
      updates.push('name_en = ?');
      params.push(data.name_en);
    }
    
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    
    if (data.version !== undefined) {
      updates.push('version = ?');
      params.push(data.version);
    }
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    
    if (updates.length === 0) {
      throw new Error('没有要更新的数据');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE technologies SET ${updates.join(', ')} WHERE id = ?`;
    
    try {
      await this.db.query(sql, params);
      return await this.findById(id);
    } catch (error: any) {
      console.error('更新技术IP失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('技术IP名称已存在');
      }
      throw new Error('更新技术IP失败');
    }
  }

  /**
   * 删除技术IP
   */
  async delete(id: number): Promise<void> {
    await this.ensureConnection();
    
    // 检查是否存在关联的技术点
    const checkSql = 'SELECT COUNT(*) as count FROM tech_points WHERE technology_id = ?';
    const checkResult = await this.db.query(checkSql, [id]);
    const count = Array.isArray(checkResult) ? checkResult[0].count : checkResult.count;
    
    if (count > 0) {
      throw new Error('无法删除：该技术IP有关联的技术点');
    }
    
    const sql = 'DELETE FROM technologies WHERE id = ?';
    
    try {
      await this.db.query(sql, [id]);
    } catch (error: any) {
      console.error('删除技术IP失败:', error);
      throw new Error('删除技术IP失败');
    }
  }
}

export const technologyModel = new TechnologyModel();

