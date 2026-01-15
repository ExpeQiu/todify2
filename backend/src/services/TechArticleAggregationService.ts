import { AiSearchService } from './AiSearchService';
import { agentWorkflowService } from './AgentWorkflowService';
import { logger } from '@/shared/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export interface MultiVersionArticle {
  mediaRelease?: ArticleVersion;
  internalMemo?: ArticleVersion;
  socialMedia?: SocialMediaVersion;
  sourceReferences: SourceReference[];
  metadata: {
    generatedAt: string;
    workflowId?: string;
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

export interface ArticleVersion {
  title: string;
  lead?: string;
  body: ArticleBody;
  conclusion?: string;
}

export interface ArticleBody {
  techBackground?: string;
  coreFeatures?: string;
  techAdvantages?: string;
  applicationScenarios?: string;
  marketSignificance?: string;
}

export interface SocialMediaVersion {
  title: string;
  highlights: string[];
  hashtags: string[];
}

export interface SourceReference {
  type: 'conversation' | 'output';
  id: string;
  pageType: string;
  title: string;
  summary: string;
}

export interface AggregateOptions {
  conversationIds: string[];
  outputIds: string[];
  articleTypes: ('media_release' | 'internal_memo' | 'social_media')[];
  tone?: string;
  targetAudience?: string;
  workflowId?: string;
}

export class TechArticleAggregationService {
  constructor(private readonly aiSearchService: AiSearchService) {}

  /**
   * 聚合多个数据源并生成多版本通稿
   */
  async aggregateAndGenerate(options: AggregateOptions): Promise<MultiVersionArticle> {
    try {
      // 1. 收集所有来源数据
      const sourceData = await this.collectSourceData(
        options.conversationIds,
        options.outputIds
      );

      // 2. 构建工作流输入
      const workflowInput = this.buildWorkflowInput(sourceData, options);

      // 3. 解析工作流ID（从环境变量或配置）
      const workflowId = options.workflowId || process.env.TECH_ARTICLE_WORKFLOW_ID || null;
      if (!workflowId) {
        throw new Error('未配置技术通稿工作流ID，请设置 TECH_ARTICLE_WORKFLOW_ID 环境变量');
      }

      // 4. 调用Dify工作流
      logger.info('调用技术通稿生成工作流', {
        workflowId,
        conversationCount: options.conversationIds.length,
        outputCount: options.outputIds.length,
        articleTypes: options.articleTypes,
      });

      const workflowResult = await agentWorkflowService.executeWorkflow(workflowId, {
        input: workflowInput,
      });

      if (!workflowResult.success || !workflowResult.data) {
        throw new Error(
          workflowResult.message || '工作流执行失败，未返回有效数据'
        );
      }

      // 5. 解析工作流输出
      const outputs = this.parseWorkflowOutput(workflowResult.data);

      // 6. 构建返回结果
      const result: MultiVersionArticle = {
        sourceReferences: sourceData.references,
        metadata: {
          generatedAt: new Date().toISOString(),
          workflowId,
          tokenUsage: this.extractTokenUsage(workflowResult.data),
        },
      };

      // 根据请求的文章类型填充结果
      if (options.articleTypes.includes('media_release') && outputs.mediaRelease) {
        result.mediaRelease = outputs.mediaRelease;
      }
      if (options.articleTypes.includes('internal_memo') && outputs.internalMemo) {
        result.internalMemo = outputs.internalMemo;
      }
      if (options.articleTypes.includes('social_media') && outputs.socialMedia) {
        result.socialMedia = outputs.socialMedia;
      }

      return result;
    } catch (error) {
      logger.error('聚合生成技术通稿失败', { error, options });
      throw error;
    }
  }

  /**
   * 收集来源数据 - 优化版本，并行获取提升性能
   */
  private async collectSourceData(
    conversationIds: string[],
    outputIds: string[]
  ): Promise<{
    conversations: Array<{
      id: string;
      pageType: string;
      title: string;
      messages: Array<{ role: string; content: string }>;
      summary: string;
    }>;
    outputs: Array<{
      id: string;
      pageType: string;
      title: string;
      content: any;
      summary: string;
    }>;
    references: SourceReference[];
  }> {
    const conversations: any[] = [];
    const outputs: any[] = [];
    const references: SourceReference[] = [];

    // 并行获取所有对话数据
    const conversationPromises = conversationIds.map(async (convId) => {
      try {
        const conversation = await this.aiSearchService.getConversation(convId);
        if (!conversation) {
          logger.warn('对话不存在，跳过', { conversationId: convId });
          return null;
        }

        const pageType = conversation.page_type || 'unknown';
        const messages = (conversation.messages || []).map((m: any) => ({
          role: m.role,
          content: m.content,
        }));

        // 生成摘要（取第一条用户消息的前200字）
        const firstUserMessage = messages.find((m: any) => m.role === 'user');
        const summary = firstUserMessage
          ? firstUserMessage.content.substring(0, 200) + (firstUserMessage.content.length > 200 ? '...' : '')
          : '';

        return {
          conversation: {
            id: convId,
            pageType,
            title: conversation.title,
            messages,
            summary,
          },
          reference: {
            type: 'conversation' as const,
            id: convId,
            pageType,
            title: conversation.title,
            summary,
          },
        };
      } catch (error) {
        logger.error('获取对话失败', { conversationId: convId, error });
        return null;
      }
    });

    // 等待所有对话获取完成
    const conversationResults = await Promise.all(conversationPromises);
    conversationResults.forEach((result) => {
      if (result) {
        conversations.push(result.conversation);
        references.push(result.reference);
      }
    });

    // 优化输出数据收集：一次性获取所有outputs后过滤
    if (outputIds.length > 0) {
      try {
        const allOutputs = await this.aiSearchService.getOutputs();
        const outputIdSet = new Set(outputIds);
        
        for (const output of allOutputs) {
          if (!outputIdSet.has(output.id)) continue;
          
          const pageType = output.page_type || 'unknown';
          let content: any;
          try {
            content = typeof output.content === 'string' ? JSON.parse(output.content) : output.content;
          } catch {
            content = output.content;
          }

          // 生成摘要
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          const summary = contentStr.substring(0, 200) + (contentStr.length > 200 ? '...' : '');

          outputs.push({
            id: output.id,
            pageType,
            title: output.title,
            content,
            summary,
          });

          references.push({
            type: 'output',
            id: output.id,
            pageType,
            title: output.title,
            summary,
          });
        }
        
        // 检查是否有未找到的outputs
        const foundIds = new Set(outputs.map(o => o.id));
        outputIds.forEach(id => {
          if (!foundIds.has(id)) {
            logger.warn('输出不存在，跳过', { outputId: id });
          }
        });
      } catch (error) {
        logger.error('批量获取输出失败', { outputIds, error });
      }
    }

    return { conversations, outputs, references };
  }

  /**
   * 构建工作流输入
   */
  private buildWorkflowInput(sourceData: any, options: AggregateOptions): any {
    // 按页面类型分组对话和输出
    const groupedByPageType: Record<string, {
      conversations: any[];
      outputs: any[];
    }> = {};

    sourceData.conversations.forEach((conv: any) => {
      if (!groupedByPageType[conv.pageType]) {
        groupedByPageType[conv.pageType] = { conversations: [], outputs: [] };
      }
      groupedByPageType[conv.pageType].conversations.push(conv);
    });

    sourceData.outputs.forEach((out: any) => {
      if (!groupedByPageType[out.pageType]) {
        groupedByPageType[out.pageType] = { conversations: [], outputs: [] };
      }
      groupedByPageType[out.pageType].outputs.push(out);
    });

    // 构建结构化输入
    return {
      source_conversations: JSON.stringify(sourceData.conversations),
      source_outputs: JSON.stringify(sourceData.outputs),
      grouped_by_page_type: JSON.stringify(groupedByPageType),
      article_types: JSON.stringify(options.articleTypes),
      tone: options.tone || '专业严谨',
      target_audience: options.targetAudience || '媒体记者',
    };
  }

  /**
   * 解析工作流输出
   */
  private parseWorkflowOutput(workflowData: any): {
    mediaRelease?: ArticleVersion;
    internalMemo?: ArticleVersion;
    socialMedia?: SocialMediaVersion;
  } {
    const outputs = workflowData.outputs || workflowData.data?.outputs || {};
    const result: any = {};

    // 解析媒体通稿
    if (outputs.media_release || outputs.mediaRelease) {
      const media = outputs.media_release || outputs.mediaRelease;
      result.mediaRelease = this.parseArticleVersion(media);
    }

    // 解析内部通报
    if (outputs.internal_memo || outputs.internalMemo) {
      const memo = outputs.internal_memo || outputs.internalMemo;
      result.internalMemo = this.parseInternalMemo(memo);
    }

    // 解析社交媒体版本
    if (outputs.social_media || outputs.socialMedia) {
      const social = outputs.social_media || outputs.socialMedia;
      result.socialMedia = {
        title: social.title || '',
        highlights: Array.isArray(social.highlights) ? social.highlights : [],
        hashtags: Array.isArray(social.hashtags) ? social.hashtags : [],
      };
    }

    // 如果输出是字符串格式，尝试解析JSON
    if (typeof outputs === 'string') {
      try {
        const parsed = JSON.parse(outputs);
        return this.parseWorkflowOutput({ outputs: parsed });
      } catch {
        // 忽略解析错误
      }
    }

    return result;
  }

  /**
   * 解析文章版本
   */
  private parseArticleVersion(data: any): ArticleVersion {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // 如果不是JSON，返回基本结构
        return {
          title: data.substring(0, 100),
          body: {
            techBackground: data,
          },
        };
      }
    }

    // 如果data.body是字符串，尝试解析
    let body: ArticleBody = {};
    if (typeof data.body === 'string') {
      body.techBackground = data.body;
    } else if (data.body) {
      body = {
        techBackground: data.body.techBackground || data.body.tech_background,
        coreFeatures: data.body.coreFeatures || data.body.core_features,
        techAdvantages: data.body.techAdvantages || data.body.tech_advantages,
        applicationScenarios: data.body.applicationScenarios || data.body.application_scenarios,
        marketSignificance: data.body.marketSignificance || data.body.market_significance,
      };
    }

    return {
      title: data.title || '',
      lead: data.lead || '',
      body,
      conclusion: data.conclusion || '',
    };
  }

  /**
   * 解析内部通报
   */
  private parseInternalMemo(data: any): ArticleVersion {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return {
          title: data.substring(0, 100),
          body: {
            techBackground: data,
          },
        };
      }
    }

    return {
      title: data.title || '',
      body: {
        techBackground: data.tech_details || data.techDetails || '',
        techAdvantages: data.data_support || data.dataSupport || '',
        marketSignificance: data.competitive_analysis || data.competitiveAnalysis || '',
      },
    };
  }

  /**
   * 提取Token使用量
   */
  private extractTokenUsage(workflowData: any): any {
    const usage = workflowData.usage || workflowData.metadata?.usage;
    if (usage) {
      return {
        prompt: usage.prompt_tokens || usage.promptTokens || 0,
        completion: usage.completion_tokens || usage.completionTokens || 0,
        total: usage.total_tokens || usage.totalTokens || 0,
      };
    }
    return undefined;
  }
}

