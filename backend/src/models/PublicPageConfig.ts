import { DatabaseManager } from '../config/database';
import crypto from 'crypto';

// ==================== 类型定义 ====================

/**
 * 公开页面配置数据库记录
 */
export interface PublicPageConfig {
  id: string;
  name: string;
  description?: string;
  address?: string; // 地址配置
  display_mode: string;
  workflow_id?: string;
  role_ids: string;
  access_token: string;
  is_active: number;
  template_type?: string; // 模板类型: 'speech', 'ai-chat', 'custom'
  custom_html?: string; // 自定义HTML内容
  created_at?: string;
  updated_at?: string;
}

/**
 * 公开页面配置（前端格式）
 */
export interface PublicPageConfigDTO {
  id: string;
  name: string;
  description?: string;
  address?: string; // 地址配置
  displayMode: 'all' | 'workflow' | 'custom' | 'role';
  workflowId?: string;
  roleIds?: string[];
  accessToken: string;
  isActive: boolean;
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom' | null;
  customHtml?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建公开页面配置DTO
 */
export interface CreatePublicPageConfigDTO {
  id?: string;
  name: string;
  description?: string;
  address?: string; // 地址配置
  displayMode?: 'all' | 'workflow' | 'custom' | 'role'; // 可选，默认为'role'
  workflowId?: string;
  roleIds?: string[];
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom' | null;
  customHtml?: string;
  isActive?: boolean; // 可选，用于创建时直接设置状态
}

/**
 * 更新公开页面配置DTO
 */
export interface UpdatePublicPageConfigDTO {
  name?: string;
  description?: string;
  address?: string; // 地址配置
  displayMode?: 'all' | 'workflow' | 'custom' | 'role';
  workflowId?: string;
  roleIds?: string[];
  isActive?: boolean;
  templateType?: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom' | null;
  customHtml?: string;
}

// ==================== 模型类 ====================

/**
 * 公开页面配置模型
 */
export class PublicPageConfigModel {
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
  private toPublicPageConfigDTO(row: PublicPageConfig): PublicPageConfigDTO {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      address: row.address || undefined,
      displayMode: row.display_mode as 'all' | 'workflow' | 'custom' | 'role',
      workflowId: row.workflow_id || undefined,
      roleIds: row.role_ids ? JSON.parse(row.role_ids) : undefined,
      accessToken: row.access_token,
      isActive: row.is_active === 1,
      templateType: row.template_type as 'speech' | 'ai-chat' | 'custom' | null || undefined,
      customHtml: row.custom_html || undefined,
      createdAt: new Date(row.created_at || Date.now()),
      updatedAt: new Date(row.updated_at || Date.now()),
    };
  }

