import { DatabaseManager } from '../config/database';

// ==================== 类型定义 ====================

/**
 * AI角色数据库记录
 */
export interface AIRole {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  system_prompt?: string;
  dify_config: string; // JSON字符串
  enabled: number; // 0或1
  source?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Dify配置
 */
export interface DifyConfig {
  apiUrl: string;
  apiKey: string;
  connectionType: 'chatflow' | 'workflow';
  inputFields?: Array<{
    variable: string;
    label: string;
    type: string;
    required?: boolean;
    maxLength?: number;
    placeholder?: string;
    hint?: string;
    options?: string[];
    default?: string;
    allowedFileTypes?: string[];
    allowedFileExtensions?: string[];
    maxFiles?: number;
  }>;
}

/**
 * AI角色配置（前端格式）
 */
export interface AIRoleConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  systemPrompt?: string;
  difyConfig: DifyConfig;
  enabled: boolean;
  source?: 'smart-workflow' | 'independent-page' | 'custom';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建AI角色DTO
 */
export interface CreateAIRoleDTO {
  id?: string;
  name: string;
  description: string;
  avatar?: string;
  systemPrompt?: string;
  difyConfig: DifyConfig;
  enabled?: boolean;
  source?: 'smart-workflow' | 'independent-page' | 'custom';
}

/**
 * 更新AI角色DTO
 */
export interface UpdateAIRoleDTO {
  name?: string;
  description?: string;
  avatar?: string;
  systemPrompt?: string;
  difyConfig?: DifyConfig;
  enabled?: boolean;
  source?: 'smart-workflow' | 'independent-page' | 'custom';
}

// ==================== 模型类 ====================

/**
 * AI角色模型
 */
export class AIRoleModel {
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
   * 将数据库记录转换为前端格式
   */
  private toAIRoleConfig(row: AIRole): AIRoleConfig {
    const difyConfig: DifyConfig = JSON.parse(row.dify_config);
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      avatar: row.avatar || undefined,
      systemPrompt: row.system_prompt || undefined,
      difyConfig,
      enabled: row.enabled === 1,
      source: (row.source as any) || undefined,
      createdAt: new Date(row.created_at || Date.now()),
      updatedAt: new Date(row.updated_at || Date.now()),
    };
  }

