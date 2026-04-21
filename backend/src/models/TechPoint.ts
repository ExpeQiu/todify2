import { DatabaseManager } from '../config/database';
import { 
  TechPoint, 
  CreateTechPointDTO, 
  UpdateTechPointDTO, 
  QueryOptions, 
  PaginatedResult,
  Status,
  TechType,
  Priority
} from '../types/database';

export class TechPointModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建技术点
   */
  async create(data: CreateTechPointDTO): Promise<TechPoint> {
    const dbType = this.db.getType();
    
    const values = [
      data.name,
      data.description || null,
      data.category_id || null,
      data.parent_id || null,
      data.level || 1,
      data.tech_type || TechType.FEATURE,
      data.priority || Priority.MEDIUM,
      data.status || Status.DRAFT,
      data.tags ? JSON.stringify(data.tags) : null,
      data.technical_details ? JSON.stringify(data.technical_details) : null,
      data.benefits ? JSON.stringify(data.benefits) : null,
      data.applications ? JSON.stringify(data.applications) : null,
      data.keywords ? JSON.stringify(data.keywords) : null,
      data.source_url || null,
      data.created_by || null,
      // tech-hub 同步相关字段（历史列名保留为 tpd_id）
      data.tpd_id || null,
      data.car_models_info ? JSON.stringify(data.car_models_info) : null,
      data.resources_info ? JSON.stringify(data.resources_info) : null,
      data.knowledge_info ? JSON.stringify(data.knowledge_info) : null
    ];

    if (dbType === 'sqlite') {
      // SQLite 不支持 RETURNING，需要先插入再查询
      const sql = `
        INSERT INTO tech_points (
          name, description, category_id, parent_id, level, tech_type, 
          priority, status, tags, technical_details, benefits, applications, 
          keywords, source_url, created_by, tpd_id, car_models_info, 
          resources_info, knowledge_info
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const result = await this.db.query(sql, values);
      const insertId = result.lastID || result.insertId;
      if (!insertId) {
        throw new Error('Failed to create tech point: no ID returned');
      }
      const created = await this.findById(insertId);
      if (!created) {
        throw new Error('Failed to retrieve created tech point');
      }
      return created;
    } else {
      // PostgreSQL 支持 RETURNING
      const sql = `
        INSERT INTO tech_points (
          name, description, category_id, parent_id, level, tech_type, 
          priority, status, tags, technical_details, benefits, applications, 
          keywords, source_url, created_by, tpd_id, car_models_info, 
          resources_info, knowledge_info
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `;
    const result = await this.db.query(sql, values);
    return this.parseJsonFields(result[0]) as TechPoint;
    }
  }

  /**
   * 根据ID获取技术点
   */
  async findById(id: number): Promise<TechPoint | null> {
    const sql = 'SELECT * FROM tech_points WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return result.length > 0 ? this.parseJsonFields(result[0]) as TechPoint : null;
  }

  /**
   * 获取所有技术点
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<TechPoint>> {
    let sql = 'SELECT * FROM tech_points';
    const values: any[] = [];
    const conditions: string[] = [];

    // 添加WHERE条件
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        conditions.push(`${key} = ?`);
        values.push(value);
      });
    }

    // 如果没有明确指定状态筛选，默认排除已归档的记录
    if (!options.where || !options.where.status) {
      conditions.push('status != ?');
      values.push(Status.ARCHIVED);
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
    const total = countResult[0].count;

    // 添加分页
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.db.query(sql, values);
    const data = result.map((row: any) => this.parseJsonFields(row)) as TechPoint[];
    
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
   * 根据分类ID获取技术点
   */
  async findByCategoryId(categoryId: number, options: QueryOptions = {}): Promise<TechPoint[]> {
    const sql = `
      SELECT * FROM tech_points 
      WHERE category_id = ? AND status = ?
      ORDER BY priority DESC, created_at DESC
    `;
    
    const result = await this.db.query(sql, [categoryId, Status.ACTIVE]);
    return result.map((row: any) => this.parseJsonFields(row)) as TechPoint[];
  }

  /**
   * 根据父级ID获取子技术点
   */
  async findByParentId(parentId: number | null, options: QueryOptions = {}): Promise<TechPoint[]> {
    const whereCondition = parentId === null ? 'parent_id IS NULL' : 'parent_id = ?';
    const sql = `
      SELECT * FROM tech_points 
      WHERE ${whereCondition} AND status = ?
      ORDER BY priority DESC, created_at DESC
    `;
    
    const values = parentId === null ? [Status.ACTIVE] : [parentId, Status.ACTIVE];
    const result = await this.db.query(sql, values);
    return result.map((row: any) => this.parseJsonFields(row)) as TechPoint[];
  }

  /**
   * 获取技术点树结构
   */
  async getTree(categoryId?: number): Promise<TechPoint[]> {
    let sql = `
      SELECT * FROM tech_points 
      WHERE status = ?
    `;
    const values: any[] = [Status.ACTIVE];

    if (categoryId) {
      sql += ' AND category_id = ?';
      values.push(categoryId);
    }

    sql += ' ORDER BY level ASC, priority DESC, created_at DESC';
    
    const result = await this.db.query(sql, values);
    const techPoints = result.map((row: any) => this.parseJsonFields(row)) as TechPoint[];
    
    // 构建树结构
    const techPointMap = new Map<number, TechPoint & { children?: TechPoint[] }>();
    const rootTechPoints: (TechPoint & { children?: TechPoint[] })[] = [];

    // 初始化所有技术点
    techPoints.forEach(techPoint => {
      techPointMap.set(techPoint.id, { ...techPoint, children: [] });
    });

    // 构建父子关系
    techPoints.forEach(techPoint => {
      const techPointWithChildren = techPointMap.get(techPoint.id)!;
      
      if (techPoint.parent_id === null) {
        rootTechPoints.push(techPointWithChildren);
      } else {
        const parent = techPointMap.get(techPoint.parent_id!);
        if (parent) {
          parent.children!.push(techPointWithChildren);
        }
      }
    });

    return rootTechPoints;
  }

  /**
   * 更新技术点
   */
  async update(id: number, data: UpdateTechPointDTO): Promise<TechPoint | null> {
    const fields: string[] = [];
    const values: any[] = [];

    // JSON 字段列表（需要序列化）
    const jsonFields = [
      'tags', 
      'technical_details', 
      'benefits', 
      'applications', 
      'keywords',
      'car_models_info',
      'resources_info',
      'knowledge_info'
    ];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (jsonFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(value !== null ? JSON.stringify(value) : null);
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
      UPDATE tech_points 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `;

    const result = await this.db.query(sql, values);
    return result.length > 0 ? this.parseJsonFields(result[0]) as TechPoint : null;
  }

  /**
   * 删除技术点（软删除）
   */
  async delete(id: number): Promise<boolean> {
    // 检查是否有子技术点
    const children = await this.findByParentId(id);
    if (children.length > 0) {
      throw new Error('Cannot delete tech point with child tech points');
    }

    // 检查是否有关联的车型
    const carModelsSql = 'SELECT COUNT(*) as count FROM tech_point_car_models WHERE tech_point_id = ?';
    const carModelsResult = await this.db.query(carModelsSql, [id]);
    if (carModelsResult[0].count > 0) {
      throw new Error('Cannot delete tech point with associated car models');
    }

    const sql = `
      UPDATE tech_points 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await this.db.query(sql, [Status.ARCHIVED, id]);
    return Array.isArray(result) ? result.length > 0 : result.changes > 0;
  }

  /**
   * 物理删除技术点
   */
  async hardDelete(id: number): Promise<boolean> {
    // 检查是否有子技术点
    const children = await this.findByParentId(id);
    if (children.length > 0) {
      throw new Error('Cannot delete tech point with child tech points');
    }

    const sql = 'DELETE FROM tech_points WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return Array.isArray(result) ? result.length > 0 : result.changes > 0;
  }

  /**
   * 搜索技术点
   */
  async search(keyword: string, options: QueryOptions = {}): Promise<PaginatedResult<TechPoint>> {
    let sql = `
      SELECT * FROM tech_points 
      WHERE (name LIKE ? OR description LIKE ? OR keywords LIKE ?) AND status = ?
    `;
    
    const searchTerm = `%${keyword}%`;
    const values = [searchTerm, searchTerm, searchTerm, Status.ACTIVE];

    // 添加额外的WHERE条件
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (!['name', 'description', 'keywords'].includes(key)) {
          sql += ` AND ${key} = ?`;
          values.push(value);
        }
      });
    }

    // 添加排序
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    } else {
      sql += ' ORDER BY priority DESC, created_at DESC';
    }

    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.db.query(countSql, values);
    const total = countResult[0].count;

    // 添加分页
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.db.query(sql, values);
    const data = result.map((row: any) => this.parseJsonFields(row)) as TechPoint[];
    
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
   * 根据标签搜索技术点
   */
  async findByTags(tags: string[], options: QueryOptions = {}): Promise<TechPoint[]> {
    const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
    const sql = `
      SELECT * FROM tech_points 
      WHERE (${tagConditions}) AND status = ?
      ORDER BY priority DESC, created_at DESC
    `;
    
    const values = [...tags.map(tag => `%"${tag}"%`), Status.ACTIVE];
    const result = await this.db.query(sql, values);
    return result.map((row: any) => this.parseJsonFields(row)) as TechPoint[];
  }

  /**
   * 获取技术点统计信息
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const totalSql = 'SELECT COUNT(*) as count FROM tech_points';
    const statusSql = 'SELECT status, COUNT(*) as count FROM tech_points GROUP BY status';
    const typeSql = 'SELECT tech_type, COUNT(*) as count FROM tech_points GROUP BY tech_type';
    const prioritySql = 'SELECT priority, COUNT(*) as count FROM tech_points GROUP BY priority';

    const [totalResult, statusResult, typeResult, priorityResult] = await Promise.all([
      this.db.query(totalSql),
      this.db.query(statusSql),
      this.db.query(typeSql),
      this.db.query(prioritySql)
    ]);

    const byStatus: Record<string, number> = {};
    statusResult.forEach((row: any) => {
      byStatus[row.status] = row.count;
    });

    const byType: Record<string, number> = {};
    typeResult.forEach((row: any) => {
      byType[row.tech_type] = row.count;
    });

    const byPriority: Record<string, number> = {};
    priorityResult.forEach((row: any) => {
      byPriority[row.priority] = row.count;
    });

    return {
      total: totalResult[0].count,
      byStatus,
      byType,
      byPriority
    };
  }

  /**
   * 获取技术点关联的所有内容
   */
  async getAssociatedContent(techPointId: number): Promise<{
    packagingMaterials: any[];
    promotionStrategies: any[];
    pressReleases: any[];
    speeches: any[];
  }> {
    // 初始化返回结果
    const result = {
      packagingMaterials: [] as any[],
      promotionStrategies: [] as any[],
      pressReleases: [] as any[],
      speeches: [] as any[]
    };

    // ⚠️ 以下表已移除，数据存储在 workflow_executions.outputs 中
    // tech_packaging_materials, tech_promotion_strategies, tech_press_releases, tech_speeches
    // 如需获取这些数据，请从 workflow_executions 表中查询 outputs 字段
    
    try {
    // ⚠️ 已废弃: 获取技术包装材料（表已移除）
    // const packagingSql = `
    //   SELECT * FROM tech_packaging_materials 
    //   WHERE tech_point_id = ? 
    //   ORDER BY created_at DESC
    // `;
      // 表已移除，返回空数组
      result.packagingMaterials = [];
      // try {
      //   const packagingResult = await this.db.query(packagingSql, [techPointId]);
      //   result.packagingMaterials = Array.isArray(packagingResult) ? packagingResult : [];
      // } catch (error: any) {
      //   if (!error.message?.includes('no such table')) {
      //     console.warn('获取技术包装材料失败:', error.message);
      //   }
      // }
    } catch (error) {
      // 忽略错误
    }

    try {
    // ⚠️ 已废弃: 获取推广策略（表已移除）
    // const promotionSql = `
    //   SELECT ts.*, pt.weight 
    //   FROM tech_promotion_strategies ts
    //   JOIN promotion_tech_points pt ON ts.id = pt.promotion_id
    //   WHERE pt.tech_point_id = ?
    //   ORDER BY ts.created_at DESC
    // `;
      // 表已移除，返回空数组
      result.promotionStrategies = [];
      // try {
      //   const promotionResult = await this.db.query(promotionSql, [techPointId]);
      //   result.promotionStrategies = Array.isArray(promotionResult) ? promotionResult : [];
      // } catch (error: any) {
      //   if (!error.message?.includes('no such table')) {
      //     console.warn('获取推广策略失败:', error.message);
      //   }
      // }
    } catch (error) {
      // 忽略错误
    }

    try {
    // ⚠️ 已废弃: 获取通稿（表已移除）
    // const pressSql = `
    //   SELECT pr.*, pt.weight 
    //   FROM tech_press_releases pr
    //   JOIN press_tech_points pt ON pr.id = pt.press_release_id
    //   WHERE pt.tech_point_id = ?
    //   ORDER BY pr.created_at DESC
    // `;
      // 表已移除，返回空数组
      result.pressReleases = [];
      // try {
      //   const pressResult = await this.db.query(pressSql, [techPointId]);
      //   result.pressReleases = Array.isArray(pressResult) ? pressResult : [];
      // } catch (error: any) {
      //   if (!error.message?.includes('no such table')) {
      //     console.warn('获取通稿失败:', error.message);
      //   }
      // }
    } catch (error) {
      // 忽略错误
    }

    try {
    // ⚠️ 已废弃: 获取演讲稿（表已移除）
    // const speechSql = `
    //   SELECT sp.*, st.weight 
    //   FROM tech_speeches sp
    //   JOIN speech_tech_points st ON sp.id = st.speech_id
    //   WHERE st.tech_point_id = ?
    //   ORDER BY sp.created_at DESC
    // `;
      // 表已移除，返回空数组
      result.speeches = [];
      // try {
      //   const speechResult = await this.db.query(speechSql, [techPointId]);
      //   result.speeches = Array.isArray(speechResult) ? speechResult : [];
      // } catch (error: any) {
      //   if (!error.message?.includes('no such table')) {
      //     console.warn('获取演讲稿失败:', error.message);
      //   }
      // }
    } catch (error) {
      // 忽略错误
    }

    return result;
  }

  /**
   * 获取技术点关联的车型
   */
  async getAssociatedCarModels(techPointId: number): Promise<any[]> {
    try {
    const sql = `
        SELECT 
          cm.*,
          b.id as brand_id_ref,
          b.name as brand_name,
          b.name_en as brand_name_en,
          tcm.application_status, 
          tcm.implementation_date, 
          tcm.notes
      FROM car_models cm
        LEFT JOIN brands b ON cm.brand_id = b.id
      JOIN tech_point_car_models tcm ON cm.id = tcm.car_model_id
      WHERE tcm.tech_point_id = ?
        ORDER BY COALESCE(b.name, ''), cm.name
    `;
    
      const result = await this.db.query(sql, [techPointId]);
      const carModels = Array.isArray(result) ? result : [];
      
      // 调试日志：检查返回的数据
      if (carModels.length > 0) {
        console.log(`[TechPointModel] 获取技术点 ${techPointId} 的关联车型:`, 
          carModels.map((cm: any) => ({
            id: cm.id,
            name: cm.name,
            brand_id: cm.brand_id,
            brand_name: cm.brand_name,
            brand_id_ref: cm.brand_id_ref
          }))
        );
      }
      
      return carModels;
    } catch (error: any) {
      console.error('获取关联车型失败:', error.message);
      // 如果表不存在，返回空数组
      if (error.message?.includes('no such table')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 关联车型到技术点
   * 注意：CarModel 功能已移除，此方法会返回错误
   */
  async associateCarModel(
    techPointId: number, 
    carModelId: number, 
    applicationStatus?: string,
    implementationDate?: string,
    notes?: string
  ): Promise<any> {
    try {
      // 检查是否已存在关联
      const existingSql = `
        SELECT id FROM tech_point_car_models 
        WHERE tech_point_id = ? AND car_model_id = ?
      `;
      const existing = await this.db.query(existingSql, [techPointId, carModelId]);
      
      if (existing.length > 0) {
        throw new Error('该车型已与此技术点关联');
      }

      const sql = `
        INSERT INTO tech_point_car_models (
          tech_point_id, car_model_id, application_status, 
          implementation_date, notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        RETURNING *
      `;
      
      const values = [
        techPointId,
        carModelId,
        applicationStatus || 'planned',
        implementationDate || null,
        notes || null
      ];
      
      const result = await this.db.query(sql, values);
      return result[0];
    } catch (error: any) {
      console.warn('associateCarModel: CarModel table may not exist', error);
      if (error.message?.includes('no such table')) {
        throw new Error('车型关联功能已移除');
      }
      throw error;
    }
  }

  /**
   * 取消车型与技术点的关联
   * 注意：CarModel 功能已移除，此方法会返回 false
   */
  async disassociateCarModel(techPointId: number, carModelId: number): Promise<boolean> {
    try {
      const sql = `
        DELETE FROM tech_point_car_models 
        WHERE tech_point_id = ? AND car_model_id = ?
      `;
      
      const result = await this.db.query(sql, [techPointId, carModelId]);
      // 对于DELETE操作，检查是否有行被影响
      return Array.isArray(result) ? result.length > 0 : true;
    } catch (error: any) {
      console.warn('disassociateCarModel: CarModel table may not exist', error);
      if (error.message?.includes('no such table')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 更新车型关联信息
   * 注意：CarModel 功能已移除，此方法会返回错误
   */
  async updateCarModelAssociation(
    techPointId: number,
    carModelId: number,
    applicationStatus?: string,
    implementationDate?: string,
    notes?: string
  ): Promise<any> {
    try {
      const sql = `
        UPDATE tech_point_car_models 
        SET 
          application_status = COALESCE(?, application_status),
          implementation_date = COALESCE(?, implementation_date),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
        WHERE tech_point_id = ? AND car_model_id = ?
        RETURNING *
    `;
    
      const values = [
        applicationStatus,
        implementationDate,
        notes,
        techPointId,
        carModelId
      ];
      
      const result = await this.db.query(sql, values);
      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      console.warn('updateCarModelAssociation: CarModel table may not exist', error);
      if (error.message?.includes('no such table')) {
        throw new Error('车型关联功能已移除');
      }
      throw error;
    }
  }

  /**
   * 解析JSON字段
   */
  private parseJsonFields(row: any): any {
    if (!row) return row;
    
    const jsonFields = [
      'tags', 
      'technical_details', 
      'benefits', 
      'applications', 
      'keywords',
      'car_models_info',
      'resources_info',
      'knowledge_info'
    ];
    const parsed = { ...row };
    
    jsonFields.forEach(field => {
      if (parsed[field] && typeof parsed[field] === 'string') {
        try {
          parsed[field] = JSON.parse(parsed[field]);
        } catch (e) {
          // 如果解析失败，保持原值
          console.warn(`解析 JSON 字段 ${field} 失败:`, e);
        }
      } else if (parsed[field] === null || parsed[field] === undefined) {
        // 对于 null 或 undefined，根据字段类型设置默认值
        if (field === 'car_models_info' || field === 'resources_info') {
          parsed[field] = [];
        } else if (field === 'knowledge_info') {
          parsed[field] = null;
        }
      }
    });
    
    return parsed;
  }
}