  /**
   * 生成访问令牌
   */
  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 初始化数据库表
   */
  async initializeTable(): Promise<void> {
    await this.ensureConnection();
    
    // 直接执行CREATE TABLE语句（避免文件系统依赖）
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public_page_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        display_mode TEXT NOT NULL DEFAULT 'all',
        workflow_id TEXT,
        role_ids TEXT,
        access_token TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        template_type TEXT,
        custom_html TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.db.query(createTableSQL);
    } catch (error: any) {
      // 忽略"表已存在"等错误
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建public_page_configs表时出现警告:', error.message);
      }
    }
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_public_page_configs_token ON public_page_configs(access_token);',
      'CREATE INDEX IF NOT EXISTS idx_public_page_configs_active ON public_page_configs(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_public_page_configs_created ON public_page_configs(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_public_page_configs_workflow ON public_page_configs(workflow_id) WHERE workflow_id IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_public_page_configs_address ON public_page_configs(address) WHERE address IS NOT NULL;',
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
    
    // 创建触发器
    const triggerSQL = `
      CREATE TRIGGER IF NOT EXISTS update_public_page_configs_updated_at
      AFTER UPDATE ON public_page_configs
      BEGIN
        UPDATE public_page_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `;
    
    try {
      await this.db.query(triggerSQL);
    } catch (error: any) {
      // 忽略触发器已存在的错误
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建触发器时出现警告:', error.message);
      }
    }

    // 迁移：添加模板相关字段（如果不存在）
    try {
      // 检查字段是否存在
      const tableInfo = await this.db.query('PRAGMA table_info(public_page_configs)');
      const columns = Array.isArray(tableInfo) ? tableInfo : tableInfo.rows || [tableInfo];
      const columnNames = columns.map((col: any) => col.name);
      
      if (!columnNames.includes('template_type')) {
        await this.db.query('ALTER TABLE public_page_configs ADD COLUMN template_type TEXT');
      }
      if (!columnNames.includes('custom_html')) {
        await this.db.query('ALTER TABLE public_page_configs ADD COLUMN custom_html TEXT');
      }
      if (!columnNames.includes('address')) {
        await this.db.query('ALTER TABLE public_page_configs ADD COLUMN address TEXT');
      }
    } catch (error: any) {
      // 忽略列已存在的错误
      if (!error.message?.includes('duplicate column')) {
        console.warn('添加字段时出现警告:', error.message);
      }
    }
  }

  /**
   * 创建公开页面配置
   */
  async create(data: CreatePublicPageConfigDTO): Promise<PublicPageConfigDTO> {
    await this.ensureConnection();
    await this.initializeTable();

    const id = data.id || `public-config-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const accessToken = this.generateAccessToken();
    // 如果没有提供displayMode，使用默认值'role'
    const displayMode = data.displayMode || 'role';
    // 如果没有提供isActive，默认为1（启用）
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;

    const sql = `
      INSERT INTO public_page_configs (
        id, name, description, address, display_mode, workflow_id, role_ids, access_token, is_active,
        template_type, custom_html, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const params = [
      id,
      data.name,
      data.description || null,
      data.address || null,
      displayMode,
      data.workflowId || null,
      data.roleIds ? JSON.stringify(data.roleIds) : null,
      accessToken,
      isActive,
      data.templateType || null,
      data.customHtml || null,
    ];

    await this.db.query(sql, params);

    return await this.getById(id) as PublicPageConfigDTO;
  }

  /**
   * 根据ID获取配置
   */
  async getById(id: string): Promise<PublicPageConfigDTO | null> {
    await this.ensureConnection();
    await this.initializeTable();

    const sql = 'SELECT * FROM public_page_configs WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    return this.toPublicPageConfigDTO(rows[0] as PublicPageConfig);
  }

  /**
   * 根据访问令牌获取配置
   */
  async getByAccessToken(token: string): Promise<PublicPageConfigDTO | null> {
    await this.ensureConnection();
    await this.initializeTable();

    const sql = 'SELECT * FROM public_page_configs WHERE access_token = ? AND is_active = 1';
    const result = await this.db.query(sql, [token]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    return this.toPublicPageConfigDTO(rows[0] as PublicPageConfig);
  }

  /**
   * 根据地址获取配置
   */
  async getByAddress(address: string): Promise<PublicPageConfigDTO | null> {
    await this.ensureConnection();
    await this.initializeTable();

    const sql = 'SELECT * FROM public_page_configs WHERE address = ? AND is_active = 1';
    const result = await this.db.query(sql, [address]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    return this.toPublicPageConfigDTO(rows[0] as PublicPageConfig);
  }

  /**
   * 获取所有配置
   */
  async getAll(): Promise<PublicPageConfigDTO[]> {
    await this.ensureConnection();
    await this.initializeTable();

    const sql = 'SELECT * FROM public_page_configs ORDER BY updated_at DESC';
    const result = await this.db.query(sql);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.map((row: PublicPageConfig) => this.toPublicPageConfigDTO(row));
  }

  /**
   * 更新配置
   */
  async update(id: string, data: UpdatePublicPageConfigDTO): Promise<PublicPageConfigDTO> {
    await this.ensureConnection();
    await this.initializeTable();

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      params.push(data.address || null);
    }
    if (data.displayMode !== undefined) {
      updates.push('display_mode = ?');
      params.push(data.displayMode);
    }
    if (data.workflowId !== undefined) {
      updates.push('workflow_id = ?');
      params.push(data.workflowId);
    }
    if (data.roleIds !== undefined) {
      updates.push('role_ids = ?');
      params.push(data.roleIds ? JSON.stringify(data.roleIds) : null);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }
    if (data.templateType !== undefined) {
      updates.push('template_type = ?');
      params.push(data.templateType || null);
    }
    if (data.customHtml !== undefined) {
      updates.push('custom_html = ?');
      params.push(data.customHtml || null);
    }

    if (updates.length === 0) {
      return await this.getById(id) as PublicPageConfigDTO;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE public_page_configs SET ${updates.join(', ')} WHERE id = ?`;
    await this.db.query(sql, params);

    return await this.getById(id) as PublicPageConfigDTO;
  }

  /**
   * 删除配置
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();
    await this.initializeTable();

    const sql = 'DELETE FROM public_page_configs WHERE id = ?';
    await this.db.query(sql, [id]);

    return true;
  }
}
