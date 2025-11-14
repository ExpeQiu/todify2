import { DatabaseManager } from '../config/database';

export interface CarSeries {
  id: number;
  model_id: number;
  name: string;
  name_en?: string;
  description?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status: CarSeriesStatus;
  metadata?: any; // JSON格式存储额外信息
  created_at: string;
  updated_at: string;
  // 关联数据
  model?: {
    id: number;
    name: string;
    name_en?: string;
    brand?: {
      id: number;
      name: string;
      name_en?: string;
    };
  };
}

export enum CarSeriesStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
}

export interface CreateCarSeriesDTO {
  model_id: number;
  name: string;
  name_en?: string;
  description?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status?: CarSeriesStatus;
  metadata?: any;
}

export interface UpdateCarSeriesDTO {
  model_id?: number;
  name?: string;
  name_en?: string;
  description?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status?: CarSeriesStatus;
  metadata?: any;
}

export interface FindAllCarSeriesOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: any;
  includeModel?: boolean;
  includeBrand?: boolean;
}

export class CarSeriesModel {
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
   * 创建车系
   */
  async create(data: CreateCarSeriesDTO): Promise<CarSeries> {
    await this.ensureConnection();
    
    // 验证车型是否存在
    const modelCheckSql = 'SELECT id FROM car_models WHERE id = ?';
    const modelResult = await this.db.query(modelCheckSql, [data.model_id]);
    const models = Array.isArray(modelResult) ? modelResult : modelResult.rows || [modelResult];
    
    if (models.length === 0) {
      throw new Error('指定的车型不存在');
    }
    
    const sql = `
      INSERT INTO car_series (model_id, name, name_en, description, launch_year, end_year, market_segment, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.model_id,
      data.name,
      data.name_en || null,
      data.description || null,
      data.launch_year || null,
      data.end_year || null,
      data.market_segment || null,
      data.status || CarSeriesStatus.ACTIVE,
      data.metadata ? JSON.stringify(data.metadata) : null
    ];

    try {
      const result = await this.db.query(sql, params);
      const insertId = result.lastID || result.insertId;
      
      return await this.findById(insertId);
    } catch (error: any) {
      console.error('创建车系失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('车系名称已存在');
      }
      throw new Error('创建车系失败');
    }
  }

  /**
   * 根据ID查找车系
   */
  async findById(id: number, includeModel: boolean = true, includeBrand: boolean = true): Promise<CarSeries> {
    await this.ensureConnection();
    
    let sql = 'SELECT * FROM car_series WHERE id = ?';
    
    if (includeModel) {
      if (includeBrand) {
        sql = `
          SELECT 
            cs.*,
            cm.id as model_id_ref,
            cm.name as model_name,
            cm.name_en as model_name_en,
            b.id as brand_id,
            b.name as brand_name,
            b.name_en as brand_name_en
          FROM car_series cs
          LEFT JOIN car_models cm ON cs.model_id = cm.id
          LEFT JOIN brands b ON cm.brand_id = b.id
          WHERE cs.id = ?
        `;
      } else {
        sql = `
          SELECT 
            cs.*,
            cm.id as model_id_ref,
            cm.name as model_name,
            cm.name_en as model_name_en
          FROM car_series cs
          LEFT JOIN car_models cm ON cs.model_id = cm.id
          WHERE cs.id = ?
        `;
      }
    }
    
    try {
      const result = await this.db.query(sql, [id]);
      const carSeries = Array.isArray(result) ? result : result.rows || [result];
      
      if (carSeries.length === 0) {
        throw new Error('车系不存在');
      }
      
      const series = carSeries[0] as any;
      
      // 解析metadata
      if (series.metadata && typeof series.metadata === 'string') {
        try {
          series.metadata = JSON.parse(series.metadata);
        } catch (error) {
          console.error('解析metadata失败:', error);
          series.metadata = null;
        }
      }
      
      if (includeModel && series.model_name) {
        const model: any = {
          id: series.model_id,
          name: series.model_name,
          name_en: series.model_name_en
        };
        
        if (includeBrand && series.brand_name) {
          model.brand = {
            id: series.brand_id,
            name: series.brand_name,
            name_en: series.brand_name_en
          };
        }
        
        return {
          ...series,
          model
        } as CarSeries;
      }
      
      return series as CarSeries;
    } catch (error) {
      console.error('查找车系失败:', error);
      throw new Error('查找车系失败');
    }
  }

  /**
   * 查找所有车系
   */
  async findAll(options: FindAllCarSeriesOptions = {}): Promise<{ carSeries: CarSeries[]; total: number }> {
    await this.ensureConnection();
    
    const {
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      includeModel = true,
      includeBrand = true
    } = options;

    // 构建WHERE条件
    let whereClause = '';
    let whereParams: any[] = [];
    
    if (options.where) {
      const conditions: string[] = [];
      
      if (options.where.name) {
        conditions.push('cs.name LIKE ?');
        whereParams.push(`%${options.where.name}%`);
      }
      
      if (options.where.model_id) {
        conditions.push('cs.model_id = ?');
        whereParams.push(options.where.model_id);
      }
      
      if (options.where.status) {
        conditions.push('cs.status = ?');
        whereParams.push(options.where.status);
      }
      
      if (options.where.market_segment) {
        conditions.push('cs.market_segment = ?');
        whereParams.push(options.where.market_segment);
      }
      
      if (options.where.launch_year) {
        conditions.push('cs.launch_year = ?');
        whereParams.push(options.where.launch_year);
      }
      
      if (options.where.brand_id) {
        conditions.push('cm.brand_id = ?');
        whereParams.push(options.where.brand_id);
      }
      
      if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
      }
    }

    // 查询总数
    let countSql = `SELECT COUNT(*) as total FROM car_series cs`;
    if (options.where?.brand_id) {
      countSql += ` LEFT JOIN car_models cm ON cs.model_id = cm.id`;
    }
    countSql += ` ${whereClause}`;
    
    const countResult = await this.db.query(countSql, whereParams);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.total;

    // 查询数据
    let sql = `
      SELECT cs.* FROM car_series cs
      ${whereClause}
      ORDER BY cs.${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    if (includeModel) {
      if (includeBrand) {
        sql = `
          SELECT 
            cs.*,
            cm.id as model_id_ref,
            cm.name as model_name,
            cm.name_en as model_name_en,
            b.id as brand_id,
            b.name as brand_name,
            b.name_en as brand_name_en
          FROM car_series cs
          LEFT JOIN car_models cm ON cs.model_id = cm.id
          LEFT JOIN brands b ON cm.brand_id = b.id
          ${whereClause}
          ORDER BY cs.${orderBy} ${orderDirection}
          LIMIT ? OFFSET ?
        `;
      } else {
        sql = `
          SELECT 
            cs.*,
            cm.id as model_id_ref,
            cm.name as model_name,
            cm.name_en as model_name_en
          FROM car_series cs
          LEFT JOIN car_models cm ON cs.model_id = cm.id
          ${whereClause}
          ORDER BY cs.${orderBy} ${orderDirection}
          LIMIT ? OFFSET ?
        `;
      }
    }
    
    const params = [...whereParams, limit, offset];
    
    try {
      const result = await this.db.query(sql, params);
      const carSeries = Array.isArray(result) ? result : result.rows || [];
      
      const processedCarSeries = carSeries.map((series: any) => {
        // 解析metadata
        if (series.metadata && typeof series.metadata === 'string') {
          try {
            series.metadata = JSON.parse(series.metadata);
          } catch (error) {
            console.error('解析metadata失败:', error);
            series.metadata = null;
          }
        }
        
        if (includeModel && series.model_name) {
          const model: any = {
            id: series.model_id,
            name: series.model_name,
            name_en: series.model_name_en
          };
          
          if (includeBrand && series.brand_name) {
            model.brand = {
              id: series.brand_id,
              name: series.brand_name,
              name_en: series.brand_name_en
            };
          }
          
          return {
            ...series,
            model
          };
        }
        return series;
      });
      
      return {
        carSeries: processedCarSeries as CarSeries[],
        total
      };
    } catch (error) {
      console.error('查询车系列表失败:', error);
      throw new Error('查询车系列表失败');
    }
  }

  /**
   * 根据车型ID查找车系
   */
  async findByModelId(modelId: number, options: Omit<FindAllCarSeriesOptions, 'where'> = {}): Promise<{ carSeries: CarSeries[]; total: number }> {
    return this.findAll({
      ...options,
      where: { model_id: modelId }
    });
  }

  /**
   * 根据品牌ID查找车系
   */
  async findByBrandId(brandId: number, options: Omit<FindAllCarSeriesOptions, 'where'> = {}): Promise<{ carSeries: CarSeries[]; total: number }> {
    return this.findAll({
      ...options,
      where: { brand_id: brandId }
    });
  }

  /**
   * 更新车系
   */
  async update(id: number, data: UpdateCarSeriesDTO): Promise<CarSeries> {
    await this.ensureConnection();
    
    // 如果更新车型ID，验证车型是否存在
    if (data.model_id) {
      const modelCheckSql = 'SELECT id FROM car_models WHERE id = ?';
      const modelResult = await this.db.query(modelCheckSql, [data.model_id]);
      const models = Array.isArray(modelResult) ? modelResult : modelResult.rows || [modelResult];
      
      if (models.length === 0) {
        throw new Error('指定的车型不存在');
      }
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.model_id !== undefined) {
      updates.push('model_id = ?');
      params.push(data.model_id);
    }
    
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
    
    if (data.launch_year !== undefined) {
      updates.push('launch_year = ?');
      params.push(data.launch_year);
    }
    
    if (data.end_year !== undefined) {
      updates.push('end_year = ?');
      params.push(data.end_year);
    }
    
    if (data.market_segment !== undefined) {
      updates.push('market_segment = ?');
      params.push(data.market_segment);
    }
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    
    if (data.metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }
    
    if (updates.length === 0) {
      throw new Error('没有要更新的数据');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE car_series SET ${updates.join(', ')} WHERE id = ?`;
    
    try {
      await this.db.query(sql, params);
      return await this.findById(id);
    } catch (error: any) {
      console.error('更新车系失败:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('车系名称已存在');
      }
      throw new Error('更新车系失败');
    }
  }

  /**
   * 删除车系
   */
  async delete(id: number): Promise<void> {
    await this.ensureConnection();
    
    const sql = 'DELETE FROM car_series WHERE id = ?';
    
    try {
      const result = await this.db.query(sql, [id]);
      const affectedRows = result.changes || result.affectedRows || 0;
      
      if (affectedRows === 0) {
        throw new Error('车系不存在');
      }
    } catch (error) {
      console.error('删除车系失败:', error);
      throw new Error('删除车系失败');
    }
  }

  /**
   * 软删除车系（设置状态为discontinued）
   */
  async softDelete(id: number): Promise<void> {
    await this.ensureConnection();
    
    const sql = `
      UPDATE car_series 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    try {
      const result = await this.db.query(sql, [CarSeriesStatus.DISCONTINUED, id]);
      const affectedRows = result.changes || result.affectedRows || 0;
      
      if (affectedRows === 0) {
        throw new Error('车系不存在');
      }
    } catch (error) {
      console.error('软删除车系失败:', error);
      throw new Error('软删除车系失败');
    }
  }

  /**
   * 搜索车系
   */
  async search(keyword: string, options: FindAllCarSeriesOptions = {}): Promise<{ carSeries: CarSeries[]; total: number }> {
    const searchOptions = {
      ...options,
      where: {
        ...options.where,
        name: keyword
      }
    };
    
    return this.findAll(searchOptions);
  }

  /**
   * 获取车系统计信息
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byMarketSegment: Record<string, number>;
    byModel: Record<string, number>;
    byBrand: Record<string, number>;
  }> {
    await this.ensureConnection();
    
    try {
      // 总数统计
      const totalResult = await this.db.query('SELECT COUNT(*) as total FROM car_series');
      const total = Array.isArray(totalResult) ? totalResult[0].total : totalResult.total;
      
      // 按状态统计
      const statusResult = await this.db.query(`
        SELECT status, COUNT(*) as count 
        FROM car_series 
        GROUP BY status
      `);
      const statusRows = Array.isArray(statusResult) ? statusResult : statusResult.rows || [];
      const byStatus: Record<string, number> = {};
      statusRows.forEach((row: any) => {
        byStatus[row.status] = row.count;
      });
      
      // 按市场细分统计
      const segmentResult = await this.db.query(`
        SELECT market_segment, COUNT(*) as count 
        FROM car_series 
        WHERE market_segment IS NOT NULL 
        GROUP BY market_segment
      `);
      const segmentRows = Array.isArray(segmentResult) ? segmentResult : segmentResult.rows || [];
      const byMarketSegment: Record<string, number> = {};
      segmentRows.forEach((row: any) => {
        byMarketSegment[row.market_segment] = row.count;
      });
      
      // 按车型统计
      const modelResult = await this.db.query(`
        SELECT cm.name, COUNT(*) as count 
        FROM car_series cs
        LEFT JOIN car_models cm ON cs.model_id = cm.id
        GROUP BY cs.model_id, cm.name
      `);
      const modelRows = Array.isArray(modelResult) ? modelResult : modelResult.rows || [];
      const byModel: Record<string, number> = {};
      modelRows.forEach((row: any) => {
        byModel[row.name] = row.count;
      });
      
      // 按品牌统计
      const brandResult = await this.db.query(`
        SELECT b.name, COUNT(*) as count 
        FROM car_series cs
        LEFT JOIN car_models cm ON cs.model_id = cm.id
        LEFT JOIN brands b ON cm.brand_id = b.id
        GROUP BY b.id, b.name
      `);
      const brandRows = Array.isArray(brandResult) ? brandResult : brandResult.rows || [];
      const byBrand: Record<string, number> = {};
      brandRows.forEach((row: any) => {
        byBrand[row.name] = row.count;
      });
      
      return {
        total,
        byStatus,
        byMarketSegment,
        byModel,
        byBrand
      };
    } catch (error) {
      console.error('获取车系统计信息失败:', error);
      throw new Error('获取车系统计信息失败');
    }
  }

  /**
   * 获取车系关联的技术点
   */
  async getTechPoints(carSeriesId: number): Promise<any[]> {
    try {
      await this.ensureConnection();
      
      console.log('获取车系技术点 - carSeriesId:', carSeriesId);
      console.log('carSeriesId type:', typeof carSeriesId);
      
      // 先测试硬编码的查询
      const testSql = `
        SELECT 
          tp.id,
          tp.name,
          tp.description,
          tp.tech_type,
          tp.priority,
          tp.status,
          tp.tags,
          tp.technical_details,
          tp.benefits,
          tp.applications,
          tp.keywords,
          tp.source_url,
          tp.created_at,
          tp.updated_at,
          tpcm.application_status,
          tpcm.implementation_date,
          tpcm.notes as association_notes
        FROM tech_points tp
        INNER JOIN tech_point_car_models tpcm ON tp.id = tpcm.tech_point_id
        INNER JOIN car_models cm ON tpcm.car_model_id = cm.id
        INNER JOIN car_series cs ON cs.model_id = cm.id
        WHERE cs.id = 1
        ORDER BY tp.priority DESC, tp.name ASC
      `;
      
      console.log('执行测试SQL查询（硬编码）:', testSql);
      
      const testRows = await this.db.query(testSql, []);
      
      console.log('测试查询结果行数:', testRows.length);
      console.log('测试查询结果:', testRows);
      
      if (testRows.length > 0) {
        console.log('硬编码查询成功，现在测试参数化查询');
        
        const sql = `
          SELECT 
            tp.id,
            tp.name,
            tp.description,
            tp.tech_type,
            tp.priority,
            tp.status,
            tp.tags,
            tp.technical_details,
            tp.benefits,
            tp.applications,
            tp.keywords,
            tp.source_url,
            tp.created_at,
            tp.updated_at,
            tpcm.application_status,
            tpcm.implementation_date,
            tpcm.notes as association_notes
          FROM tech_points tp
          INNER JOIN tech_point_car_models tpcm ON tp.id = tpcm.tech_point_id
          INNER JOIN car_models cm ON tpcm.car_model_id = cm.id
          INNER JOIN car_series cs ON cs.model_id = cm.id
          WHERE cs.id = ?
          ORDER BY tp.priority DESC, tp.name ASC
        `;
        
        console.log('执行参数化SQL查询:', sql);
        console.log('查询参数:', [carSeriesId]);
        
        const rows = await this.db.query(sql, [carSeriesId]);
        
        console.log('参数化查询结果行数:', rows.length);
        console.log('参数化查询结果:', rows);
        
        return rows.map((row: any) => ({
          ...row,
          tags: row.tags ? JSON.parse(row.tags) : [],
          technical_details: row.technical_details ? JSON.parse(row.technical_details) : null,
          benefits: row.benefits ? JSON.parse(row.benefits) : [],
          applications: row.applications ? JSON.parse(row.applications) : [],
          keywords: row.keywords ? JSON.parse(row.keywords) : []
        }));
      } else {
        console.log('硬编码查询也失败了，返回空数组');
        return [];
      }
    } catch (error) {
      console.error('获取车系技术点失败:', error);
      throw new Error('获取车系技术点失败');
    }
  }
}

export const carSeriesModel = new CarSeriesModel();