  /**
   * 初始化数据库表
   */
  async initializeTable(): Promise<void> {
    await this.ensureConnection();
    
    // 直接执行CREATE TABLE语句（避免文件系统依赖）
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ai_roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        avatar TEXT,
        system_prompt TEXT,
        dify_config TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.db.query(createTableSQL);
    } catch (error: any) {
      // 忽略"表已存在"等错误
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建ai_roles表时出现警告:', error.message);
      }
    }
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_name ON ai_roles(name);',
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_enabled ON ai_roles(enabled);',
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_source ON ai_roles(source);',
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_updated ON ai_roles(updated_at DESC);',
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
  }

  /**
   * 创建AI角色
   */
  async create(data: CreateAIRoleDTO): Promise<AIRoleConfig> {
    await this.ensureConnection();
    await this.initializeTable();

    const id = data.id || `ai-role-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const enabled = data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1;

    const sql = `
      INSERT INTO ai_roles (
        id, name, description, avatar, system_prompt, dify_config, enabled, source,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const params = [
      id,
      data.name,
      data.description,
      data.avatar || null,
      data.systemPrompt || null,
      JSON.stringify(data.difyConfig),
      enabled,
      data.source || null,
    ];

    await this.db.query(sql, params);

    return await this.getById(id) as AIRoleConfig;
  }

  /**
   * 根据ID获取AI角色
   */
  async getById(id: string): Promise<AIRoleConfig | null> {
    await this.ensureConnection();
    await this.initializeTable();

    const sql = 'SELECT * FROM ai_roles WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    return this.toAIRoleConfig(rows[0] as AIRole);
  }

  /**
   * 获取所有AI角色
   */
  async getAll(): Promise<AIRoleConfig[]> {
    await this.ensureConnection();
    await this.initializeTable();

    const sql = 'SELECT * FROM ai_roles ORDER BY updated_at DESC';
    const result = await this.db.query(sql);
    const rows = Array.isArray(result) ? result : result.rows || [];

    return rows.map((row: AIRole) => this.toAIRoleConfig(row));
  }

  /**
   * 获取启用的AI角色
   */
  async getEnabled(): Promise<AIRoleConfig[]> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM ai_roles WHERE enabled = 1 ORDER BY updated_at DESC';
    const result = await this.db.query(sql);
    const rows = Array.isArray(result) ? result : result.rows || [];

    return rows.map((row: AIRole) => this.toAIRoleConfig(row));
  }

  /**
   * 更新AI角色
   */
  async update(id: string, data: UpdateAIRoleDTO): Promise<AIRoleConfig> {
    await this.ensureConnection();

    // 获取现有角色
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`AI角色不存在: ${id}`);
    }

    const sql = `
      UPDATE ai_roles SET
        name = ?,
        description = ?,
        avatar = ?,
        system_prompt = ?,
        dify_config = ?,
        enabled = ?,
        source = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      data.name ?? existing.name,
      data.description ?? existing.description,
      data.avatar !== undefined ? data.avatar : existing.avatar,
      data.systemPrompt !== undefined ? data.systemPrompt : existing.systemPrompt,
      data.difyConfig ? JSON.stringify(data.difyConfig) : JSON.stringify(existing.difyConfig),
      data.enabled !== undefined ? (data.enabled ? 1 : 0) : existing.enabled ? 1 : 0,
      data.source !== undefined ? data.source : existing.source,
      id,
    ];

    await this.db.query(sql, params);

    return await this.getById(id) as AIRoleConfig;
  }

  /**
   * 删除AI角色
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();

    const sql = 'DELETE FROM ai_roles WHERE id = ?';
    const result: any = await this.db.query(sql, [id]);

    return (result.changes && result.changes > 0) || false;
  }

  /**
   * 搜索AI角色
   */
  async search(query: string): Promise<AIRoleConfig[]> {
    await this.ensureConnection();

    const sql = `
      SELECT * FROM ai_roles
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY updated_at DESC
    `;

    const searchPattern = `%${query}%`;
    const result = await this.db.query(sql, [searchPattern, searchPattern]);
    const rows = Array.isArray(result) ? result : result.rows || [];

    return rows.map((row: AIRole) => this.toAIRoleConfig(row));
  }

  /**
   * 根据来源获取AI角色
   */
  async getBySource(source: string): Promise<AIRoleConfig[]> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM ai_roles WHERE source = ? ORDER BY updated_at DESC';
    const result = await this.db.query(sql, [source]);
    const rows = Array.isArray(result) ? result : result.rows || [];

    return rows.map((row: AIRole) => this.toAIRoleConfig(row));
  }

  /**
   * 查找重复的AI角色
   * 重复判断标准：相同的name或相同的name+source组合
   */
  async findDuplicates(): Promise<{
    duplicates: Array<{
      key: string; // 重复的标识（name或name+source）
      roles: AIRoleConfig[];
      keep: AIRoleConfig; // 保留的角色（保留updated_at最新的）
      remove: AIRoleConfig[]; // 需要删除的角色
    }>;
    totalDuplicates: number;
  }> {
    await this.ensureConnection();

    const allRoles = await this.getAll();
    const duplicateMap = new Map<string, AIRoleConfig[]>();

    // 按name分组
    for (const role of allRoles) {
      const key = `${role.name}|${role.source || 'null'}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key)!.push(role);
    }

    // 找出重复项（同一key有多个角色）
    const duplicates: Array<{
      key: string;
      roles: AIRoleConfig[];
      keep: AIRoleConfig;
      remove: AIRoleConfig[];
    }> = [];

    for (const [key, roles] of duplicateMap.entries()) {
      if (roles.length > 1) {
        // 按updated_at排序，保留最新的
        const sorted = [...roles].sort((a, b) => 
          b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        const keep = sorted[0];
        const remove = sorted.slice(1);

        duplicates.push({
          key,
          roles,
          keep,
          remove,
        });
      }
    }

    return {
      duplicates,
      totalDuplicates: duplicates.reduce((sum, d) => sum + d.remove.length, 0),
    };
  }

  /**
   * 删除多个AI角色
   */
  async deleteMultiple(ids: string[]): Promise<number> {
    await this.ensureConnection();

    if (ids.length === 0) {
      return 0;
    }

    // 使用IN子句删除多个角色
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM ai_roles WHERE id IN (${placeholders})`;
    const result: any = await this.db.query(sql, ids);

    return result.changes || ids.length;
  }
}

