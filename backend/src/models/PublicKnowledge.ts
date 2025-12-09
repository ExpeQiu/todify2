import { DatabaseManager } from '../config/database';
import { logger } from '../shared/lib/logger';

// ==================== 类型定义 ====================

/**
 * 公共知识库分类
 */
export interface PublicKnowledgeCategory {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

/**
 * 公共知识库文件
 */
export interface PublicKnowledgeFile {
  id: number;
  category_id: number | null;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_by?: number;
  created_at: string;
  updated_at?: string;
}

/**
 * 创建分类DTO
 */
export interface CreateCategoryDTO {
  name: string;
  parent_id?: number | null;
  sort_order?: number;
}

/**
 * 更新分类DTO
 */
export interface UpdateCategoryDTO {
  name?: string;
  parent_id?: number | null;
  sort_order?: number;
}

/**
 * 创建文件DTO
 */
export interface CreateFileDTO {
  category_id?: number | null;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_by?: number;
}

/**
 * 更新文件DTO
 */
export interface UpdateFileDTO {
  category_id?: number | null;
  name?: string;
  description?: string;
}

/**
 * 分类树节点（带子节点）
 */
export interface CategoryTreeNode extends PublicKnowledgeCategory {
  children?: CategoryTreeNode[];
}

// ==================== 模型类 ====================

/**
 * 公共知识库模型
 */
export class PublicKnowledgeModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 确保数据库连接
   */
  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库管理器未初始化');
    }
    await this.db.connect();
  }

  /**
   * 初始化数据库表
   */
  async initializeTable(): Promise<void> {
    await this.ensureConnection();

    const dbType = this.db.getType();
    
    if (dbType === 'sqlite') {
      // SQLite 表结构
      const createCategoriesTableSQL = `
        CREATE TABLE IF NOT EXISTS public_knowledge_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_id INTEGER,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES public_knowledge_categories(id) ON DELETE SET NULL
        );
      `;

      const createFilesTableSQL = `
        CREATE TABLE IF NOT EXISTS public_knowledge_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER,
          name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          description TEXT,
          uploaded_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES public_knowledge_categories(id) ON DELETE SET NULL
        );
      `;

      const createIndexesSQL = `
        CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public_knowledge_categories(parent_id);
        CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public_knowledge_categories(sort_order);
        CREATE INDEX IF NOT EXISTS idx_files_category_id ON public_knowledge_files(category_id);
        CREATE INDEX IF NOT EXISTS idx_files_created_at ON public_knowledge_files(created_at);
      `;

      try {
        await this.db.query(createCategoriesTableSQL);
        await this.db.query(createFilesTableSQL);
        const indexStatements = createIndexesSQL.split(';').filter(s => s.trim());
        for (const statement of indexStatements) {
          if (statement.trim()) {
            await this.db.query(statement);
          }
        }
        logger.info('公共知识库表初始化成功 (SQLite)');
      } catch (error) {
        logger.error('公共知识库表初始化失败:', error);
        throw error;
      }
    } else {
      // PostgreSQL 表结构
      const createCategoriesTableSQL = `
        CREATE TABLE IF NOT EXISTS public_knowledge_categories (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          parent_id BIGINT,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES public_knowledge_categories(id) ON DELETE SET NULL
        );
      `;

      const createFilesTableSQL = `
        CREATE TABLE IF NOT EXISTS public_knowledge_files (
          id BIGSERIAL PRIMARY KEY,
          category_id BIGINT,
          name VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          file_size BIGINT NOT NULL,
          description TEXT,
          uploaded_by BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES public_knowledge_categories(id) ON DELETE SET NULL
        );
      `;

      const createIndexesSQL = `
        CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public_knowledge_categories(parent_id);
        CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public_knowledge_categories(sort_order);
        CREATE INDEX IF NOT EXISTS idx_files_category_id ON public_knowledge_files(category_id);
        CREATE INDEX IF NOT EXISTS idx_files_created_at ON public_knowledge_files(created_at);
      `;

      try {
        await this.db.query(createCategoriesTableSQL);
        await this.db.query(createFilesTableSQL);
        const indexStatements = createIndexesSQL.split(';').filter(s => s.trim());
        for (const statement of indexStatements) {
          if (statement.trim()) {
            await this.db.query(statement);
          }
        }
        logger.info('公共知识库表初始化成功 (PostgreSQL)');
      } catch (error) {
        logger.error('公共知识库表初始化失败:', error);
        throw error;
      }
    }
  }

  // ==================== 分类相关方法 ====================

  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryDTO): Promise<PublicKnowledgeCategory> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    const sql = dbType === 'sqlite'
      ? `INSERT INTO public_knowledge_categories (name, parent_id, sort_order) 
         VALUES (?, ?, ?)`
      : `INSERT INTO public_knowledge_categories (name, parent_id, sort_order) 
         VALUES ($1, $2, $3) RETURNING *`;
    
    const values = [
      data.name,
      data.parent_id ?? null,
      data.sort_order ?? 0
    ];

    if (dbType === 'sqlite') {
      await this.db.query(sql, values);
      // SQLite 需要单独查询最后插入的ID
      const result = await this.db.query('SELECT * FROM public_knowledge_categories WHERE id = last_insert_rowid()');
      return result[0] as PublicKnowledgeCategory;
    } else {
      const result = await this.db.query(sql, values);
      return result[0] as PublicKnowledgeCategory;
    }
  }

  /**
   * 根据ID获取分类
   */
  async getCategoryById(id: number): Promise<PublicKnowledgeCategory | null> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    const sql = dbType === 'sqlite'
      ? 'SELECT * FROM public_knowledge_categories WHERE id = ?'
      : 'SELECT * FROM public_knowledge_categories WHERE id = $1';
    
    const result = await this.db.query(sql, [id]);
    return result.length > 0 ? result[0] as PublicKnowledgeCategory : null;
  }

  /**
   * 获取所有分类
   */
  async getAllCategories(): Promise<PublicKnowledgeCategory[]> {
    await this.ensureConnection();
    
    const sql = 'SELECT * FROM public_knowledge_categories ORDER BY sort_order ASC, created_at ASC';
    const result = await this.db.query(sql);
    return result as PublicKnowledgeCategory[];
  }

  /**
   * 根据父ID获取子分类
   */
  async getCategoriesByParentId(parentId: number | null): Promise<PublicKnowledgeCategory[]> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    const whereClause = parentId === null 
      ? (dbType === 'sqlite' ? 'parent_id IS NULL' : 'parent_id IS NULL')
      : (dbType === 'sqlite' ? 'parent_id = ?' : 'parent_id = $1');
    
    const sql = `SELECT * FROM public_knowledge_categories WHERE ${whereClause} ORDER BY sort_order ASC, name ASC`;
    const values = parentId === null ? [] : [parentId];
    
    const result = await this.db.query(sql, values);
    return result as PublicKnowledgeCategory[];
  }

  /**
   * 获取分类树
   */
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.getAllCategories();
    
    // 构建分类映射
    const categoryMap = new Map<number, CategoryTreeNode>();
    const rootCategories: CategoryTreeNode[] = [];

    // 初始化所有分类
    allCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 构建父子关系
    allCategories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!;
      
      if (category.parent_id === null) {
        rootCategories.push(categoryNode);
      } else {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(categoryNode);
        }
      }
    });

    return rootCategories;
  }

  /**
   * 更新分类
   */
  async updateCategory(id: number, data: UpdateCategoryDTO): Promise<PublicKnowledgeCategory | null> {
    await this.ensureConnection();
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      const dbType = this.db.getType();
      fields.push(dbType === 'sqlite' ? 'name = ?' : `name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.parent_id !== undefined) {
      const dbType = this.db.getType();
      fields.push(dbType === 'sqlite' ? 'parent_id = ?' : `parent_id = $${paramIndex++}`);
      values.push(data.parent_id);
    }
    if (data.sort_order !== undefined) {
      const dbType = this.db.getType();
      fields.push(dbType === 'sqlite' ? 'sort_order = ?' : `sort_order = $${paramIndex++}`);
      values.push(data.sort_order);
    }

    if (fields.length === 0) {
      return this.getCategoryById(id);
    }

    const dbType = this.db.getType();
    fields.push(dbType === 'sqlite' ? 'updated_at = CURRENT_TIMESTAMP' : 'updated_at = CURRENT_TIMESTAMP');
    
    const sql = dbType === 'sqlite'
      ? `UPDATE public_knowledge_categories SET ${fields.join(', ')} WHERE id = ?`
      : `UPDATE public_knowledge_categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    values.push(id);

    if (dbType === 'sqlite') {
      await this.db.query(sql, values);
      return this.getCategoryById(id);
    } else {
      const result = await this.db.query(sql, values);
      return result.length > 0 ? result[0] as PublicKnowledgeCategory : null;
    }
  }

  /**
   * 删除分类（需要先删除子分类和关联文件）
   */
  async deleteCategory(id: number): Promise<boolean> {
    await this.ensureConnection();
    
    // 检查是否有子分类
    const children = await this.getCategoriesByParentId(id);
    if (children.length > 0) {
      throw new Error('无法删除包含子分类的分类');
    }

    // 检查是否有关联的文件
    const files = await this.getFilesByCategoryId(id);
    if (files.length > 0) {
      throw new Error('无法删除包含文件的分类');
    }

    const dbType = this.db.getType();
    const sql = dbType === 'sqlite'
      ? 'DELETE FROM public_knowledge_categories WHERE id = ?'
      : 'DELETE FROM public_knowledge_categories WHERE id = $1';
    
    await this.db.query(sql, [id]);
    return true;
  }

  // ==================== 文件相关方法 ====================

  /**
   * 创建文件记录
   */
  async createFile(data: CreateFileDTO): Promise<PublicKnowledgeFile> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    const sql = dbType === 'sqlite'
      ? `INSERT INTO public_knowledge_files (category_id, name, file_path, file_type, file_size, description, uploaded_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO public_knowledge_files (category_id, name, file_path, file_type, file_size, description, uploaded_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    
    const values = [
      data.category_id ?? null,
      data.name,
      data.file_path,
      data.file_type,
      data.file_size,
      data.description ?? null,
      data.uploaded_by ?? null
    ];

    if (dbType === 'sqlite') {
      await this.db.query(sql, values);
      const result = await this.db.query('SELECT * FROM public_knowledge_files WHERE id = last_insert_rowid()');
      return result[0] as PublicKnowledgeFile;
    } else {
      const result = await this.db.query(sql, values);
      return result[0] as PublicKnowledgeFile;
    }
  }

  /**
   * 根据ID获取文件
   */
  async getFileById(id: number): Promise<PublicKnowledgeFile | null> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    const sql = dbType === 'sqlite'
      ? 'SELECT * FROM public_knowledge_files WHERE id = ?'
      : 'SELECT * FROM public_knowledge_files WHERE id = $1';
    
    const result = await this.db.query(sql, [id]);
    return result.length > 0 ? result[0] as PublicKnowledgeFile : null;
  }

  /**
   * 递归获取所有子分类ID（包括子分类的子分类）
   */
  async getAllDescendantCategoryIds(categoryId: number): Promise<number[]> {
    const result: number[] = [categoryId];
    const children = await this.getCategoriesByParentId(categoryId);
    
    for (const child of children) {
      const descendantIds = await this.getAllDescendantCategoryIds(child.id);
      result.push(...descendantIds);
    }
    
    return result;
  }

  /**
   * 获取所有文件（支持递归获取子分类的文件）
   */
  async getAllFiles(categoryId?: number | null): Promise<PublicKnowledgeFile[]> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    let sql = 'SELECT * FROM public_knowledge_files';
    const values: any[] = [];

    if (categoryId !== undefined) {
      if (categoryId === null) {
        sql += dbType === 'sqlite' ? ' WHERE category_id IS NULL' : ' WHERE category_id IS NULL';
      } else {
        // 获取指定分类及其所有子分类的ID
        const allCategoryIds = await this.getAllDescendantCategoryIds(categoryId);
        
        // 构建 IN 查询
        if (allCategoryIds.length === 1) {
          sql += dbType === 'sqlite' ? ' WHERE category_id = ?' : ' WHERE category_id = $1';
          values.push(allCategoryIds[0]);
        } else {
          // 为多个ID创建占位符
          const placeholders = allCategoryIds.map((_, index) => {
            return dbType === 'sqlite' ? '?' : `$${index + 1}`;
          }).join(', ');
          sql += ` WHERE category_id IN (${placeholders})`;
          values.push(...allCategoryIds);
        }
      }
    }

    sql += ' ORDER BY created_at DESC';
    
    const result = await this.db.query(sql, values);
    return result as PublicKnowledgeFile[];
  }

  /**
   * 根据分类ID获取文件
   */
  async getFilesByCategoryId(categoryId: number | null): Promise<PublicKnowledgeFile[]> {
    return this.getAllFiles(categoryId);
  }

  /**
   * 更新文件
   */
  async updateFile(id: number, data: UpdateFileDTO): Promise<PublicKnowledgeFile | null> {
    await this.ensureConnection();
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.category_id !== undefined) {
      const dbType = this.db.getType();
      fields.push(dbType === 'sqlite' ? 'category_id = ?' : `category_id = $${paramIndex++}`);
      values.push(data.category_id);
    }
    if (data.name !== undefined) {
      const dbType = this.db.getType();
      fields.push(dbType === 'sqlite' ? 'name = ?' : `name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      const dbType = this.db.getType();
      fields.push(dbType === 'sqlite' ? 'description = ?' : `description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (fields.length === 0) {
      return this.getFileById(id);
    }

    const dbType = this.db.getType();
    fields.push(dbType === 'sqlite' ? 'updated_at = CURRENT_TIMESTAMP' : 'updated_at = CURRENT_TIMESTAMP');
    
    const sql = dbType === 'sqlite'
      ? `UPDATE public_knowledge_files SET ${fields.join(', ')} WHERE id = ?`
      : `UPDATE public_knowledge_files SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    values.push(id);

    if (dbType === 'sqlite') {
      await this.db.query(sql, values);
      return this.getFileById(id);
    } else {
      const result = await this.db.query(sql, values);
      return result.length > 0 ? result[0] as PublicKnowledgeFile : null;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(id: number): Promise<boolean> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    const sql = dbType === 'sqlite'
      ? 'DELETE FROM public_knowledge_files WHERE id = ?'
      : 'DELETE FROM public_knowledge_files WHERE id = $1';
    
    await this.db.query(sql, [id]);
    return true;
  }
}
