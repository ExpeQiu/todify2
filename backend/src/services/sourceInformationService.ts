import { db } from '../config/database';
import { SourceInformationModel } from '../models/SourceInformation';
import { 
  SourceInformation, 
  CreateSourceInformationDTO, 
  UpdateSourceInformationDTO,
  PaginatedResult,
  QueryOptions 
} from '../types/database';

export class SourceInformationService {
  private model: SourceInformationModel;

  constructor() {
    // 使用全局的 db 实例（已在应用启动时连接）
    this.model = new SourceInformationModel(db);
  }

  /**
   * 初始化数据库表
   */
  async initializeTable(): Promise<void> {
    try {
      // SQLite 需要逐个执行语句
      const statements = [
        `CREATE TABLE IF NOT EXISTS source_information (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_id TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('knowledge_base', 'external')),
          url TEXT,
          description TEXT,
          page_type TEXT,
          conversation_id TEXT,
          metadata TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_source_information_source_id ON source_information(source_id)`,
        `CREATE INDEX IF NOT EXISTS idx_source_information_type ON source_information(type)`,
        `CREATE INDEX IF NOT EXISTS idx_source_information_page_type ON source_information(page_type)`,
        `CREATE INDEX IF NOT EXISTS idx_source_information_conversation_id ON source_information(conversation_id)`,
        `CREATE INDEX IF NOT EXISTS idx_source_information_status ON source_information(status)`,
        `CREATE INDEX IF NOT EXISTS idx_source_information_created_at ON source_information(created_at)`,
        // 创建项目与来源信息关联表
        `CREATE TABLE IF NOT EXISTS project_source_informations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          source_information_id INTEGER NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(project_id, source_information_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_project_source_informations_project_id ON project_source_informations(project_id)`,
        `CREATE INDEX IF NOT EXISTS idx_project_source_informations_source_information_id ON project_source_informations(source_information_id)`
      ];
      
      for (const sql of statements) {
        try {
          await db.query(sql);
        } catch (error: any) {
          // 忽略表或索引已存在的错误
          if (error?.message?.includes('already exists') || 
              error?.message?.includes('duplicate') ||
              error?.code === 'SQLITE_CONSTRAINT') {
            console.warn('表或索引可能已存在，继续执行:', error.message);
            continue;
          }
          throw error;
        }
      }
      
      console.log('来源信息表初始化成功');
    } catch (error) {
      console.error('初始化来源信息表失败:', error);
      throw error;
    }
  }

  /**
   * 创建来源信息
   */
  async createSourceInformation(data: CreateSourceInformationDTO): Promise<SourceInformation> {
    // 检查source_id是否已存在（只检查活跃状态的记录）
    const existing = await this.model.findBySourceId(data.source_id);
    if (existing && existing.status === 'active') {
      // 如果已存在且是活跃状态，更新而不是创建
      const updated = await this.model.updateBySourceId(data.source_id, data);
      if (!updated) {
        throw new Error('更新来源信息失败');
      }
      
      // 如果提供了 project_id，确保关联存在
      if (data.project_id && updated.id) {
        await this.model.createProjectAssociation(data.project_id, updated.id);
      }
      
      return updated;
    }
    
    // 如果记录不存在或者是已删除状态，创建新记录
    // 如果已删除的记录存在，先物理删除它，然后创建新记录
    if (existing && existing.status === 'deleted') {
      // 物理删除已删除的记录，避免重复
      await this.model.hardDelete(existing.id);
    }
    
    const created = await this.model.create(data);
    
    // 如果提供了 project_id，创建项目关联
    if (data.project_id && created.id) {
      await this.model.createProjectAssociation(data.project_id, created.id);
    }
    
    return created;
  }

  /**
   * 根据ID获取来源信息
   */
  async getSourceInformationById(id: number): Promise<SourceInformation | null> {
    return await this.model.findById(id);
  }

  /**
   * 根据source_id获取来源信息
   */
  async getSourceInformationBySourceId(sourceId: string): Promise<SourceInformation | null> {
    return await this.model.findBySourceId(sourceId);
  }

  /**
   * 获取来源信息列表
   */
  async getSourceInformationList(options: QueryOptions = {}): Promise<PaginatedResult<SourceInformation>> {
    return await this.model.findAll(options);
  }

  /**
   * 根据对话ID获取来源信息列表
   */
  async getSourceInformationByConversationId(conversationId: string): Promise<SourceInformation[]> {
    return await this.model.findByConversationId(conversationId);
  }

  /**
   * 根据页面类型获取来源信息列表
   */
  async getSourceInformationByPageType(pageType: string): Promise<SourceInformation[]> {
    return await this.model.findByPageType(pageType);
  }

  /**
   * 根据项目ID获取来源信息列表
   */
  async getSourceInformationByProjectId(projectId: number): Promise<SourceInformation[]> {
    return await this.model.findByProjectId(projectId);
  }

  /**
   * 根据项目ID和分类获取来源信息列表
   */
  async getSourceInformationByProjectIdAndCategory(projectId: number, category: string): Promise<SourceInformation[]> {
    return await this.model.findByProjectIdAndCategory(projectId, category);
  }

  /**
   * 更新来源信息
   */
  async updateSourceInformation(id: number, data: UpdateSourceInformationDTO): Promise<SourceInformation | null> {
    return await this.model.update(id, data);
  }

  /**
   * 根据source_id更新来源信息
   */
  async updateSourceInformationBySourceId(sourceId: string, data: UpdateSourceInformationDTO): Promise<SourceInformation | null> {
    return await this.model.updateBySourceId(sourceId, data);
  }

  /**
   * 删除来源信息
   */
  async deleteSourceInformation(id: number): Promise<boolean> {
    return await this.model.delete(id);
  }

  /**
   * 根据source_id删除来源信息
   */
  async deleteSourceInformationBySourceId(sourceId: string): Promise<boolean> {
    return await this.model.deleteBySourceId(sourceId);
  }

  /**
   * 批量创建来源信息
   */
  async createSourceInformationBatch(dataList: CreateSourceInformationDTO[]): Promise<SourceInformation[]> {
    return await this.model.createBatch(dataList);
  }
}

