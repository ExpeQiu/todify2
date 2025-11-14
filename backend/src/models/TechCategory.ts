import { DatabaseManager } from '../config/database';
import { 
  TechCategory, 
  CreateTechCategoryDTO, 
  UpdateTechCategoryDTO, 
  QueryOptions, 
  PaginatedResult,
  Status 
} from '../types/database';

export class TechCategoryModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建技术分类
   */
  async create(data: CreateTechCategoryDTO): Promise<TechCategory> {
    const sql = `
      INSERT INTO tech_categories (name, description, parent_id, level, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const values = [
      data.name,
      data.description || null,
      data.parent_id || null,
      data.level || 1,
      data.sort_order || 0,
      data.status || Status.ACTIVE
    ];

    const result = await this.db.query(sql, values);
    return result[0] as TechCategory;
  }

  /**
   * 根据ID获取技术分类
   */
  async findById(id: number): Promise<TechCategory | null> {
    const sql = 'SELECT * FROM tech_categories WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return result.length > 0 ? result[0] as TechCategory : null;
  }

  /**
   * 获取所有技术分类
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<TechCategory>> {
    let sql = 'SELECT * FROM tech_categories';
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
      sql += ' ORDER BY sort_order ASC, created_at DESC';
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
    
    const pageSize = options.limit || total;
    const page = options.offset ? Math.floor(options.offset / pageSize) + 1 : 1;
    
    return {
      data: result as TechCategory[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 根据父级ID获取子分类
   */
  async findByParentId(parentId: number | null, options: QueryOptions = {}): Promise<TechCategory[]> {
    const whereCondition = parentId === null ? 'parent_id IS NULL' : 'parent_id = ?';
    const sql = `
      SELECT * FROM tech_categories 
      WHERE ${whereCondition} AND status = ?
      ORDER BY sort_order ASC, name ASC
    `;
    
    const values = parentId === null ? [Status.ACTIVE] : [parentId, Status.ACTIVE];
    const result = await this.db.query(sql, values);
    return result as TechCategory[];
  }

  /**
   * 获取分类树结构
   */
  async getTree(): Promise<TechCategory[]> {
    const sql = `
      SELECT * FROM tech_categories 
      WHERE status = ? 
      ORDER BY level ASC, sort_order ASC, name ASC
    `;
    
    const result = await this.db.query(sql, [Status.ACTIVE]);
    const categories = result as TechCategory[];
    
    // 构建树结构
    const categoryMap = new Map<number, TechCategory & { children?: TechCategory[] }>();
    const rootCategories: (TechCategory & { children?: TechCategory[] })[] = [];

    // 初始化所有分类
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 构建父子关系
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id === null) {
        rootCategories.push(categoryWithChildren);
      } else {
        const parent = categoryMap.get(category.parent_id!);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;
  }

  /**
   * 更新技术分类
   */
  async update(id: number, data: UpdateTechCategoryDTO): Promise<TechCategory | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    
    const sql = `
      UPDATE tech_categories 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `;

    const result = await this.db.query(sql, values);
    return result.length > 0 ? result[0] as TechCategory : null;
  }

  /**
   * 删除技术分类（软删除）
   */
  async delete(id: number): Promise<boolean> {
    // 检查是否有子分类
    const children = await this.findByParentId(id);
    if (children.length > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    // 检查是否有关联的技术点
    const techPointsSql = 'SELECT COUNT(*) as count FROM tech_points WHERE category_id = ?';
    const techPointsResult = await this.db.query(techPointsSql, [id]);
    if (techPointsResult[0].count > 0) {
      throw new Error('Cannot delete category with associated tech points');
    }

    const sql = `
      UPDATE tech_categories 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await this.db.query(sql, [Status.INACTIVE, id]);
    return result.affectedRows > 0;
  }

  /**
   * 物理删除技术分类
   */
  async hardDelete(id: number): Promise<boolean> {
    // 检查是否有子分类
    const children = await this.findByParentId(id);
    if (children.length > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    // 检查是否有关联的技术点
    const techPointsSql = 'SELECT COUNT(*) as count FROM tech_points WHERE category_id = ?';
    const techPointsResult = await this.db.query(techPointsSql, [id]);
    if (techPointsResult[0].count > 0) {
      throw new Error('Cannot delete category with associated tech points');
    }

    const sql = 'DELETE FROM tech_categories WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 搜索技术分类
   */
  async search(keyword: string, options: QueryOptions = {}): Promise<PaginatedResult<TechCategory>> {
    const searchOptions = {
      ...options,
      where: {
        ...options.where,
      }
    };

    let sql = `
      SELECT * FROM tech_categories 
      WHERE (name LIKE ? OR description LIKE ?) AND status = ?
    `;
    
    const searchTerm = `%${keyword}%`;
    const values = [searchTerm, searchTerm, Status.ACTIVE];

    // 添加额外的WHERE条件
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'description') {
          sql += ` AND ${key} = ?`;
          values.push(value);
        }
      });
    }

    // 添加排序
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    } else {
      sql += ' ORDER BY sort_order ASC, name ASC';
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
    
    const pageSize = options.limit || total;
    const page = options.offset ? Math.floor(options.offset / pageSize) + 1 : 1;
    
    return {
      data: result as TechCategory[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 批量更新排序
   */
  async updateSortOrder(updates: { id: number; sort_order: number }[]): Promise<boolean> {
    const transaction = await this.db.transaction();
    
    try {
      for (const update of updates) {
        const sql = `
          UPDATE tech_categories 
          SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        await transaction.query(sql, [update.sort_order, update.id]);
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}