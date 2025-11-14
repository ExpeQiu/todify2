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
    const sql = `
      INSERT INTO tech_points (
        name, description, category_id, parent_id, level, tech_type, 
        priority, status, tags, technical_details, benefits, applications, 
        keywords, source_url, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
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
      data.created_by || null
    ];

    const result = await this.db.query(sql, values);
    return this.parseJsonFields(result[0]) as TechPoint;
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

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (['tags', 'technical_details', 'benefits', 'applications', 'keywords'].includes(key)) {
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
    // 获取技术包装材料
    const packagingSql = `
      SELECT * FROM tech_packaging_materials 
      WHERE tech_point_id = ? 
      ORDER BY created_at DESC
    `;
    
    // 获取推广策略
    const promotionSql = `
      SELECT ts.*, pt.weight 
      FROM tech_promotion_strategies ts
      JOIN promotion_tech_points pt ON ts.id = pt.promotion_id
      WHERE pt.tech_point_id = ?
      ORDER BY ts.created_at DESC
    `;
    
    // 获取通稿
    const pressSql = `
      SELECT pr.*, pt.weight 
      FROM tech_press_releases pr
      JOIN press_tech_points pt ON pr.id = pt.press_release_id
      WHERE pt.tech_point_id = ?
      ORDER BY pr.created_at DESC
    `;
    
    // 获取演讲稿
    const speechSql = `
      SELECT sp.*, st.weight 
      FROM tech_speeches sp
      JOIN speech_tech_points st ON sp.id = st.speech_id
      WHERE st.tech_point_id = ?
      ORDER BY sp.created_at DESC
    `;

    const [packagingResult, promotionResult, pressResult, speechResult] = await Promise.all([
      this.db.query(packagingSql, [techPointId]),
      this.db.query(promotionSql, [techPointId]),
      this.db.query(pressSql, [techPointId]),
      this.db.query(speechSql, [techPointId])
    ]);

    return {
      packagingMaterials: packagingResult,
      promotionStrategies: promotionResult,
      pressReleases: pressResult,
      speeches: speechResult
    };
  }

  /**
   * 获取技术点关联的车型
   */
  async getAssociatedCarModels(techPointId: number): Promise<any[]> {
    const sql = `
      SELECT cm.*, tcm.application_status, tcm.implementation_date, tcm.notes
      FROM car_models cm
      JOIN tech_point_car_models tcm ON cm.id = tcm.car_model_id
      WHERE tcm.tech_point_id = ?
      ORDER BY cm.brand, cm.series, cm.model
    `;
    
    return await this.db.query(sql, [techPointId]);
  }

  /**
   * 关联车型到技术点
   */
  async associateCarModel(
    techPointId: number, 
    carModelId: number, 
    applicationStatus?: string,
    implementationDate?: string,
    notes?: string
  ): Promise<any> {
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
  }

  /**
   * 取消车型与技术点的关联
   */
  async disassociateCarModel(techPointId: number, carModelId: number): Promise<boolean> {
    const sql = `
      DELETE FROM tech_point_car_models 
      WHERE tech_point_id = ? AND car_model_id = ?
    `;
    
    const result = await this.db.query(sql, [techPointId, carModelId]);
    // 对于DELETE操作，检查是否有行被影响
    return Array.isArray(result) ? result.length > 0 : true;
  }

  /**
   * 更新车型关联信息
   */
  async updateCarModelAssociation(
    techPointId: number,
    carModelId: number,
    applicationStatus?: string,
    implementationDate?: string,
    notes?: string
  ): Promise<any> {
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
  }

  /**
   * 解析JSON字段
   */
  private parseJsonFields(row: any): any {
    if (!row) return row;
    
    const jsonFields = ['tags', 'technical_details', 'benefits', 'applications', 'keywords'];
    const parsed = { ...row };
    
    jsonFields.forEach(field => {
      if (parsed[field] && typeof parsed[field] === 'string') {
        try {
          parsed[field] = JSON.parse(parsed[field]);
        } catch (e) {
          // 如果解析失败，保持原值
        }
      }
    });
    
    return parsed;
  }
}