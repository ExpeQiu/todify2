import { DatabaseManager } from '../config/database';

// ==================== 类型定义 ====================

/**
 * 文章类型数据库记录
 */
export interface ArticleType {
  id: string;
  code: string; // 唯一标识码，如 media_release
  name: string; // 显示名称，如 媒体通稿
  description?: string; // 描述
  enabled: number; // 0或1，是否启用
  sort_order: number; // 排序顺序
  created_at?: string;
  updated_at?: string;
}

/**
 * 创建文章类型DTO
 */
export interface CreateArticleTypeDTO {
  code: string;
  name: string;
  description?: string;
  enabled?: number;
  sort_order?: number;
}

/**
 * 更新文章类型DTO
 */
export interface UpdateArticleTypeDTO {
  code?: string;
  name?: string;
  description?: string;
  enabled?: number;
  sort_order?: number;
}

// ==================== 数据模型类 ====================

export class ArticleTypeModel {
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
   * 初始化表结构
   */
  async initializeTable(): Promise<void> {
    await this.ensureConnection();
    // 使用统一的SQL语句（SQLite和PostgreSQL都支持）
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS article_types (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.db.query(createTableSQL);
    } catch (error: any) {
      // 忽略"表已存在"等错误
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建article_types表时出现警告:', error.message);
      }
    }
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_article_types_code ON article_types(code);',
      'CREATE INDEX IF NOT EXISTS idx_article_types_enabled ON article_types(enabled);',
    ];
    
    for (const indexSQL of indexes) {
      try {
        await this.db.query(indexSQL);
      } catch (error: any) {
        // 忽略索引已存在的错误
        if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
          console.warn('创建索引时出现警告:', error.message);
        }
      }
    }

    // 初始化默认数据
    await this.initializeDefaultData();
    
    // 初始化关联表
    await this.initializeAssociationTable();
  }

  /**
   * 初始化默认数据
   */
  private async initializeDefaultData(): Promise<void> {
    const existing = await this.findAll();
    if (existing.length === 0) {
      const defaultTypes: CreateArticleTypeDTO[] = [
        { code: 'media_release', name: '媒体通稿', description: '面向媒体的新闻通稿', enabled: 1, sort_order: 1 },
        { code: 'internal_memo', name: '内部通报', description: '面向内部的通报文档', enabled: 1, sort_order: 2 },
        { code: 'social_media', name: '社交媒体', description: '面向社交媒体的内容', enabled: 1, sort_order: 3 },
      ];

      for (const type of defaultTypes) {
        await this.create(type);
      }
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `at_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建文章类型
   */
  async create(data: CreateArticleTypeDTO): Promise<ArticleType> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const articleType: ArticleType = {
      id,
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      enabled: data.enabled !== undefined ? data.enabled : 1,
      sort_order: data.sort_order !== undefined ? data.sort_order : 0,
      created_at: now,
      updated_at: now,
    };

    await this.db.query(
      `INSERT INTO article_types (id, code, name, description, enabled, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        articleType.id,
        articleType.code,
        articleType.name,
        articleType.description,
        articleType.enabled,
        articleType.sort_order,
        articleType.created_at,
        articleType.updated_at,
      ]
    );

    return articleType;
  }

  /**
   * 查找所有文章类型
   */
  async findAll(enabledOnly: boolean = false): Promise<ArticleType[]> {
    let query = 'SELECT * FROM article_types';
    const conditions: string[] = [];
    
    if (enabledOnly) {
      conditions.push('enabled = 1');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY sort_order ASC, created_at ASC';

    const rows = await this.db.query(query);
    return rows as ArticleType[];
  }

  /**
   * 根据ID查找文章类型
   */
  async findById(id: string): Promise<ArticleType | null> {
    const rows = await this.db.query('SELECT * FROM article_types WHERE id = ?', [id]);
    return rows.length > 0 ? (rows[0] as ArticleType) : null;
  }

  /**
   * 根据code查找文章类型
   */
  async findByCode(code: string): Promise<ArticleType | null> {
    const rows = await this.db.query('SELECT * FROM article_types WHERE code = ?', [code]);
    return rows.length > 0 ? (rows[0] as ArticleType) : null;
  }

  /**
   * 更新文章类型
   */
  async update(id: string, data: UpdateArticleTypeDTO): Promise<ArticleType | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.code !== undefined) {
      updates.push('code = ?');
      values.push(data.code);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(data.enabled);
    }
    if (data.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(data.sort_order);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.query(
      `UPDATE article_types SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * 删除文章类型
   */
  async delete(id: string): Promise<boolean> {
    try {
      // 先删除关联关系
      await this.db.query('DELETE FROM article_type_ai_roles WHERE article_type_id = ?', [id]);
      // 再删除文章类型
      await this.db.query('DELETE FROM article_types WHERE id = ?', [id]);
      // 检查是否真的删除了（通过查询确认）
      const deleted = await this.findById(id);
      return deleted === null;
    } catch (error) {
      console.error('删除文章类型失败:', error);
      return false;
    }
  }

  /**
   * 初始化关联表
   */
  async initializeAssociationTable(): Promise<void> {
    await this.ensureConnection();
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS article_type_ai_roles (
        id TEXT PRIMARY KEY,
        article_type_id TEXT NOT NULL,
        ai_role_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_type_id) REFERENCES article_types(id) ON DELETE CASCADE,
        FOREIGN KEY (ai_role_id) REFERENCES ai_roles(id) ON DELETE CASCADE,
        UNIQUE(article_type_id, ai_role_id)
      );
    `;
    
    try {
      await this.db.query(createTableSQL);
      
      // 创建索引
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_article_type_ai_roles_article_type_id ON article_type_ai_roles(article_type_id);',
        'CREATE INDEX IF NOT EXISTS idx_article_type_ai_roles_ai_role_id ON article_type_ai_roles(ai_role_id);',
      ];
      
      for (const indexSQL of indexes) {
        try {
          await this.db.query(indexSQL);
        } catch (error: any) {
          if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
            console.warn('创建索引时出现警告:', error.message);
          }
        }
      }
    } catch (error: any) {
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建article_type_ai_roles表时出现警告:', error.message);
      }
    }
  }

  /**
   * 生成关联ID
   */
  private generateAssociationId(): string {
    return `atr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取文章类型关联的AI角色ID列表
   */
  async getAssociatedAIRoleIds(articleTypeId: string): Promise<string[]> {
    await this.ensureConnection();
    const rows = await this.db.query(
      'SELECT ai_role_id FROM article_type_ai_roles WHERE article_type_id = ?',
      [articleTypeId]
    );
    return rows.map((row: any) => row.ai_role_id);
  }

  /**
   * 设置文章类型关联的AI角色
   */
  async setAssociatedAIRoles(articleTypeId: string, aiRoleIds: string[]): Promise<void> {
    await this.ensureConnection();
    // 先删除现有关联
    await this.db.query('DELETE FROM article_type_ai_roles WHERE article_type_id = ?', [articleTypeId]);
    
    // 插入新关联
    if (aiRoleIds.length > 0) {
      const now = new Date().toISOString();
      for (const roleId of aiRoleIds) {
        const id = this.generateAssociationId();
        await this.db.query(
          'INSERT INTO article_type_ai_roles (id, article_type_id, ai_role_id, created_at) VALUES (?, ?, ?, ?)',
          [id, articleTypeId, roleId, now]
        );
      }
    }
  }
}

// 注意：请使用 models/index.ts 中导出的 articleTypeModel 实例，
// 那里已正确传入 DatabaseManager 实例。
// 这里不再导出未初始化的单例，以避免混淆。

