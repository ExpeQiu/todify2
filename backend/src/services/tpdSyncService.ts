import axios from 'axios';
import { techPointModel, techCategoryModel } from '../models';
import { 
  CreateTechPointDTO, 
  UpdateTechPointDTO, 
  Status, 
  TechType, 
  Priority,
  CarModelInfo,
  ResourceInfo,
  KnowledgeInfo
} from '../types/database';
import { logger } from '../shared/lib/logger';

/**
 * TPD2 同步服务
 * 从 TPD2 项目同步技术点数据到 todify3 数据库
 */
export class TPDSyncService {
  private tpdApiBaseUrl: string;

  constructor() {
    // 从环境变量或配置获取 TPD2 API 地址
    this.tpdApiBaseUrl = process.env.TPD_API_BASE_URL || 'http://localhost:3004/api/external/v1';
  }

  /**
   * 同步技术点数据
   * 从 TPD2 获取所有技术点，并存储到 todify3 数据库（覆盖更新）
   * @param options 同步选项，包括自定义 API URL 和 API Key
   */
  async syncTechPoints(options?: {
    apiBaseUrl?: string;
    apiKey?: string;
  }): Promise<{
    success: boolean;
    message: string;
    stats: {
      total: number;
      created: number;
      updated: number;
      errors: number;
    };
  }> {
    const stats = {
      total: 0,
      created: 0,
      updated: 0,
      errors: 0,
    };

    // 使用传入的 API URL 或默认值
    const apiBaseUrl = options?.apiBaseUrl || this.tpdApiBaseUrl;
    const apiKey = options?.apiKey;

    try {
      logger.info(`开始同步 TPD2 技术点数据... (API: ${apiBaseUrl})`);

      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // 分页获取所有技术点
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        try {
          // 从 TPD2 获取技术点列表
          const response = await axios.get(`${apiBaseUrl}/tech-points`, {
            headers,
            params: {
              page,
              pageSize,
              orderBy: 'created_at',
              orderDirection: 'ASC',
            },
            timeout: 30000,
          });

          if (response.data.code !== 200 || !response.data.data) {
            logger.error('TPD2 API 返回错误:', response.data);
            break;
          }

          const paginatedData = response.data.data;
          const techPoints = paginatedData.data || [];

          if (techPoints.length === 0) {
            hasMore = false;
            break;
          }

          stats.total += techPoints.length;

          // 处理每个技术点
          for (const tpdTechPoint of techPoints) {
            try {
              const result = await this.syncSingleTechPoint(tpdTechPoint, apiBaseUrl, apiKey);
              if (result.created) {
                stats.created++;
              } else {
                stats.updated++;
              }
            } catch (error) {
              logger.error(`同步技术点失败 (ID: ${tpdTechPoint.id}):`, error);
              stats.errors++;
            }
          }

          // 检查是否还有更多数据
          if (techPoints.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } catch (error) {
          logger.error(`获取第 ${page} 页数据失败:`, error);
          stats.errors++;
          hasMore = false;
        }
      }

      logger.info('TPD2 技术点数据同步完成', stats);

      return {
        success: true,
        message: `同步完成：总计 ${stats.total} 条，新增 ${stats.created} 条，更新 ${stats.updated} 条，错误 ${stats.errors} 条`,
        stats,
      };
    } catch (error) {
      logger.error('同步技术点数据失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '同步失败',
        stats,
      };
    }
  }

