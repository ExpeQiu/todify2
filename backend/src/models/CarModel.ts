import { DatabaseManager } from '../config/database';

export interface CarModel {
  id: number;
  brand_id: number;
  name: string;
  name_en?: string;
  category?: string;
  launch_year?: number;
  end_year?: number;
  description?: string;
  status: CarModelStatus;
  created_at: string;
  updated_at: string;
  // 关联数据
  brand?: {
    id: number;
    name: string;
    name_en?: string;
  };
}

export enum CarModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
}

export interface CreateCarModelDTO {
  brand_id: number;
  name: string;
  name_en?: string;
  category?: string;
  launch_year?: number;
  end_year?: number;
  description?: string;
  status?: CarModelStatus;
}

export interface UpdateCarModelDTO {
  brand_id?: number;
  name?: string;
  name_en?: string;
  category?: string;
  launch_year?: number;
  end_year?: number;
  description?: string;
  status?: CarModelStatus;
}

export interface FindAllCarModelsOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: any;
  includeBrand?: boolean;
}

export class CarModelModel {
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
   * 创建车型
   */
  async create(data: CreateCarModelDTO): Promise<CarModel> {
    await this.ensureConnection();
    
    // 验证品牌是否存在
    const brandCheckSql = 'SELECT id FROM brands WHERE id = ?';
    const brandResult = await this.db.query(brandCheckSql, [data.brand_id]);
    const brands = Array.isArray(brandResult) ? brandResult : brandResult.rows || [brandResult];
    
    if (brands.length === 0) {
      throw new Error('指定的品牌不存在');
    }
    
    const sql = `
      INSERT INTO car_models (brand_id, name, name_en, category, launch_year, end_year, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.brand_id,
      data.name,
      data.name_en || null,
      data.category || null,
      data.launch_year || null,
      data.end_year || null,
      data.description || null,
      data.status || CarModelStatus.ACTIVE
    ];

    try {
      const result = await this.db.query(sql, params);
      const insertId = result.lastID || result.insertId;
      
      return await this.findById(insertId);
    } catch (error: any) {
      console.error('创建车型失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('车型名称已存在');
      }
      throw new Error('创建车型失败');
    }
  }

  /**
   * 根据ID查找车型
   */
  async findById(id: number, includeBrand: boolean = true): Promise<CarModel> {
    await this.ensureConnection();
    
    let sql = 'SELECT * FROM car_models WHERE id = ?';
    
    if (includeBrand) {
      sql = `
        SELECT 
          cm.*,
          b.id as brand_id_ref,
          b.name as brand_name,
          b.name_en as brand_name_en
        FROM car_models cm
        LEFT JOIN brands b ON cm.brand_id = b.id
        WHERE cm.id = ?
      `;
    }
    
    try {
      const result = await this.db.query(sql, [id]);
      const carModels = Array.isArray(result) ? result : result.rows || [result];
      
      if (carModels.length === 0) {
        throw new Error('车型不存在');
      }
      
      const carModel = carModels[0] as any;
      
      if (includeBrand && carModel.brand_name) {
        return {
          ...carModel,
          brand: {
            id: carModel.brand_id,
            name: carModel.brand_name,
            name_en: carModel.brand_name_en
          }
        } as CarModel;
      }
      
      return carModel as CarModel;
    } catch (error) {
      console.error('查找车型失败:', error);
      throw new Error('查找车型失败');
    }
  }

  /**
   * 查找所有车型
   */
  async findAll(options: FindAllCarModelsOptions = {}): Promise<{ carModels: CarModel[]; total: number }> {
    await this.ensureConnection();
    
    const {
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      includeBrand = true
    } = options;

    // 构建WHERE条件
    let whereClause = '';
    let whereParams: any[] = [];
    
    if (options.where) {
      const conditions: string[] = [];
      
      if (options.where.name) {
        conditions.push('cm.name LIKE ?');
        whereParams.push(`%${options.where.name}%`);
      }
      
      if (options.where.brand_id) {
        conditions.push('cm.brand_id = ?');
        whereParams.push(options.where.brand_id);
      }
      
      if (options.where.status) {
        conditions.push('cm.status = ?');
        whereParams.push(options.where.status);
      }
      
      if (options.where.category) {
        conditions.push('cm.category = ?');
        whereParams.push(options.where.category);
      }
      
      if (options.where.launch_year) {
        conditions.push('cm.launch_year = ?');
        whereParams.push(options.where.launch_year);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM car_models cm ${whereClause}`;
    const countResult = await this.db.query(countSql, whereParams);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.total;

    // 查询数据
    let sql = `
      SELECT cm.* FROM car_models cm
      ${whereClause}
      ORDER BY cm.${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    if (includeBrand) {
      sql = `
        SELECT 
          cm.*,
          b.id as brand_id_ref,
          b.name as brand_name,
          b.name_en as brand_name_en
        FROM car_models cm
        LEFT JOIN brands b ON cm.brand_id = b.id
        ${whereClause}
        ORDER BY cm.${orderBy} ${orderDirection}
        LIMIT ? OFFSET ?
      `;
    }
    
    const params = [...whereParams, limit, offset];
    
    try {
      const result = await this.db.query(sql, params);
      const carModels = Array.isArray(result) ? result : result.rows || [];
      
      const processedCarModels = carModels.map((carModel: any) => {
        if (includeBrand && carModel.brand_name) {
          return {
            ...carModel,
            brand: {
              id: carModel.brand_id,
              name: carModel.brand_name,
              name_en: carModel.brand_name_en
            }
          };
        }
        return carModel;
      });
      
      return {
        carModels: processedCarModels as CarModel[],
        total
      };
    } catch (error) {
      console.error('查询车型列表失败:', error);
      throw new Error('查询车型列表失败');
    }
  }

  /**
   * 根据品牌ID查找车型
   */
  async findByBrandId(brandId: number, options: Omit<FindAllCarModelsOptions, 'where'> = {}): Promise<{ carModels: CarModel[]; total: number }> {
    return this.findAll({
      ...options,
      where: { brand_id: brandId }
    });
  }

  /**
   * 更新车型
   */
  async update(id: number, data: UpdateCarModelDTO): Promise<CarModel> {
    await this.ensureConnection();
    
    // 如果更新品牌ID，验证品牌是否存在
    if (data.brand_id) {
      const brandCheckSql = 'SELECT id FROM brands WHERE id = ?';
      const brandResult = await this.db.query(brandCheckSql, [data.brand_id]);
      const brands = Array.isArray(brandResult) ? brandResult : brandResult.rows || [brandResult];
      
      if (brands.length === 0) {
        throw new Error('指定的品牌不存在');
      }
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.brand_id !== undefined) {
      updates.push('brand_id = ?');
      params.push(data.brand_id);
    }
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    
    if (data.name_en !== undefined) {
      updates.push('name_en = ?');
      params.push(data.name_en);
    }
    
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }
    
    if (data.launch_year !== undefined) {
      updates.push('launch_year = ?');
      params.push(data.launch_year);
    }
    
    if (data.end_year !== undefined) {
      updates.push('end_year = ?');
      params.push(data.end_year);
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
    
    const sql = `UPDATE car_models SET ${updates.join(', ')} WHERE id = ?`;
    
    try {
      await this.db.query(sql, params);
      return await this.findById(id);
    } catch (error: any) {
      console.error('更新车型失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('车型名称已存在');
      }
      throw new Error('更新车型失败');
    }
  }

  /**
   * 删除车型
   */
  async delete(id: number): Promise<void> {
    await this.ensureConnection();
    
    // 检查是否存在关联的车系
    const checkSql = 'SELECT COUNT(*) as count FROM car_series WHERE model_id = ?';
    const checkResult = await this.db.query(checkSql, [id]);
    const count = Array.isArray(checkResult) ? checkResult[0].count : checkResult.count;
    
    if (count > 0) {
      throw new Error('无法删除车型，存在关联的车系');
    }
    
    const sql = 'DELETE FROM car_models WHERE id = ?';
    
    try {
      const result = await this.db.query(sql, [id]);
      const affectedRows = result.changes || result.affectedRows || 0;
      
      if (affectedRows === 0) {
        throw new Error('车型不存在');
      }
    } catch (error) {
      console.error('删除车型失败:', error);
      throw new Error('删除车型失败');
    }
  }

  /**
   * 获取车型统计信息
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byBrand: Record<string, number>;
  }> {
    await this.ensureConnection();
    
    try {
      // 总数统计
      const totalResult = await this.db.query('SELECT COUNT(*) as total FROM car_models');
      const total = Array.isArray(totalResult) ? totalResult[0].total : totalResult.total;
      
      // 按状态统计
      const statusResult = await this.db.query(`
        SELECT status, COUNT(*) as count 
        FROM car_models 
        GROUP BY status
      `);
      const statusRows = Array.isArray(statusResult) ? statusResult : statusResult.rows || [];
      const byStatus: Record<string, number> = {};
      statusRows.forEach((row: any) => {
        byStatus[row.status] = row.count;
      });
      
      // 按类别统计
      const categoryResult = await this.db.query(`
        SELECT category, COUNT(*) as count 
        FROM car_models 
        WHERE category IS NOT NULL 
        GROUP BY category
      `);
      const categoryRows = Array.isArray(categoryResult) ? categoryResult : categoryResult.rows || [];
      const byCategory: Record<string, number> = {};
      categoryRows.forEach((row: any) => {
        byCategory[row.category] = row.count;
      });
      
      // 按品牌统计
      const brandResult = await this.db.query(`
        SELECT b.name, COUNT(*) as count 
        FROM car_models cm
        LEFT JOIN brands b ON cm.brand_id = b.id
        GROUP BY cm.brand_id, b.name
      `);
      const brandRows = Array.isArray(brandResult) ? brandResult : brandResult.rows || [];
      const byBrand: Record<string, number> = {};
      brandRows.forEach((row: any) => {
        byBrand[row.name] = row.count;
      });
      
      return {
        total,
        byStatus,
        byCategory,
        byBrand
      };
    } catch (error) {
      console.error('获取车型统计信息失败:', error);
      throw new Error('获取车型统计信息失败');
    }
  }
}