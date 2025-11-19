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
}

