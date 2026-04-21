import { DatabaseManager } from '../config/database';
import { 
  Project, 
  ProjectDetails,
  CreateProjectDTO, 
  UpdateProjectDTO, 
  QueryOptions, 
  PaginatedResult,
  ProjectStatus,
  ProjectType,
  TechPoint,
  KnowledgePoint,
  SourceInformation,
  TechPackagingMaterial,
  TechPromotionStrategy,
  TechPressRelease
} from '../types/database';

export class ProjectModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 初始化项目相关表
   */
  async initializeTable(): Promise<void> {
    // 主项目表
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        icon TEXT,
        type TEXT DEFAULT 'normal' CHECK (type IN ('normal', 'featured')),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_opened_at DATETIME
      )
    `);

    // 项目来源关联表（兼容旧功能）
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS project_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url', 'text', 'tech_point', 'knowledge_point')),
        source_content TEXT NOT NULL,
        source_title TEXT,
        source_description TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    await this.db.query('CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type)');
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)');
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)');
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_projects_last_opened_at ON projects(last_opened_at)');
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_project_sources_project_id ON project_sources(project_id)');
    await this.db.query('CREATE INDEX IF NOT EXISTS idx_project_sources_source_type ON project_sources(source_type)');
  }

  /**
   * 创建项目
   */
  async create(data: CreateProjectDTO): Promise<Project> {
    const sql = `
      INSERT INTO projects (
        name, description, cover_image, icon, type, status, created_by, last_opened_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.name,
      data.description || null,
      data.cover_image || null,
      data.icon || null,
      data.type || ProjectType.NORMAL,
      data.status || ProjectStatus.ACTIVE,
      data.created_by || null,
      data.last_opened_at || null
    ];

    const result = await this.db.query(sql, values);
    const lastId = (result as any).lastID || (result as any).id;
    
    // 获取创建的项目
    return this.findById(lastId) as Promise<Project>;
  }

  /**
   * 根据ID获取项目
   */
  async findById(id: number): Promise<Project | null> {
    try {
      const sql = 'SELECT * FROM projects WHERE id = ?';
      const result = await this.db.query(sql, [id]);
      if (!result || result.length === 0) {
        return null;
      }
      return this.parseRow(result[0]) as Project;
    } catch (error) {
      console.error('findById error:', error);
      throw error;
    }
  }

  /**
   * 获取所有项目
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Project>> {
    let sql = 'SELECT * FROM projects';
    const values: any[] = [];
    const conditions: string[] = [];

    // 添加WHERE条件
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          conditions.push(`${key} IS NULL`);
        } else {
          conditions.push(`${key} = ?`);
          values.push(value);
        }
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
    const data = result.map((row: any) => this.parseRow(row)) as Project[];
    
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
   * 获取精选项目
   */
  async findFeatured(limit: number = 10): Promise<Project[]> {
    const sql = `
      SELECT * FROM projects 
      WHERE type = ? AND status = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const result = await this.db.query(sql, [ProjectType.FEATURED, ProjectStatus.ACTIVE, limit]);
    return result.map((row: any) => this.parseRow(row)) as Project[];
  }

  /**
   * 获取最近打开的项目
   */
  async findRecent(limit: number = 20): Promise<Project[]> {
    const sql = `
      SELECT * FROM projects 
      WHERE status = ? AND last_opened_at IS NOT NULL
      ORDER BY last_opened_at DESC
      LIMIT ?
    `;
    
    const result = await this.db.query(sql, [ProjectStatus.ACTIVE, limit]);
    return result.map((row: any) => this.parseRow(row)) as Project[];
  }

  /**
   * 更新项目
   */
  async update(id: number, data: UpdateProjectDTO): Promise<Project | null> {
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
      UPDATE projects 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.query(sql, values);
    return this.findById(id);
  }

  /**
   * 更新最后打开时间
   */
  async updateLastOpenedAt(id: number): Promise<void> {
    const sql = `
      UPDATE projects 
      SET last_opened_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await this.db.query(sql, [id]);
  }

  /**
   * 删除项目（软删除）
   */
  async delete(id: number): Promise<boolean> {
    const sql = `
      UPDATE projects 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await this.db.query(sql, [ProjectStatus.DELETED, id]);
    return Array.isArray(result) ? result.length > 0 : (result as any).changes > 0;
  }

  /**
   * 获取项目的来源数量
   */
  async getSourceCount(projectId: number): Promise<number> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM project_sources WHERE project_id = ?';
      const result = await this.db.query(sql, [projectId]);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('getSourceCount error:', error);
      // 如果表不存在或其他错误，返回 0
      return 0;
    }
  }

  /**
   * 获取项目的技术点数量
   */
  async getTechPointCount(projectId: number): Promise<number> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM project_tech_points WHERE project_id = ?';
      const result = await this.db.query(sql, [projectId]);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('getTechPointCount error:', error);
      // 如果表不存在或其他错误，返回 0
      return 0;
    }
  }

  /**
   * 获取项目详情（包含所有关联数据）
   */
  async getProjectDetails(projectId: number): Promise<ProjectDetails | null> {
    const project = await this.findById(projectId);
    if (!project) return null;

    // 使用 Promise.all 并行获取所有关联数据，每个查询都有独立的错误处理
    const [techPoints, knowledgePoints, files, sourceInformations, packagingMaterials, promotionStrategies, pressReleases] = await Promise.all([
      this.getTechPoints(projectId).catch(err => {
        console.error('getTechPoints error:', err);
        return [];
      }),
      this.getKnowledgePoints(projectId).catch(err => {
        console.error('getKnowledgePoints error:', err);
        return [];
      }),
      this.getFiles(projectId).catch(err => {
        console.error('getFiles error:', err);
        return [];
      }),
      this.getSourceInformations(projectId).catch(err => {
        console.error('getSourceInformations error:', err);
        return [];
      }),
      this.getPackagingMaterials(projectId).catch(err => {
        console.error('getPackagingMaterials error:', err);
        return [];
      }),
      this.getPromotionStrategies(projectId).catch(err => {
        console.error('getPromotionStrategies error:', err);
        return [];
      }),
      this.getPressReleases(projectId).catch(err => {
        console.error('getPressReleases error:', err);
        return [];
      })
    ]);

    const result = {
      ...project,
      techPoints,
      knowledgePoints,
      files,
      sourceInformations,
      packagingMaterials,
      promotionStrategies,
      pressReleases
    };

    // 序列化日期对象为字符串，确保 JSON 响应正常
    return this.serializeDates(result);
  }

  /**
   * 序列化对象中的日期为字符串
   * 防止循环引用导致的问题
   */
  private serializeDates(obj: any, visited = new WeakSet()): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // 防止循环引用
    if (visited.has(obj)) {
      return null;
    }
    visited.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeDates(item, visited));
    }

    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          serialized[key] = this.serializeDates(obj[key], visited);
        } catch (error) {
          // 如果序列化某个字段失败，跳过该字段
          console.warn(`Failed to serialize field ${key}:`, error);
        }
      }
    }
    return serialized;
  }

  /**
   * 获取项目关联的技术点
   */
  async getTechPoints(projectId: number): Promise<TechPoint[]> {
    const sql = `
      SELECT tp.* FROM tech_points tp
      INNER JOIN project_tech_points ptp ON tp.id = ptp.tech_point_id
      WHERE ptp.project_id = ?
    `;
    const result = await this.db.query(sql, [projectId]);
    return result.map((row: any) => this.parseTechPoint(row));
  }

  /**
   * 添加技术点到项目
   */
  async addTechPoint(projectId: number, techPointId: number, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO project_tech_points (project_id, tech_point_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [projectId, techPointId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 从项目移除技术点
   */
  async removeTechPoint(projectId: number, techPointId: number): Promise<boolean> {
    const sql = 'DELETE FROM project_tech_points WHERE project_id = ? AND tech_point_id = ?';
    const result = await this.db.query(sql, [projectId, techPointId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取项目关联的公开知识点
   */
  async getKnowledgePoints(projectId: number): Promise<KnowledgePoint[]> {
    const sql = `
      SELECT kp.* FROM knowledge_points kp
      INNER JOIN project_knowledge_points pkp ON kp.id = pkp.knowledge_point_id
      WHERE pkp.project_id = ?
    `;
    const result = await this.db.query(sql, [projectId]);
    return result.map((row: any) => this.parseKnowledgePoint(row));
  }

  /**
   * 添加知识点到项目
   */
  async addKnowledgePoint(projectId: number, knowledgePointId: number, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO project_knowledge_points (project_id, knowledge_point_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [projectId, knowledgePointId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 从项目移除知识点
   */
  async removeKnowledgePoint(projectId: number, knowledgePointId: number): Promise<boolean> {
    const sql = 'DELETE FROM project_knowledge_points WHERE project_id = ? AND knowledge_point_id = ?';
    const result = await this.db.query(sql, [projectId, knowledgePointId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取项目关联的文件
   */
  async getFiles(projectId: number): Promise<any[]> {
    const sql = `
      SELECT f.* FROM files f
      INNER JOIN project_files pf ON f.file_id = pf.file_id
      WHERE pf.project_id = ?
    `;
    const result = await this.db.query(sql, [projectId]);
    return result.map((row: any) => this.parseFile(row));
  }

  /**
   * 添加文件到项目
   */
  async addFile(projectId: number, fileId: string, notes?: string): Promise<boolean> {
    const sql = `
      INSERT OR IGNORE INTO project_files (project_id, file_id, notes)
      VALUES (?, ?, ?)
    `;
    const result = await this.db.query(sql, [projectId, fileId, notes || null]);
    return (result as any).changes > 0 || (result as any).lastID !== undefined;
  }

  /**
   * 从项目移除文件
   */
  async removeFile(projectId: number, fileId: string): Promise<boolean> {
    const sql = 'DELETE FROM project_files WHERE project_id = ? AND file_id = ?';
    const result = await this.db.query(sql, [projectId, fileId]);
    return (result as any).changes > 0;
  }

  /**
   * 获取项目关联的来源信息
   * 注意：SourceInformation 功能已移除，此方法返回空数组
   */
  async getSourceInformations(projectId: number): Promise<SourceInformation[]> {
    try {
      // 尝试查询，如果表不存在则返回空数组
      const sql = `
        SELECT si.* FROM source_information si
        INNER JOIN project_source_informations psi ON si.id = psi.source_information_id
        WHERE psi.project_id = ?
      `;
      const result = await this.db.query(sql, [projectId]);
      return result.map((row: any) => this.parseSourceInformation(row));
    } catch (error) {
      // 如果表不存在或查询失败，返回空数组
      console.warn('getSourceInformations: SourceInformation table may not exist, returning empty array', error);
      return [];
    }
  }

  /**
   * 添加来源信息到项目
   * 注意：SourceInformation 功能已移除，此方法返回 false
   */
  async addSourceInformation(projectId: number, sourceInformationId: number, notes?: string): Promise<boolean> {
    try {
      const sql = `
        INSERT OR IGNORE INTO project_source_informations (project_id, source_information_id, notes)
        VALUES (?, ?, ?)
      `;
      const result = await this.db.query(sql, [projectId, sourceInformationId, notes || null]);
      return (result as any).changes > 0 || (result as any).lastID !== undefined;
    } catch (error) {
      // 如果表不存在或操作失败，返回 false
      console.warn('addSourceInformation: SourceInformation table may not exist, returning false', error);
      return false;
    }
  }

  /**
   * 从项目移除来源信息
   * 注意：SourceInformation 功能已移除，此方法返回 false
   */
  async removeSourceInformation(projectId: number, sourceInformationId: number): Promise<boolean> {
    try {
      const sql = 'DELETE FROM project_source_informations WHERE project_id = ? AND source_information_id = ?';
      const result = await this.db.query(sql, [projectId, sourceInformationId]);
      return (result as any).changes > 0;
    } catch (error) {
      // 如果表不存在或操作失败，返回 false
      console.warn('removeSourceInformation: SourceInformation table may not exist, returning false', error);
      return false;
    }
  }

  /**
   * ⚠️ 已废弃: 获取项目关联的技术包装材料
   * 
   * tech_packaging_materials 表已移除，数据存储在 workflow_executions.outputs 中。
   * 请从 workflow_executions 表中查询 outputs 字段获取技术包装材料数据。
   * 
   * @deprecated 此方法已废弃，请使用 workflow_executions 表
   */
  async getPackagingMaterials(projectId: number): Promise<TechPackagingMaterial[]> {
    // 表已移除，返回空数组
    // 如需获取数据，请查询 workflow_executions 表的 outputs 字段
    console.warn('getPackagingMaterials: tech_packaging_materials 表已移除，请使用 workflow_executions.outputs');
    return [];
    // const sql = 'SELECT * FROM tech_packaging_materials WHERE project_id = ?';
    // const result = await this.db.query(sql, [projectId]);
    // return result.map((row: any) => this.parsePackagingMaterial(row));
  }

  /**
   * ⚠️ 已废弃: 获取项目关联的技术推广策略
   * 
   * tech_promotion_strategies 表已移除，数据存储在 workflow_executions.outputs 中。
   * 请从 workflow_executions 表中查询 outputs 字段获取技术推广策略数据。
   * 
   * @deprecated 此方法已废弃，请使用 workflow_executions 表
   */
  async getPromotionStrategies(projectId: number): Promise<TechPromotionStrategy[]> {
    // 表已移除，返回空数组
    // 如需获取数据，请查询 workflow_executions 表的 outputs 字段
    console.warn('getPromotionStrategies: tech_promotion_strategies 表已移除，请使用 workflow_executions.outputs');
    return [];
    // const sql = 'SELECT * FROM tech_promotion_strategies WHERE project_id = ?';
    // const result = await this.db.query(sql, [projectId]);
    // return result.map((row: any) => this.parsePromotionStrategy(row));
  }

  /**
   * ⚠️ 已废弃: 获取项目关联的技术通稿
   * 
   * tech_press_releases 表已移除，数据存储在 workflow_executions.outputs 中。
   * 请从 workflow_executions 表中查询 outputs 字段获取技术通稿数据。
   * 
   * @deprecated 此方法已废弃，请使用 workflow_executions 表
   */
  async getPressReleases(projectId: number): Promise<TechPressRelease[]> {
    // 表已移除，返回空数组
    // 如需获取数据，请查询 workflow_executions 表的 outputs 字段
    console.warn('getPressReleases: tech_press_releases 表已移除，请使用 workflow_executions.outputs');
    return [];
    // const sql = 'SELECT * FROM tech_press_releases WHERE project_id = ?';
    // const result = await this.db.query(sql, [projectId]);
    // return result.map((row: any) => this.parsePressRelease(row));
  }

  /**
   * 解析技术点
   */
  private parseTechPoint(row: any): TechPoint {
    const parsed = { ...row };
    if (parsed.tags && typeof parsed.tags === 'string') {
      try {
        parsed.tags = JSON.parse(parsed.tags);
      } catch {
        parsed.tags = [];
      }
    }
    if (parsed.technical_details && typeof parsed.technical_details === 'string') {
      try {
        parsed.technical_details = JSON.parse(parsed.technical_details);
      } catch {
        parsed.technical_details = {};
      }
    }
    if (parsed.benefits && typeof parsed.benefits === 'string') {
      try {
        parsed.benefits = JSON.parse(parsed.benefits);
      } catch {
        parsed.benefits = [];
      }
    }
    if (parsed.applications && typeof parsed.applications === 'string') {
      try {
        parsed.applications = JSON.parse(parsed.applications);
      } catch {
        parsed.applications = [];
      }
    }
    if (parsed.keywords && typeof parsed.keywords === 'string') {
      try {
        parsed.keywords = JSON.parse(parsed.keywords);
      } catch {
        parsed.keywords = [];
      }
    }
    return this.parseRow(parsed) as TechPoint;
  }

  /**
   * 解析知识点
   */
  private parseKnowledgePoint(row: any): KnowledgePoint {
    const parsed = { ...row };
    if (parsed.metadata && typeof parsed.metadata === 'string') {
      try {
        parsed.metadata = JSON.parse(parsed.metadata);
      } catch {
        parsed.metadata = {};
      }
    }
    if (parsed.tags && typeof parsed.tags === 'string') {
      try {
        parsed.tags = JSON.parse(parsed.tags);
      } catch {
        parsed.tags = [];
      }
    }
    return this.parseRow(parsed) as KnowledgePoint;
  }

  /**
   * 解析文件
   */
  private parseFile(row: any): any {
    const parsed = { ...row };
    if (parsed.tags && typeof parsed.tags === 'string') {
      try {
        parsed.tags = JSON.parse(parsed.tags);
      } catch {
        parsed.tags = [];
      }
    }
    if (parsed.metadata && typeof parsed.metadata === 'string') {
      try {
        parsed.metadata = JSON.parse(parsed.metadata);
      } catch {
        parsed.metadata = {};
      }
    }
    return this.parseRow(parsed);
  }

  /**
   * 解析来源信息
   */
  private parseSourceInformation(row: any): SourceInformation {
    const parsed = { ...row };
    if (parsed.metadata && typeof parsed.metadata === 'string') {
      try {
        parsed.metadata = JSON.parse(parsed.metadata);
      } catch {
        parsed.metadata = {};
      }
    }
    return this.parseRow(parsed) as SourceInformation;
  }

  /**
   * 解析包装材料
   */
  private parsePackagingMaterial(row: any): TechPackagingMaterial {
    const parsed = { ...row };
    if (parsed.generation_params && typeof parsed.generation_params === 'string') {
      try {
        parsed.generation_params = JSON.parse(parsed.generation_params);
      } catch {
        parsed.generation_params = {};
      }
    }
    return this.parseRow(parsed) as TechPackagingMaterial;
  }

  /**
   * 解析推广策略
   */
  private parsePromotionStrategy(row: any): TechPromotionStrategy {
    const parsed = { ...row };
    if (parsed.timeline && typeof parsed.timeline === 'string') {
      try {
        parsed.timeline = JSON.parse(parsed.timeline);
      } catch {
        parsed.timeline = {};
      }
    }
    if (parsed.kpi_metrics && typeof parsed.kpi_metrics === 'string') {
      try {
        parsed.kpi_metrics = JSON.parse(parsed.kpi_metrics);
      } catch {
        parsed.kpi_metrics = {};
      }
    }
    if (parsed.generation_params && typeof parsed.generation_params === 'string') {
      try {
        parsed.generation_params = JSON.parse(parsed.generation_params);
      } catch {
        parsed.generation_params = {};
      }
    }
    return this.parseRow(parsed) as TechPromotionStrategy;
  }

  /**
   * 解析通稿
   */
  private parsePressRelease(row: any): TechPressRelease {
    const parsed = { ...row };
    if (parsed.target_media && typeof parsed.target_media === 'string') {
      try {
        parsed.target_media = JSON.parse(parsed.target_media);
      } catch {
        parsed.target_media = [];
      }
    }
    if (parsed.seo_keywords && typeof parsed.seo_keywords === 'string') {
      try {
        parsed.seo_keywords = JSON.parse(parsed.seo_keywords);
      } catch {
        parsed.seo_keywords = [];
      }
    }
    if (parsed.generation_params && typeof parsed.generation_params === 'string') {
      try {
        parsed.generation_params = JSON.parse(parsed.generation_params);
      } catch {
        parsed.generation_params = {};
      }
    }
    return this.parseRow(parsed) as TechPressRelease;
  }

  /**
   * 解析数据库行
   */
  private parseRow(row: any): any {
    if (!row) return row;
    
    const parsed = { ...row };
    
    // 转换日期字段为 ISO 字符串格式（确保 JSON 序列化正常）
    if (parsed.created_at) {
      if (typeof parsed.created_at === 'string') {
        // 如果已经是字符串，保持原样（SQLite 返回的可能是字符串）
        parsed.created_at = parsed.created_at;
      } else if (parsed.created_at instanceof Date) {
        parsed.created_at = parsed.created_at.toISOString();
      }
    }
    if (parsed.updated_at) {
      if (typeof parsed.updated_at === 'string') {
        parsed.updated_at = parsed.updated_at;
      } else if (parsed.updated_at instanceof Date) {
        parsed.updated_at = parsed.updated_at.toISOString();
      }
    }
    if (parsed.last_opened_at) {
      if (typeof parsed.last_opened_at === 'string') {
        parsed.last_opened_at = parsed.last_opened_at;
      } else if (parsed.last_opened_at instanceof Date) {
        parsed.last_opened_at = parsed.last_opened_at.toISOString();
      }
    }
    
    return parsed;
  }
}
