import { DatabaseManager } from '../config/database';
import crypto from 'crypto';

// ==================== 类型定义 ====================

/**
 * 页面工具配置数据库记录
 */
export interface PageToolConfig {
  id: string;
  page_type: string;
  page_title: string;
  dialogue_title: string;
  studio_title: string;
  workflow_selection_key: string;
  enabled_tool_ids?: string; // JSON字符串
  feature_label_map?: string; // JSON字符串
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 页面工具配置（前端格式）
 */
export interface PageToolConfigDTO {
  id: string;
  pageType: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article';
  pageTitle: string;
  dialogueTitle: string;
  studioTitle: string;
  workflowSelectionKey: string;
  enabledToolIds?: string[];
  featureLabelMap?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建页面工具配置DTO
 */
export interface CreatePageToolConfigDTO {
  id?: string;
  pageType: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article';
  pageTitle: string;
  dialogueTitle: string;
  studioTitle: string;
  workflowSelectionKey: string;
  enabledToolIds?: string[];
  featureLabelMap?: Record<string, string>;
}

/**
 * 更新页面工具配置DTO
 */
export interface UpdatePageToolConfigDTO {
  pageTitle?: string;
  dialogueTitle?: string;
  studioTitle?: string;
  workflowSelectionKey?: string;
  enabledToolIds?: string[];
  featureLabelMap?: Record<string, string>;
  isActive?: boolean;
}

// ==================== 模型类 ====================

/**
 * 页面工具配置模型
 */
export class PageToolConfigModel {
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
  private toPageToolConfigDTO(row: PageToolConfig): PageToolConfigDTO {
    let enabledToolIds: string[] | undefined;
    let featureLabelMap: Record<string, string> | undefined;

    try {
      if (row.enabled_tool_ids) {
        enabledToolIds = JSON.parse(row.enabled_tool_ids);
      }
    } catch (error) {
      console.error('解析enabled_tool_ids失败:', error);
    }

    try {
      if (row.feature_label_map) {
        featureLabelMap = JSON.parse(row.feature_label_map);
      }
    } catch (error) {
      console.error('解析feature_label_map失败:', error);
    }

    return {
      id: row.id,
      pageType: row.page_type as 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article',
      pageTitle: row.page_title,
      dialogueTitle: row.dialogue_title,
      studioTitle: row.studio_title,
      workflowSelectionKey: row.workflow_selection_key,
      enabledToolIds,
      featureLabelMap,
      isActive: row.is_active === 1,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  /**
   * 根据页面类型获取配置
   */
  async getByPageType(pageType: string): Promise<PageToolConfigDTO | null> {
    await this.ensureConnection();

    const dbType = this.db.getType();
    let sql: string;

    if (dbType === 'sqlite') {
      sql = `
        SELECT * FROM page_tool_configs
        WHERE page_type = ? AND is_active = 1
        LIMIT 1
      `;
    } else {
      sql = `
        SELECT * FROM page_tool_configs
        WHERE page_type = $1 AND is_active = 1
        LIMIT 1
      `;
    }

    const params = dbType === 'sqlite' ? [pageType] : [pageType];
    const rows = await this.db.query(sql, params);

    if (rows.length === 0) {
      return null;
    }

    return this.toPageToolConfigDTO(rows[0] as PageToolConfig);
  }

  /**
   * 获取所有配置
   */
  async getAll(): Promise<PageToolConfigDTO[]> {
    await this.ensureConnection();

    const sql = `
      SELECT * FROM page_tool_configs
      WHERE is_active = 1
      ORDER BY created_at DESC
    `;

    const rows = await this.db.query(sql);
    return rows.map((row: PageToolConfig) => this.toPageToolConfigDTO(row));
  }

  /**
   * 创建配置
   */
  async create(dto: CreatePageToolConfigDTO): Promise<PageToolConfigDTO> {
    await this.ensureConnection();

    const id = dto.id || crypto.randomUUID();
    const enabledToolIdsJson = dto.enabledToolIds ? JSON.stringify(dto.enabledToolIds) : null;
    const featureLabelMapJson = dto.featureLabelMap ? JSON.stringify(dto.featureLabelMap) : null;

    const dbType = this.db.getType();
    let sql: string;
    let params: any[];

    if (dbType === 'sqlite') {
      sql = `
        INSERT INTO page_tool_configs (
          id, page_type, page_title, dialogue_title, studio_title,
          workflow_selection_key, enabled_tool_ids, feature_label_map, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;
      params = [
        id,
        dto.pageType,
        dto.pageTitle,
        dto.dialogueTitle,
        dto.studioTitle,
        dto.workflowSelectionKey,
        enabledToolIdsJson,
        featureLabelMapJson,
      ];
    } else {
      sql = `
        INSERT INTO page_tool_configs (
          id, page_type, page_title, dialogue_title, studio_title,
          workflow_selection_key, enabled_tool_ids, feature_label_map, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
      `;
      params = [
        id,
        dto.pageType,
        dto.pageTitle,
        dto.dialogueTitle,
        dto.studioTitle,
        dto.workflowSelectionKey,
        enabledToolIdsJson,
        featureLabelMapJson,
      ];
    }

    await this.db.query(sql, params);
    return this.getByPageType(dto.pageType) as Promise<PageToolConfigDTO>;
  }

  /**
   * 更新配置
   */
  async update(pageType: string, dto: UpdatePageToolConfigDTO): Promise<PageToolConfigDTO | null> {
    await this.ensureConnection();

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const dbType = this.db.getType();
    const paramPlaceholder = dbType === 'sqlite' ? '?' : `$${paramIndex}`;

    if (dto.pageTitle !== undefined) {
      updates.push(`page_title = ${paramPlaceholder}`);
      params.push(dto.pageTitle);
      paramIndex++;
    }
    if (dto.dialogueTitle !== undefined) {
      updates.push(`dialogue_title = ${paramPlaceholder}`);
      params.push(dto.dialogueTitle);
      paramIndex++;
    }
    if (dto.studioTitle !== undefined) {
      updates.push(`studio_title = ${paramPlaceholder}`);
      params.push(dto.studioTitle);
      paramIndex++;
    }
    if (dto.workflowSelectionKey !== undefined) {
      updates.push(`workflow_selection_key = ${paramPlaceholder}`);
      params.push(dto.workflowSelectionKey);
      paramIndex++;
    }
    if (dto.enabledToolIds !== undefined) {
      updates.push(`enabled_tool_ids = ${paramPlaceholder}`);
      params.push(JSON.stringify(dto.enabledToolIds));
      paramIndex++;
    }
    if (dto.featureLabelMap !== undefined) {
      updates.push(`feature_label_map = ${paramPlaceholder}`);
      params.push(JSON.stringify(dto.featureLabelMap));
      paramIndex++;
    }
    if (dto.isActive !== undefined) {
      updates.push(`is_active = ${paramPlaceholder}`);
      params.push(dto.isActive ? 1 : 0);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getByPageType(pageType);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE page_tool_configs
      SET ${updates.join(', ')}
      WHERE page_type = ${paramPlaceholder}
    `;
    params.push(pageType);

    await this.db.query(sql, params);
    return this.getByPageType(pageType);
  }

  /**
   * 删除配置（软删除）
   */
  async delete(pageType: string): Promise<boolean> {
    await this.ensureConnection();

    const dbType = this.db.getType();
    const sql = dbType === 'sqlite'
      ? `UPDATE page_tool_configs SET is_active = 0 WHERE page_type = ?`
      : `UPDATE page_tool_configs SET is_active = 0 WHERE page_type = $1`;
    const params = dbType === 'sqlite' ? [pageType] : [pageType];

    const result = await this.db.query(sql, params);
    return true;
  }

  /**
   * 初始化数据库表
   */
  async initializeTable(): Promise<void> {
    await this.ensureConnection();
    
    const dbType = this.db.getType();
    
    // 创建表
    const createTableSQL = dbType === 'sqlite' ? `
      CREATE TABLE IF NOT EXISTS page_tool_configs (
        id TEXT PRIMARY KEY,
        page_type TEXT NOT NULL UNIQUE,
        page_title TEXT NOT NULL,
        dialogue_title TEXT NOT NULL,
        studio_title TEXT NOT NULL,
        workflow_selection_key TEXT NOT NULL,
        enabled_tool_ids TEXT,
        feature_label_map TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    ` : `
      CREATE TABLE IF NOT EXISTS page_tool_configs (
        id TEXT PRIMARY KEY,
        page_type TEXT NOT NULL UNIQUE,
        page_title TEXT NOT NULL,
        dialogue_title TEXT NOT NULL,
        studio_title TEXT NOT NULL,
        workflow_selection_key TEXT NOT NULL,
        enabled_tool_ids TEXT,
        feature_label_map TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.db.query(createTableSQL);
    } catch (error: any) {
      // 忽略"表已存在"等错误
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建page_tool_configs表时出现警告:', error.message);
      }
    }
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_page_tool_configs_page_type ON page_tool_configs(page_type);',
      'CREATE INDEX IF NOT EXISTS idx_page_tool_configs_active ON page_tool_configs(is_active);',
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

    // 插入默认配置数据（如果不存在）
    const defaultConfigs = [
      {
        id: 'tech-package-default',
        pageType: 'tech-package',
        pageTitle: '技术包装',
        dialogueTitle: 'AI内容助手',
        studioTitle: '更多工具箱',
        workflowSelectionKey: 'ai-search.workflows.selection.tech-package',
        enabledToolIds: ['five-view-analysis', 'three-fix-analysis', 'tech-matrix', 'propagation-strategy', 'exhibition-video', 'translation', 'ppt-outline', 'script'],
        featureLabelMap: {
          'five-view-analysis': '五看',
          'three-fix-analysis': '三定',
          'tech-matrix': '技术矩阵',
          'propagation-strategy': '传播',
          'exhibition-video': '展具与视频',
          'translation': '翻译',
          'ppt-outline': '技术讲稿',
          'script': '脚本',
        },
      },
      {
        id: 'press-release-default',
        pageType: 'press-release',
        pageTitle: '发布会稿',
        dialogueTitle: 'AI内容助手',
        studioTitle: '更多工具箱',
        workflowSelectionKey: 'ai-search.workflows.selection.press-release',
        enabledToolIds: ['five-view-analysis', 'three-fix-analysis', 'tech-matrix', 'propagation-strategy', 'translation', 'ppt-outline'],
        featureLabelMap: {
          'five-view-analysis': '技术转译',
          'three-fix-analysis': '用户场景挖掘',
          'tech-matrix': '发布会场景化',
          'propagation-strategy': '领导人口语化',
          'exhibition-video': '展具与视频',
          'translation': '翻译',
          'ppt-outline': '技术讲稿',
          'script': '脚本',
        },
      },
      {
        id: 'tech-strategy-default',
        pageType: 'tech-strategy',
        pageTitle: '技术策略',
        dialogueTitle: 'AI内容助手',
        studioTitle: '更多工具箱',
        workflowSelectionKey: 'ai-search.workflows.selection.tech-strategy',
        enabledToolIds: ['propagation-strategy', 'five-view-analysis', 'three-fix-analysis', 'translation'],
        featureLabelMap: {
          'five-view-analysis': '技术转译',
          'three-fix-analysis': '用户场景挖掘',
          'tech-matrix': '技术矩阵',
          'propagation-strategy': '传播策略',
          'exhibition-video': '展具与视频',
          'translation': '翻译',
          'ppt-outline': '技术讲稿',
          'script': '脚本',
        },
      },
      {
        id: 'tech-article-default',
        pageType: 'tech-article',
        pageTitle: '技术通稿',
        dialogueTitle: 'AI内容助手',
        studioTitle: '更多工具箱',
        workflowSelectionKey: 'ai-search.workflows.selection.tech-article',
        enabledToolIds: ['ppt-outline', 'translation'],
        featureLabelMap: {
          'five-view-analysis': '技术转译',
          'three-fix-analysis': '用户场景挖掘',
          'tech-matrix': '技术矩阵',
          'propagation-strategy': '传播策略',
          'exhibition-video': '展具与视频',
          'translation': '翻译',
          'ppt-outline': '技术讲稿',
          'script': '脚本',
        },
      },
    ];

    for (const config of defaultConfigs) {
      try {
        // 检查配置是否已存在
        const existing = await this.getByPageType(config.pageType);
        if (!existing) {
          // 如果不存在，创建默认配置
          await this.create(config);
        }
      } catch (error: any) {
        // 忽略错误，继续处理下一个配置
        console.warn(`初始化默认配置 ${config.pageType} 时出现警告:`, error.message);
      }
    }
  }
}

