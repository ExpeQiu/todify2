import { DatabaseManager } from '../config/database';

export interface Brand {
  id: number;
  name: string;
  name_en?: string;
  logo_url?: string;
  country?: string;
  founded_year?: number;
  description?: string;
  status: BrandStatus;
  created_at: string;
  updated_at: string;
}

export enum BrandStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface CreateBrandDTO {
  name: string;
  name_en?: string;
  logo_url?: string;
  country?: string;
  founded_year?: number;
  description?: string;
  status?: BrandStatus;
}

export interface UpdateBrandDTO {
  name?: string;
  name_en?: string;
  logo_url?: string;
  country?: string;
  founded_year?: number;
  description?: string;
  status?: BrandStatus;
}

export interface FindAllBrandsOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: any;
}

export class BrandModel {
  private db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager();
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
   * 创建品牌
   */
  async create(data: CreateBrandDTO): Promise<Brand> {
    await this.ensureConnection();
    
    const sql = `
      INSERT INTO brands (name, name_en, logo_url, country, founded_year, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.name,
      data.name_en || null,
      data.logo_url || null,
      data.country || null,
      data.founded_year || null,
      data.description || null,
      data.status || BrandStatus.ACTIVE
    ];

    try {
      const result = await this.db.query(sql, params);
      const insertId = result.lastID || result.insertId;
      
      return await this.findById(insertId);
    } catch (error: any) {
      console.error('创建品牌失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('品牌名称已存在');
      }
      throw new Error('创建品牌失败');
    }
  }

  /**
   * 根据ID查找品牌
   */
  async findById(id: number): Promise<Brand> {
    await this.ensureConnection();
    
    const sql = 'SELECT * FROM brands WHERE id = ?';
    
    try {
      const result = await this.db.query(sql, [id]);
      const brands = Array.isArray(result) ? result : result.rows || [result];
      
      if (brands.length === 0) {
        throw new Error('品牌不存在');
      }
      
      return brands[0] as Brand;
    } catch (error) {
      console.error('查找品牌失败:', error);
      throw new Error('查找品牌失败');
    }
  }

  /**
   * 查找所有品牌
   */
  async findAll(options: FindAllBrandsOptions = {}): Promise<{ brands: Brand[]; total: number }> {
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
      
      if (options.where.country) {
        conditions.push('country = ?');
        whereParams.push(options.where.country);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM brands ${whereClause}`;
    const countResult = await this.db.query(countSql, whereParams);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.total;

    // 查询数据
    const sql = `
      SELECT * FROM brands 
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const params = [...whereParams, limit, offset];
    
    try {
      const result = await this.db.query(sql, params);
      const brands = Array.isArray(result) ? result : result.rows || [];
      
      return {
        brands: brands as Brand[],
        total
      };
    } catch (error) {
      console.error('查询品牌列表失败:', error);
      throw new Error('查询品牌列表失败');
    }
  }

  /**
   * 更新品牌
   */
  async update(id: number, data: UpdateBrandDTO): Promise<Brand> {
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
    
    if (data.logo_url !== undefined) {
      updates.push('logo_url = ?');
      params.push(data.logo_url);
    }
    
    if (data.country !== undefined) {
      updates.push('country = ?');
      params.push(data.country);
    }
    
    if (data.founded_year !== undefined) {
      updates.push('founded_year = ?');
      params.push(data.founded_year);
    }
    
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
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
    
    const sql = `UPDATE brands SET ${updates.join(', ')} WHERE id = ?`;
    
    try {
      await this.db.query(sql, params);
      return await this.findById(id);
    } catch (error: any) {
      console.error('更新品牌失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('品牌名称已存在');
      }
      throw new Error('更新品牌失败');
    }
  }

  /**
   * 删除品牌
   */
  async delete(id: number): Promise<void> {
    await this.ensureConnection();
    
    // 检查是否存在关联的车型
    const checkSql = 'SELECT COUNT(*) as count FROM car_models WHERE brand_id = ?';
    const checkResult = await this.db.query(checkSql, [id]);
    const count = Array.isArray(checkResult) ? checkResult[0].count : checkResult.count;
    
    if (count > 0) {
      throw new Error('无法删除品牌，存在关联的车型');
    }
    
    const sql = 'DELETE FROM brands WHERE id = ?';
    
    try {
      const result = await this.db.query(sql, [id]);
      const affectedRows = result.changes || result.affectedRows || 0;
      
      if (affectedRows === 0) {
        throw new Error('品牌不存在');
      }
    } catch (error) {
      console.error('删除品牌失败:', error);
      throw new Error('删除品牌失败');
    }
  }

  /**
   * 根据名称查找品牌
   */
  async findByName(name: string): Promise<Brand | null> {
    await this.ensureConnection();
    
    const sql = 'SELECT * FROM brands WHERE name = ?';
    
    try {
      const result = await this.db.query(sql, [name]);
      const brands = Array.isArray(result) ? result : result.rows || [result];
      
      return brands.length > 0 ? brands[0] as Brand : null;
    } catch (error) {
      console.error('根据名称查找品牌失败:', error);
      throw new Error('根据名称查找品牌失败');
    }
  }

  /**
   * 获取品牌统计信息
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCountry: Record<string, number>;
  }> {
    await this.ensureConnection();
    
    try {
      // 总数统计
      const totalResult = await this.db.query('SELECT COUNT(*) as total FROM brands');
      const total = Array.isArray(totalResult) ? totalResult[0].total : totalResult.total;
      
      // 按状态统计
      const statusResult = await this.db.query(`
        SELECT status, COUNT(*) as count 
        FROM brands 
        GROUP BY status
      `);
      const statusRows = Array.isArray(statusResult) ? statusResult : statusResult.rows || [];
      const byStatus: Record<string, number> = {};
      statusRows.forEach((row: any) => {
        byStatus[row.status] = row.count;
      });
      
      // 按国家统计
      const countryResult = await this.db.query(`
        SELECT country, COUNT(*) as count 
        FROM brands 
        WHERE country IS NOT NULL 
        GROUP BY country
      `);
      const countryRows = Array.isArray(countryResult) ? countryResult : countryResult.rows || [];
      const byCountry: Record<string, number> = {};
      countryRows.forEach((row: any) => {
        byCountry[row.country] = row.count;
      });
      
      return {
        total,
        byStatus,
        byCountry
      };
    } catch (error) {
      console.error('获取品牌统计信息失败:', error);
      throw new Error('获取品牌统计信息失败');
    }
  }
}