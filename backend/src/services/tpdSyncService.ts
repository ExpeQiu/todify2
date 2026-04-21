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
 * tech-hub 同步服务
 * 从外部 tech-hub 拉取技术点数据到本地数据库
 */
export class TechHubSyncService {
  private techHubApiBaseUrl: string;

  constructor() {
    // 优先读取 tech-hub 配置，兼容旧的环境变量命名
    this.techHubApiBaseUrl = process.env.TECH_HUB_API_BASE_URL || process.env.TPD_API_BASE_URL || 'http://localhost:3004/api/external/v1';
  }

  /**
   * 同步技术点数据
   * 从 tech-hub 获取所有技术点，并存储到本地数据库（覆盖更新）
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
    const apiBaseUrl = options?.apiBaseUrl || this.techHubApiBaseUrl;
    const apiKey = options?.apiKey;

    try {
      logger.info(`开始从 tech-hub 同步技术点数据... (API: ${apiBaseUrl})`);

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
          // 从 tech-hub 获取技术点列表
          logger.debug(`正在获取第 ${page} 页技术点数据...`);
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

          let techPoints: any[] = [];

          // 处理不同的响应格式（兼容外部系统）
          if (response.data.code === 200 && response.data.data) {
            // 格式: { code: 200, data: { data: [...], total: ... } }
            const paginatedData = response.data.data;
            techPoints = paginatedData.data || [];
          } else if (Array.isArray(response.data)) {
            // 格式: [...]
            techPoints = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // 格式: { data: [...] }
            techPoints = response.data.data;
          } else if (response.data.success && response.data.data) {
            // 格式: { success: true, data: { data: [...], total: ... } }
            const paginatedData = response.data.data;
            techPoints = Array.isArray(paginatedData) ? paginatedData : (paginatedData.data || []);
          } else if (response.data.code === 200 && Array.isArray(response.data.data)) {
            // 格式: { code: 200, data: [...] }
            techPoints = response.data.data;
          } else {
            logger.warn('tech-hub API 返回了未知格式的响应:', {
              hasCode: !!response.data.code,
              hasData: !!response.data.data,
              hasSuccess: !!response.data.success,
              isArray: Array.isArray(response.data),
              responseKeys: Object.keys(response.data || {}),
            });
            // 尝试直接使用响应数据
            if (Array.isArray(response.data)) {
              techPoints = response.data;
            } else if (response.data && typeof response.data === 'object') {
              techPoints = [];
            }
          }

          if (techPoints.length === 0) {
            logger.debug(`第 ${page} 页没有更多数据，停止获取`);
            hasMore = false;
            break;
          }

          logger.debug(`第 ${page} 页获取到 ${techPoints.length} 个技术点`);
          stats.total += techPoints.length;

          // 处理每个技术点
          for (const techHubTechPoint of techPoints) {
            try {
              const result = await this.syncSingleTechPoint(techHubTechPoint, apiBaseUrl, apiKey);
              if (result.created) {
                stats.created++;
              } else {
                stats.updated++;
              }
            } catch (error) {
              logger.error(`同步技术点失败 (ID: ${techHubTechPoint.id}):`, error);
              stats.errors++;
            }
          }

          // 检查是否还有更多数据
          if (techPoints.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const statusCode = error.response?.status;
          const errorData = error.response?.data;

          logger.error(`获取第 ${page} 页数据失败:`, {
            message: errorMessage,
            statusCode,
            errorData,
            apiUrl: `${apiBaseUrl}/tech-points`,
          });

          // 如果是404或400，可能没有更多数据了
          if (statusCode === 404 || statusCode === 400) {
            logger.info('API 返回 404/400，停止获取更多数据');
            hasMore = false;
          } else {
            stats.errors++;
            // 对于其他错误，可以选择继续或停止
            // 这里选择继续尝试下一页，但限制最大页数
            if (page >= 100) {
              logger.warn('已达到最大页数限制（100页），停止获取');
              hasMore = false;
            } else {
              page++;
            }
          }
        }
      }

      logger.info('tech-hub 技术点数据同步完成', stats);

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
   * @param techHubTechPoint 技术点数据
   * @param apiBaseUrl API 基础 URL
   * @param apiKey API Key（可选）
   * @returns {Promise<{created: boolean}>} 返回是否为新创建
   */
  private async syncSingleTechPoint(
    techHubTechPoint: any,
    apiBaseUrl?: string,
    apiKey?: string
  ): Promise<{ created: boolean }> {
    try {
      const baseUrl = apiBaseUrl || this.techHubApiBaseUrl;
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // 获取技术点详情（包含关联数据）
      logger.debug(`获取技术点详情: ${techHubTechPoint.id}`);
      const detailResponse = await axios.get(
        `${baseUrl}/tech-points/${techHubTechPoint.id}`,
        {
          headers,
          params: {
            includeAssociations: true,
          },
          timeout: 30000,
        }
      );

      let techPointDetail: any = null;

      // 处理不同的响应格式（兼容外部系统）
      if (detailResponse.data.code === 200 && detailResponse.data.data) {
        // 格式: { code: 200, data: {...} }
        techPointDetail = detailResponse.data.data;
      } else if (detailResponse.data.success && detailResponse.data.data) {
        // 格式: { success: true, data: {...} }
        techPointDetail = detailResponse.data.data;
      } else if (detailResponse.data.data) {
        // 格式: { data: {...} }
        techPointDetail = detailResponse.data.data;
      } else if (detailResponse.data.code === 200) {
        // 格式: { code: 200, ... } (数据直接在根级别)
        techPointDetail = detailResponse.data;
      } else {
        // 尝试直接使用响应数据
        techPointDetail = detailResponse.data;
      }

      if (!techPointDetail || !techPointDetail.id) {
        logger.warn(`技术点详情格式异常，使用列表数据: ${techHubTechPoint.id}`, {
          responseKeys: Object.keys(detailResponse.data || {}),
          hasCode: !!detailResponse.data?.code,
          hasData: !!detailResponse.data?.data,
        });
        // 如果详情获取失败，使用列表数据
        techPointDetail = techHubTechPoint;
      }

      // 转换车型数据为 CarModelInfo 格式
      const carModelsInfo: CarModelInfo[] = [];
      // 支持多种字段名（兼容不同的 API 响应格式）
      const carModels = techPointDetail.carModels || 
                       techPointDetail.car_models || 
                       techPointDetail.associated_car_models ||
                       techPointDetail.associatedCarModels ||
                       [];
      
      if (Array.isArray(carModels) && carModels.length > 0) {
        for (const carModel of carModels) {
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
      // 支持多种字段名（兼容不同的 API 响应格式）
      const resources = techPointDetail.resources || 
                       techPointDetail.resources_info ||
                       techPointDetail.associated_resources ||
                       [];
      
      if (Array.isArray(resources) && resources.length > 0) {
        for (const resource of resources) {
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
      // 支持多种字段名（兼容不同的 API 响应格式）
      const knowledgePoints = techPointDetail.knowledgePoints || 
                             techPointDetail.knowledge_points ||
                             techPointDetail.associated_knowledge_points ||
                             [];
      
      if (Array.isArray(knowledgePoints) && knowledgePoints.length > 0) {
        // 如果有多个知识点，取第一个或合并
        const firstKnowledge = knowledgePoints[0];
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
      } else if (techPointDetail.knowledge_info || techPointDetail.knowledgeInfo) {
        // 如果直接有 knowledge_info 字段
        knowledgeInfo = techPointDetail.knowledge_info || techPointDetail.knowledgeInfo;
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
        // 外部源同步锚点字段（历史列名为 tpd_id）
        tpd_id: techPointDetail.id?.toString() || null,
        car_models_info: carModelsInfo.length > 0 ? carModelsInfo : undefined,
        resources_info: resourcesInfo.length > 0 ? resourcesInfo : undefined,
        knowledge_info: knowledgeInfo || undefined
      };

      // 检查技术点是否已存在
      // 优先通过历史锚点字段 tpd_id 查找
      let existing = null;
      if (techPointData.tpd_id) {
        const allTechPoints = await techPointModel.findAll({ limit: 10000 });
        existing = allTechPoints.data.find((tp: any) => tp.tpd_id === techPointData.tpd_id);
      }
      
      // 如果通过锚点找不到，尝试通过 ID 查找
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
          // 确保历史锚点字段被更新
          tpd_id: techPointData.tpd_id || existing.tpd_id
        };
        await techPointModel.update(existing.id, updateData);
        created = false;
        logger.debug(`更新技术点: ${techPointDetail.name} (ID: ${existing.id}, SOURCE_ID: ${techPointData.tpd_id})`);
      } else {
        // 创建新技术点
        const newTechPoint = await techPointModel.create(techPointData);
        created = true;
        logger.debug(`创建技术点: ${techPointDetail.name} (ID: ${newTechPoint.id}, SOURCE_ID: ${techPointData.tpd_id})`);
      }

      return { created };
    } catch (error) {
      logger.error(`同步技术点 ${techHubTechPoint.id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 映射技术点类型
   */
  private mapTechType(techHubType: string): TechType {
    const typeMap: Record<string, TechType> = {
      feature: TechType.FEATURE,
      technology: TechType.TECHNOLOGY,
      innovation: TechType.INNOVATION,
      improvement: TechType.IMPROVEMENT,
    };
    return typeMap[techHubType] || TechType.FEATURE;
  }

  /**
   * 映射优先级
   */
  private mapPriority(techHubPriority: string): Priority {
    const priorityMap: Record<string, Priority> = {
      low: Priority.LOW,
      medium: Priority.MEDIUM,
      high: Priority.HIGH,
      critical: Priority.CRITICAL,
    };
    return priorityMap[techHubPriority] || Priority.MEDIUM;
  }

  /**
   * 映射状态
   */
  private mapStatus(techHubStatus: string): Status {
    const statusMap: Record<string, Status> = {
      active: Status.ACTIVE,
      inactive: Status.INACTIVE,
      draft: Status.DRAFT,
      archived: Status.ARCHIVED,
    };
    return statusMap[techHubStatus] || Status.DRAFT;
  }

}

// 导出单例实例
export const techHubSyncService = new TechHubSyncService();
export const tpdSyncService = techHubSyncService;