  /**
   * 同步单个技术点
   * @param tpdTechPoint 技术点数据
   * @param apiBaseUrl API 基础 URL
   * @param apiKey API Key（可选）
   * @returns {Promise<{created: boolean}>} 返回是否为新创建
   */
  private async syncSingleTechPoint(
    tpdTechPoint: any,
    apiBaseUrl?: string,
    apiKey?: string
  ): Promise<{ created: boolean }> {
    try {
      const baseUrl = apiBaseUrl || this.tpdApiBaseUrl;
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // 获取技术点详情（包含关联数据）
      const detailResponse = await axios.get(
        `${baseUrl}/tech-points/${tpdTechPoint.id}`,
        {
          headers,
          params: {
            includeAssociations: true,
          },
          timeout: 30000,
        }
      );

      if (detailResponse.data.code !== 200 || !detailResponse.data.data) {
        throw new Error('获取技术点详情失败');
      }

      const techPointDetail = detailResponse.data.data;

      // 转换车型数据为 CarModelInfo 格式
      const carModelsInfo: CarModelInfo[] = [];
      if (techPointDetail.carModels && Array.isArray(techPointDetail.carModels)) {
        for (const carModel of techPointDetail.carModels) {
          carModelsInfo.push({
            id: carModel.id || carModel.car_model_id,
            name: carModel.name || carModel.model_name || '',
            brand: carModel.brand || carModel.brand_name,
            brand_id: carModel.brand_id,
            series: carModel.series || carModel.series_name,
            launch_date: carModel.launch_date || carModel.launch_year?.toString(),
            status: carModel.status,
            application_status: carModel.application_status || carModel.status,
            implementation_date: carModel.implementation_date,
            notes: carModel.notes || carModel.relationship
          });
        }
        logger.debug(`技术点 ${techPointDetail.id} 关联了 ${carModelsInfo.length} 个车型，已转换为 JSON 格式`);
      }

      // 转换资源数据为 ResourceInfo 格式
      const resourcesInfo: ResourceInfo[] = [];
      if (techPointDetail.resources && Array.isArray(techPointDetail.resources)) {
        for (const resource of techPointDetail.resources) {
          resourcesInfo.push({
            type: resource.type || 'other',
            name: resource.name || resource.title || '',
            url: resource.url || resource.link,
            file_path: resource.file_path,
            description: resource.description,
            size: resource.size,
            created_at: resource.created_at
          });
        }
        logger.debug(`技术点 ${techPointDetail.id} 关联了 ${resourcesInfo.length} 个资源，已转换为 JSON 格式`);
      }

      // 转换知识点数据为 KnowledgeInfo 格式
      let knowledgeInfo: KnowledgeInfo | null = null;
      if (techPointDetail.knowledgePoints && Array.isArray(techPointDetail.knowledgePoints) && techPointDetail.knowledgePoints.length > 0) {
        // 如果有多个知识点，取第一个或合并
        const firstKnowledge = techPointDetail.knowledgePoints[0];
        knowledgeInfo = {
          title: firstKnowledge.title,
          content: firstKnowledge.content,
          knowledge_type: firstKnowledge.knowledge_type,
          difficulty_level: firstKnowledge.difficulty_level,
          tags: firstKnowledge.tags,
          prerequisites: firstKnowledge.prerequisites,
          learning_objectives: firstKnowledge.learning_objectives,
          examples: firstKnowledge.examples,
          references: firstKnowledge.references
        };
      } else if (techPointDetail.knowledge_info) {
        // 如果直接有 knowledge_info 字段
        knowledgeInfo = techPointDetail.knowledge_info;
      }

      // 准备技术点数据
      const techPointData: CreateTechPointDTO = {
        name: techPointDetail.name,
        description: techPointDetail.description || null,
        category_id: techPointDetail.category_id || null,
        parent_id: techPointDetail.parent_id || null,
        level: techPointDetail.level || 1,
        tech_type: this.mapTechType(techPointDetail.tech_type),
        priority: this.mapPriority(techPointDetail.priority),
        status: this.mapStatus(techPointDetail.status),
        tags: techPointDetail.tags || null,
        technical_details: techPointDetail.technical_details || null,
        benefits: techPointDetail.benefits || null,
        applications: techPointDetail.applications || null,
        keywords: techPointDetail.keywords || null,
        source_url: techPointDetail.source_url || null,
        created_by: techPointDetail.created_by || null,
        // TPD2 同步相关字段
        tpd_id: techPointDetail.id?.toString() || null,
        car_models_info: carModelsInfo.length > 0 ? carModelsInfo : undefined,
        resources_info: resourcesInfo.length > 0 ? resourcesInfo : undefined,
        knowledge_info: knowledgeInfo || undefined
      };

      // 检查技术点是否已存在
      // 优先通过 tpd_id 查找
      let existing = null;
      if (techPointData.tpd_id) {
        const allTechPoints = await techPointModel.findAll({ limit: 10000 });
        existing = allTechPoints.data.find((tp: any) => tp.tpd_id === techPointData.tpd_id);
      }
      
      // 如果通过 tpd_id 找不到，尝试通过 ID 查找
      if (!existing) {
        existing = await techPointModel.findById(techPointDetail.id);
      }
      
      // 如果通过 ID 找不到，尝试通过名称查找
      if (!existing) {
        const allTechPoints = await techPointModel.findAll({ limit: 10000 });
        existing = allTechPoints.data.find((tp: any) => tp.name === techPointDetail.name);
      }

      let created = false;
      if (existing) {
        // 更新现有技术点
        const updateData: UpdateTechPointDTO = {
          ...techPointData,
          // 确保 tpd_id 被更新
          tpd_id: techPointData.tpd_id || existing.tpd_id
        };
        await techPointModel.update(existing.id, updateData);
        created = false;
        logger.debug(`更新技术点: ${techPointDetail.name} (ID: ${existing.id}, TPD_ID: ${techPointData.tpd_id})`);
      } else {
        // 创建新技术点
        const newTechPoint = await techPointModel.create(techPointData);
        created = true;
        logger.debug(`创建技术点: ${techPointDetail.name} (ID: ${newTechPoint.id}, TPD_ID: ${techPointData.tpd_id})`);
      }

      return { created };
    } catch (error) {
      logger.error(`同步技术点 ${tpdTechPoint.id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 映射技术点类型
   */
  private mapTechType(tpdType: string): TechType {
    const typeMap: Record<string, TechType> = {
      feature: TechType.FEATURE,
      technology: TechType.TECHNOLOGY,
      innovation: TechType.INNOVATION,
      improvement: TechType.IMPROVEMENT,
    };
    return typeMap[tpdType] || TechType.FEATURE;
  }

  /**
   * 映射优先级
   */
  private mapPriority(tpdPriority: string): Priority {
    const priorityMap: Record<string, Priority> = {
      low: Priority.LOW,
      medium: Priority.MEDIUM,
      high: Priority.HIGH,
      critical: Priority.CRITICAL,
    };
    return priorityMap[tpdPriority] || Priority.MEDIUM;
  }

  /**
   * 映射状态
   */
  private mapStatus(tpdStatus: string): Status {
    const statusMap: Record<string, Status> = {
      active: Status.ACTIVE,
      inactive: Status.INACTIVE,
      draft: Status.DRAFT,
      archived: Status.ARCHIVED,
    };
    return statusMap[tpdStatus] || Status.DRAFT;
  }

  /**
   * 反向映射技术点类型（从本地到 TPD2）
   */
  private reverseMapTechType(localType: TechType): string {
    const typeMap: Record<TechType, string> = {
      [TechType.FEATURE]: 'feature',
      [TechType.TECHNOLOGY]: 'technology',
      [TechType.INNOVATION]: 'innovation',
      [TechType.IMPROVEMENT]: 'improvement',
    };
    return typeMap[localType] || 'feature';
  }

  /**
   * 反向映射优先级（从本地到 TPD2）
   */
  private reverseMapPriority(localPriority: Priority): string {
    const priorityMap: Record<Priority, string> = {
      [Priority.LOW]: 'low',
      [Priority.MEDIUM]: 'medium',
      [Priority.HIGH]: 'high',
      [Priority.CRITICAL]: 'critical',
    };
    return priorityMap[localPriority] || 'medium';
  }

  /**
   * 反向映射状态（从本地到 TPD2）
   */
  private reverseMapStatus(localStatus: Status): string {
    const statusMap: Record<Status, string> = {
      [Status.ACTIVE]: 'active',
      [Status.INACTIVE]: 'inactive',
      [Status.DRAFT]: 'draft',
      [Status.ARCHIVED]: 'archived',
    };
    return statusMap[localStatus] || 'draft';
  }

  /**
   * 同步技术点到 TPD2
   * 将当前项目的技术点数据同步到 TPD2 项目
   * @param techPointIds 要同步的技术点ID列表，如果不提供则同步所有
   * @param options 同步选项，包括自定义 API URL 和 API Key
   */
  async syncTechPointsToTPD(
    techPointIds?: number[],
    options?: {
      apiBaseUrl?: string;
      apiKey?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    stats: {
      total: number;
      created: number;
      updated: number;
      errors: number;
    };
  }> {
    const stats = {
      total: 0,
      created: 0,
      updated: 0,
      errors: 0,
    };

    // 使用传入的 API URL 或默认值
    const apiBaseUrl = options?.apiBaseUrl || this.tpdApiBaseUrl;
    const apiKey = options?.apiKey;

    try {
      logger.info(`开始同步技术点到 TPD2... (API: ${apiBaseUrl})`);

      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // 获取要同步的技术点
      let techPoints: any[] = [];
      if (techPointIds && techPointIds.length > 0) {
        // 同步指定的技术点
        for (const id of techPointIds) {
          const techPoint = await techPointModel.findById(id);
          if (techPoint) {
            techPoints.push(techPoint);
          }
        }
      } else {
        // 同步所有技术点
        const result = await techPointModel.findAll({ limit: 10000 });
        techPoints = result.data;
      }

      stats.total = techPoints.length;
      logger.info(`准备同步 ${stats.total} 个技术点到 TPD2`);

      // 处理每个技术点
      for (const techPoint of techPoints) {
        try {
          const result = await this.syncSingleTechPointToTPD(techPoint, apiBaseUrl, apiKey);
          if (result.created) {
            stats.created++;
          } else {
            stats.updated++;
          }
        } catch (error) {
          logger.error(`同步技术点失败 (ID: ${techPoint.id}):`, error);
          stats.errors++;
        }
      }

      logger.info('技术点同步到 TPD2 完成', stats);

      return {
        success: true,
        message: `同步完成：总计 ${stats.total} 条，新增 ${stats.created} 条，更新 ${stats.updated} 条，错误 ${stats.errors} 条`,
        stats,
      };
    } catch (error) {
      logger.error('同步技术点到 TPD2 失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '同步失败',
        stats,
      };
    }
  }

  /**
   * 同步单个技术点到 TPD2
   * @param techPoint 本地技术点数据
   * @param apiBaseUrl API 基础 URL
   * @param apiKey API Key（可选）
   * @returns {Promise<{created: boolean}>} 返回是否为新创建
   */
  private async syncSingleTechPointToTPD(
    techPoint: any,
    apiBaseUrl: string,
    apiKey?: string
  ): Promise<{ created: boolean }> {
    try {
      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // 转换技术点数据为 TPD2 格式
      const tpdTechPointData: any = {
        name: techPoint.name,
        description: techPoint.description || null,
        category_id: techPoint.category_id || null,
        parent_id: techPoint.parent_id || null,
        level: techPoint.level || 1,
        tech_type: this.reverseMapTechType(techPoint.tech_type),
        priority: this.reverseMapPriority(techPoint.priority),
        status: this.reverseMapStatus(techPoint.status),
        tags: techPoint.tags || null,
        technical_details: techPoint.technical_details || null,
        benefits: techPoint.benefits || null,
        applications: techPoint.applications || null,
        keywords: techPoint.keywords || null,
        source_url: techPoint.source_url || null,
        created_by: techPoint.created_by || null,
      };

      // 处理车型信息
      if (techPoint.car_models_info && Array.isArray(techPoint.car_models_info)) {
        tpdTechPointData.car_models = techPoint.car_models_info.map((cm: CarModelInfo) => ({
          id: cm.id,
          name: cm.name,
          brand: cm.brand,
          brand_id: cm.brand_id,
          series: cm.series,
          launch_date: cm.launch_date,
          status: cm.status,
          application_status: cm.application_status,
          implementation_date: cm.implementation_date,
          notes: cm.notes,
        }));
      }

      // 处理资源信息
      if (techPoint.resources_info && Array.isArray(techPoint.resources_info)) {
        tpdTechPointData.resources = techPoint.resources_info.map((r: ResourceInfo) => ({
          type: r.type,
          name: r.name,
          url: r.url,
          file_path: r.file_path,
          description: r.description,
          size: r.size,
          created_at: r.created_at,
        }));
      }

      // 处理知识点信息
      if (techPoint.knowledge_info) {
        tpdTechPointData.knowledge_points = [{
          title: techPoint.knowledge_info.title,
          content: techPoint.knowledge_info.content,
          knowledge_type: techPoint.knowledge_info.knowledge_type,
          difficulty_level: techPoint.knowledge_info.difficulty_level,
          tags: techPoint.knowledge_info.tags,
          prerequisites: techPoint.knowledge_info.prerequisites,
          learning_objectives: techPoint.knowledge_info.learning_objectives,
          examples: techPoint.knowledge_info.examples,
          references: techPoint.knowledge_info.references,
        }];
      }

      // 检查技术点是否已在 TPD2 中存在（通过 tpd_id）
      let created = false;
      if (techPoint.tpd_id) {
        // 尝试更新现有技术点
        try {
          const updateResponse = await axios.put(
            `${apiBaseUrl}/tech-points/${techPoint.tpd_id}`,
            tpdTechPointData,
            { headers, timeout: 30000 }
          );

          if (updateResponse.data.code === 200) {
            logger.debug(`更新 TPD2 技术点: ${techPoint.name} (TPD_ID: ${techPoint.tpd_id})`);
            created = false;
          } else {
            // 如果更新失败，尝试创建
            throw new Error('Update failed, trying create');
          }
        } catch (updateError) {
          // 更新失败，尝试创建
          logger.debug(`更新失败，尝试创建技术点: ${techPoint.name}`);
          const createResponse = await axios.post(
            `${apiBaseUrl}/tech-points`,
            tpdTechPointData,
            { headers, timeout: 30000 }
          );

          if (createResponse.data.code === 200) {
            const newTpdId = createResponse.data.data?.id?.toString();
            // 更新本地技术点的 tpd_id
            if (newTpdId) {
              await techPointModel.update(techPoint.id, { tpd_id: newTpdId });
            }
            logger.debug(`创建 TPD2 技术点: ${techPoint.name} (TPD_ID: ${newTpdId})`);
            created = true;
          } else {
            throw new Error(`创建失败: ${createResponse.data.message || 'Unknown error'}`);
          }
        }
      } else {
        // 没有 tpd_id，直接创建
        const createResponse = await axios.post(
          `${apiBaseUrl}/tech-points`,
          tpdTechPointData,
          { headers, timeout: 30000 }
        );

        if (createResponse.data.code === 200) {
          const newTpdId = createResponse.data.data?.id?.toString();
          // 更新本地技术点的 tpd_id
          if (newTpdId) {
            await techPointModel.update(techPoint.id, { tpd_id: newTpdId });
          }
          logger.debug(`创建 TPD2 技术点: ${techPoint.name} (TPD_ID: ${newTpdId})`);
          created = true;
        } else {
          throw new Error(`创建失败: ${createResponse.data.message || 'Unknown error'}`);
        }
      }

      return { created };
    } catch (error) {
      logger.error(`同步技术点 ${techPoint.id} 到 TPD2 失败:`, error);
      throw error;
    }
  }
}

// 导出单例实例
export const tpdSyncService = new TPDSyncService();

