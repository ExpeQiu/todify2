import { ExtractedRequirement } from './RequirementExtractor';
import { ProjectModel } from '../../models/Project';
import { DatabaseManager, db } from '../../config/database';
import { TechPoint, KnowledgePoint, SourceInformation } from '../../types/database';

/**
 * 匹配的资源项
 */
export interface MatchedResourceItem<T> {
  data: T;
  score: number;
  matchReason: string;
}

/**
 * 匹配的资源集合
 */
export interface MatchedResources {
  techPoints: MatchedResourceItem<TechPoint>[];
  knowledgePoints: MatchedResourceItem<KnowledgePoint>[];
  sources: MatchedResourceItem<SourceInformation>[];
}

/**
 * 资源匹配器
 * 根据需求匹配项目中的相关资源
 */
export class ResourceMatcher {
  private projectModel: ProjectModel;

  constructor(db: DatabaseManager) {
    this.projectModel = new ProjectModel(db);
  }

  /**
   * 匹配资源
   */
  async matchResources(
    requirement: ExtractedRequirement,
    projectId: number
  ): Promise<MatchedResources> {
    // 1. 获取项目所有资源
    const allTechPoints = await this.projectModel.getTechPoints(projectId);
    const allKnowledgePoints = await this.projectModel.getKnowledgePoints(projectId);
    const allSources = await this.projectModel.getSourceInformations(projectId);

    // 2. 提取关键词
    const keywords = this.extractKeywords(requirement);

    // 3. 匹配技术点
    const matchedTechPoints = allTechPoints
      .map(tp => ({
        data: tp,
        score: this.calculateTechPointScore(tp, keywords, requirement),
        matchReason: this.getTechPointMatchReason(tp, keywords)
      }))
      .filter(item => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);  // 最多取10个

    // 4. 匹配知识点（基于已匹配的技术点）
    const matchedTechPointIds = matchedTechPoints.map(item => item.data.id);
    const matchedKnowledgePoints = allKnowledgePoints
      .filter(kp => matchedTechPointIds.includes(kp.tech_point_id))
      .map(kp => ({
        data: kp,
        score: this.calculateKnowledgePointScore(kp, keywords, requirement),
        matchReason: this.getKnowledgePointMatchReason(kp, keywords)
      }))
      .filter(item => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);  // 最多取15个

    // 5. 匹配来源信息
    const matchedSources = allSources
      .map(src => ({
        data: src,
        score: this.calculateSourceScore(src, keywords, requirement),
        matchReason: this.getSourceMatchReason(src, keywords)
      }))
      .filter(item => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);  // 最多取10个

    return {
      techPoints: matchedTechPoints,
      knowledgePoints: matchedKnowledgePoints,
      sources: matchedSources
    };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(requirement: ExtractedRequirement): string[] {
    const keywords: string[] = [];
    
    // 从技术范围提取
    keywords.push(...requirement.techScope);
    
    // 从原始问题提取（使用简单分词）
    const words = requirement.conversationSummary
      .split(/[\s,，。；;、]+/)
      .filter(w => w.length > 1);
    keywords.push(...words);
    
    // 从关键需求提取
    keywords.push(...requirement.keyRequirements);
    
    return [...new Set(keywords)];  // 去重
  }

  /**
   * 计算技术点匹配分数
   */
  private calculateTechPointScore(
    techPoint: TechPoint,
    keywords: string[],
    requirement: ExtractedRequirement
  ): number {
    let score = 0;
    
    // 名称匹配
    keywords.forEach(kw => {
      if (techPoint.name.includes(kw)) score += 0.5;
      if (techPoint.description?.includes(kw)) score += 0.3;
      if (techPoint.technical_details?.tech_principle?.includes(kw)) score += 0.2;
      if (techPoint.technical_details?.tech_value?.includes(kw)) score += 0.2;
    });
    
    // 标签匹配
    if (techPoint.tags && Array.isArray(techPoint.tags)) {
      keywords.forEach(kw => {
        if (techPoint.tags!.some(tag => tag.includes(kw))) score += 0.4;
      });
    }
    
    // 关键词匹配
    if (techPoint.keywords && Array.isArray(techPoint.keywords)) {
      keywords.forEach(kw => {
        if (techPoint.keywords!.some(keyword => keyword.includes(kw))) score += 0.3;
      });
    }
    
    // 优先级加权
    if (techPoint.priority === 'high') score *= 1.2;
    
    // 如果技术点在用户已选列表中，增加分数
    if (requirement.selectedResources.techPointIds.includes(techPoint.id)) {
      score += 0.5;
    }
    
    return Math.min(score, 1.0);  // 最高1分
  }

  /**
   * 计算知识点匹配分数
   */
  private calculateKnowledgePointScore(
    kp: KnowledgePoint,
    keywords: string[],
    requirement: ExtractedRequirement
  ): number {
    let score = 0;
    
    // 标题匹配
    keywords.forEach(kw => {
      if (kp.title.includes(kw)) score += 0.5;
      if (kp.content.includes(kw)) score += 0.3;
    });
    
    // 标签匹配
    if (kp.tags && Array.isArray(kp.tags)) {
      keywords.forEach(kw => {
        if (kp.tags!.some(tag => tag.includes(kw))) score += 0.4;
      });
    }
    
    // 如果知识点在用户已选列表中，增加分数
    if (requirement.selectedResources.knowledgePointIds.includes(kp.id)) {
      score += 0.5;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 计算来源信息匹配分数
   */
  private calculateSourceScore(
    source: SourceInformation,
    keywords: string[],
    requirement: ExtractedRequirement
  ): number {
    let score = 0;
    
    // 标题匹配
    keywords.forEach(kw => {
      if (source.title.includes(kw)) score += 0.5;
      if (source.description?.includes(kw)) score += 0.3;
    });
    
    // 类型加权
    if (source.category === 'technical-translation') score *= 1.2;
    if (source.category === 'internet-search') score *= 1.1;
    
    // 如果来源在用户已选列表中，增加分数
    if (source.id && requirement.selectedResources.sourceIds.includes(source.id)) {
      score += 0.5;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 获取技术点匹配原因
   */
  private getTechPointMatchReason(tp: TechPoint, keywords: string[]): string {
    const matched = keywords.filter(kw => 
      tp.name.includes(kw) || tp.description?.includes(kw)
    );
    return matched.length > 0 ? `匹配关键词: ${matched.join(', ')}` : '相关技术点';
  }

  /**
   * 获取知识点匹配原因
   */
  private getKnowledgePointMatchReason(kp: KnowledgePoint, keywords: string[]): string {
    const matched = keywords.filter(kw => 
      kp.title.includes(kw) || kp.content.includes(kw)
    );
    return matched.length > 0 ? `匹配关键词: ${matched.join(', ')}` : '相关知识点';
  }

  /**
   * 获取来源匹配原因
   */
  private getSourceMatchReason(src: SourceInformation, keywords: string[]): string {
    const matched = keywords.filter(kw => 
      src.title.includes(kw) || src.description?.includes(kw)
    );
    return matched.length > 0 ? `匹配关键词: ${matched.join(', ')}` : '相关来源';
  }
}

