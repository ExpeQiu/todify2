import { TechPointModel } from '../models/TechPoint';
import { DatabaseManager } from '../config/database';

// 内容类型枚举，与前端保持一致
export type ContentType = 'knowledge_point' | 'tech_packaging' | 'tech_promotion' | 'tech_press';

// 选择项接口，与前端保持一致
export interface SelectionItem {
  knowledgePointId: string;
  contentType: ContentType;
  knowledgePoint: {
    id: string;
    vehicleModel: string;
    vehicleSeries: string;
    techCategory: string;
    techPoint: string;
    description: string;
  };
}

// 内容拼接结果接口
export interface ConcatenatedContent {
  contextString: string;
  summary: {
    totalItems: number;
    contentTypeCounts: Record<ContentType, number>;
    knowledgePointIds: string[];
    processingErrors?: string[];
    stats?: {
      totalItems: number;
      uniqueKnowledgePoints: number;
      contentTypeDistribution: Record<ContentType, number>;
    };
  };
}

/**
 * 内容拼接服务类
 * 负责根据用户选择的知识点和内容类型，获取并拼接相关内容
 */
export class ContentConcatenationService {
  private techPointModel: TechPointModel;
  private cache: Map<string, any> = new Map(); // 简单的内存缓存
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存过期时间

  constructor(db: DatabaseManager) {
    this.techPointModel = new TechPointModel(db);
  }

  /**
   * 根据选择的项目构建知识点上下文
   */
  async buildContextFromSelectedItems(selectedItems: SelectionItem[]): Promise<ConcatenatedContent> {
    // 验证输入参数
    const validation = this.validateSelectedItems(selectedItems);
    if (!validation.isValid) {
      throw new Error(`输入验证失败: ${validation.errors.join(', ')}`);
    }

    // 获取统计信息
    const stats = this.getContentStats(selectedItems);
    console.log('开始处理内容拼接:', stats);

    const groupedItems = this.groupByKnowledgePoint(selectedItems);
    let contextString = '';
    const contentTypeCounts: Record<ContentType, number> = {
      knowledge_point: 0,
      tech_packaging: 0,
      tech_promotion: 0,
      tech_press: 0
    };
    const knowledgePointIds: string[] = [];
    const processingErrors: string[] = [];

    // 处理每个知识点组
    for (const [knowledgePointId, items] of groupedItems) {
      try {
        console.log(`处理知识点 ${knowledgePointId}, 包含 ${items.length} 个内容类型`);
        
        // 获取知识点的关联内容
        const associatedContent = await this.techPointModel.getAssociatedContent(parseInt(knowledgePointId, 10));
        
        // 获取知识点的基本信息
        const techPointInfo = await this.techPointModel.findById(parseInt(knowledgePointId, 10));
        
        if (!associatedContent && !techPointInfo) {
          const errorMsg = `知识点 ${knowledgePointId} 未找到任何内容`;
          console.warn(errorMsg);
          processingErrors.push(errorMsg);
          continue;
        }

        knowledgePointIds.push(knowledgePointId);

        // 添加知识点基本信息作为上下文开头
        const knowledgePoint = items[0].knowledgePoint;
        contextString += `\n=== 知识点：${knowledgePoint.techPoint} ===\n`;
        contextString += `车型：${knowledgePoint.vehicleModel}\n`;
        contextString += `车系：${knowledgePoint.vehicleSeries}\n`;
        contextString += `技术分类：${knowledgePoint.techCategory}\n`;
        contextString += `描述：${knowledgePoint.description}\n\n`;

        // 根据选择的内容类型添加相应内容
        for (const item of items) {
          try {
            const content = this.extractContentByType(associatedContent, techPointInfo, item.contentType);
            if (content) {
              contextString += this.formatContentByType(item.contentType, content);
              contentTypeCounts[item.contentType]++;
            } else {
              const warningMsg = `知识点 ${knowledgePointId} 的 ${item.contentType} 类型内容为空`;
              console.warn(warningMsg);
              processingErrors.push(warningMsg);
            }
          } catch (contentError) {
            const errorMsg = `处理知识点 ${knowledgePointId} 的 ${item.contentType} 内容时出错: ${contentError instanceof Error ? contentError.message : '未知错误'}`;
            console.error(errorMsg);
            processingErrors.push(errorMsg);
          }
        }

        contextString += '\n' + '='.repeat(50) + '\n';
      } catch (error) {
        const errorMsg = `处理知识点 ${knowledgePointId} 时出错: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        processingErrors.push(errorMsg);
        // 继续处理其他知识点，不中断整个流程
      }
    }

    const result: ConcatenatedContent = {
      contextString: contextString.trim(),
      summary: {
        totalItems: selectedItems.length,
        contentTypeCounts,
        knowledgePointIds,
        processingErrors: processingErrors.length > 0 ? processingErrors : undefined,
        stats
      }
    };

    console.log('内容拼接完成:', {
      contextLength: result.contextString.length,
      processedKnowledgePoints: knowledgePointIds.length,
      totalErrors: processingErrors.length
    });

    return result;
  }

  /**
   * 批量获取知识点数据以提高性能
   */
  private async batchGetKnowledgePointData(knowledgePointIds: string[]): Promise<Map<string, { associatedContent: any; techPointInfo: any }>> {
    const result = new Map<string, { associatedContent: any; techPointInfo: any }>();
    
    // 并行获取所有知识点的数据
    const promises = knowledgePointIds.map(async (id) => {
      try {
        const numericId = parseInt(id, 10);
        const [associatedContent, techPointInfo] = await Promise.all([
          this.techPointModel.getAssociatedContent(numericId),
          this.techPointModel.findById(numericId)
        ]);
        return { id, associatedContent, techPointInfo };
      } catch (error) {
        console.error(`批量获取知识点 ${id} 数据失败:`, error);
        return { id, associatedContent: null, techPointInfo: null };
      }
    });
    
    const results = await Promise.all(promises);
    
    results.forEach(({ id, associatedContent, techPointInfo }) => {
      result.set(id, { associatedContent, techPointInfo });
    });
    
    return result;
  }

  /**
   * 按知识点ID分组选择项
   */
  private groupByKnowledgePoint(selectedItems: SelectionItem[]): Map<string, SelectionItem[]> {
    const grouped = new Map<string, SelectionItem[]>();
    
    for (const item of selectedItems) {
      const existing = grouped.get(item.knowledgePointId) || [];
      existing.push(item);
      grouped.set(item.knowledgePointId, existing);
    }
    
    return grouped;
  }

  /**
   * 根据内容类型从关联内容中提取对应内容
   */
  private extractContentByType(associatedContent: any, techPointInfo: any, contentType: ContentType): string | null {
    switch (contentType) {
      case 'knowledge_point':
        // 知识点本身的详细信息
        if (techPointInfo) {
          let content = `技术点名称：${techPointInfo.name || 'N/A'}\n`;
          content += `描述：${techPointInfo.description || 'N/A'}\n`;
          
          // 解析JSON字段
          if (techPointInfo.technical_details) {
            try {
              const details = typeof techPointInfo.technical_details === 'string' 
                ? JSON.parse(techPointInfo.technical_details) 
                : techPointInfo.technical_details;
              content += `技术详情：${JSON.stringify(details, null, 2)}\n`;
            } catch (e) {
              content += `技术详情：${techPointInfo.technical_details}\n`;
            }
          }
          
          if (techPointInfo.benefits) {
            try {
              const benefits = typeof techPointInfo.benefits === 'string' 
                ? JSON.parse(techPointInfo.benefits) 
                : techPointInfo.benefits;
              content += `技术优势：${JSON.stringify(benefits, null, 2)}\n`;
            } catch (e) {
              content += `技术优势：${techPointInfo.benefits}\n`;
            }
          }
          
          if (techPointInfo.applications) {
            try {
              const applications = typeof techPointInfo.applications === 'string' 
                ? JSON.parse(techPointInfo.applications) 
                : techPointInfo.applications;
              content += `应用场景：${JSON.stringify(applications, null, 2)}\n`;
            } catch (e) {
              content += `应用场景：${techPointInfo.applications}\n`;
            }
          }
          
          return content;
        }
        return null;
      
      case 'tech_packaging':
        // 技术包装材料
        return associatedContent?.packagingMaterials && associatedContent.packagingMaterials.length > 0 ?
          associatedContent.packagingMaterials.map((item: any) => 
            `标题：${item.title || 'N/A'}\n内容：${item.content || 'N/A'}\n关键词：${item.keywords || 'N/A'}`
          ).join('\n---\n') : null;
      
      case 'tech_promotion':
        // 技术推广策略
        return associatedContent?.promotionStrategies && associatedContent.promotionStrategies.length > 0 ?
          associatedContent.promotionStrategies.map((item: any) => 
            `策略标题：${item.title || 'N/A'}\n策略内容：${item.content || 'N/A'}\n目标受众：${item.target_audience || 'N/A'}\n权重：${item.weight || 'N/A'}`
          ).join('\n---\n') : null;
      
      case 'tech_press':
        // 技术通稿
        return associatedContent?.pressReleases && associatedContent.pressReleases.length > 0 ?
          associatedContent.pressReleases.map((item: any) => 
            `通稿标题：${item.title || 'N/A'}\n通稿内容：${item.content || 'N/A'}\n发布时间：${item.publish_date || 'N/A'}\n权重：${item.weight || 'N/A'}`
          ).join('\n---\n') : null;
      
      default:
        return null;
    }
  }

  /**
   * 根据内容类型格式化内容
   */
  private formatContentByType(contentType: ContentType, content: string): string {
    const typeLabels = {
      knowledge_point: '📋 知识点详情',
      tech_packaging: '📦 技术包装材料',
      tech_promotion: '📢 技术推广策略',
      tech_press: '📰 技术通稿内容'
    };

    return `${typeLabels[contentType]}：\n${content}\n\n`;
  }

  /**
   * 验证选择的项目数据格式
   */
  private validateSelectedItems(selectedItems: SelectionItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(selectedItems)) {
      errors.push('selectedItems必须是数组');
      return { isValid: false, errors };
    }
    
    if (selectedItems.length === 0) {
      errors.push('selectedItems不能为空');
      return { isValid: false, errors };
    }

    if (selectedItems.length > 50) {
      errors.push('selectedItems数量不能超过50个，以确保性能');
    }
    
    // 验证每个选择项的格式
    selectedItems.forEach((item, index) => {
      if (!item.knowledgePointId) {
        errors.push(`第${index + 1}项缺少knowledgePointId`);
      }
      
      if (!item.contentType) {
        errors.push(`第${index + 1}项缺少contentType`);
      } else if (!['knowledge_point', 'tech_packaging', 'tech_promotion', 'tech_press'].includes(item.contentType)) {
        errors.push(`第${index + 1}项的contentType无效: ${item.contentType}`);
      }
      
      if (!item.knowledgePoint) {
        errors.push(`第${index + 1}项缺少knowledgePoint对象`);
      } else {
        const kp = item.knowledgePoint;
        if (!kp.id || !kp.techPoint) {
          errors.push(`第${index + 1}项的knowledgePoint对象缺少必要字段`);
        }
      }
    });
    
    // 检查是否有重复的知识点ID和内容类型组合
    const combinations = new Set();
    selectedItems.forEach((item, index) => {
      const combination = `${item.knowledgePointId}-${item.contentType}`;
      if (combinations.has(combination)) {
        errors.push(`第${index + 1}项存在重复的知识点ID和内容类型组合: ${combination}`);
      }
      combinations.add(combination);
    });
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * 获取内容统计信息
   */
  private getContentStats(selectedItems: SelectionItem[]): {
    totalItems: number;
    uniqueKnowledgePoints: number;
    contentTypeDistribution: Record<ContentType, number>;
  } {
    const uniqueKnowledgePoints = new Set(selectedItems.map(item => item.knowledgePointId)).size;
    const contentTypeDistribution: Record<ContentType, number> = {
      knowledge_point: 0,
      tech_packaging: 0,
      tech_promotion: 0,
      tech_press: 0
    };
    
    selectedItems.forEach(item => {
      contentTypeDistribution[item.contentType]++;
    });
    
    return {
      totalItems: selectedItems.length,
      uniqueKnowledgePoints,
      contentTypeDistribution
    };
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// 导出工厂函数而不是单例实例
export const createContentConcatenationService = (db: DatabaseManager) => new ContentConcatenationService(db);