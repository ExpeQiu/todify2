import { SourceInformation } from './sourceService';
import { ConversationRecord } from './chatHistoryService';
import { Message } from '../types/aiSearch';
import { KnowledgePoint } from '../types/knowledgePoint';
import { aiSearchService } from './aiSearchService';

/**
 * AI上下文构建器配置
 */
export interface AIContextBuilderConfig {
  /** 最大token数（估算） */
  maxTokens?: number;
  /** 是否包含对话历史 */
  includeConversationHistory?: boolean;
  /** 对话历史窗口大小（最近N条消息，0表示全部） */
  conversationWindowSize?: number;
  /** 是否包含项目资源摘要 */
  includeProjectResources?: boolean;
}

/**
 * AI上下文构建器
 * 提供统一的上下文组装逻辑
 */
export class AIContextBuilder {
  private projectId: number;
  private selectedSourceIds: string[] = [];
  private config: Required<AIContextBuilderConfig>;
  private sources: SourceInformation[] = [];
  private knowledgePoints: KnowledgePoint[] = [];
  private conversations: ConversationRecord[] = [];
  private conversationMessages: Message[] = [];

  constructor(
    projectId: number,
    config: AIContextBuilderConfig = {}
  ) {
    this.projectId = projectId;
    this.config = {
      maxTokens: config.maxTokens ?? 4000,
      includeConversationHistory: config.includeConversationHistory ?? false,
      conversationWindowSize: config.conversationWindowSize ?? 10,
      includeProjectResources: config.includeProjectResources ?? false,
    };
  }

  /**
   * 设置选中的来源ID
   */
  withSources(sourceIds: string[]): this {
    this.selectedSourceIds = sourceIds;
    return this;
  }

  /**
   * 设置来源信息列表
   */
  setSources(sources: SourceInformation[]): this {
    this.sources = sources;
    return this;
  }

  /**
   * 设置知识点列表
   */
  setKnowledgePoints(knowledgePoints: KnowledgePoint[]): this {
    this.knowledgePoints = knowledgePoints;
    return this;
  }

  /**
   * 设置对话记录列表
   */
  setConversations(conversations: ConversationRecord[]): this {
    this.conversations = conversations;
    return this;
  }

  /**
   * 设置对话消息列表
   */
  setConversationMessages(messages: Message[]): this {
    this.conversationMessages = messages;
    return this;
  }

  /**
   * 配置是否包含对话历史
   */
  withConversationHistory(include: boolean, windowSize?: number): this {
    this.config.includeConversationHistory = include;
    if (windowSize !== undefined) {
      this.config.conversationWindowSize = windowSize;
    }
    return this;
  }

  /**
   * 配置最大token数
   */
  withMaxTokens(tokens: number): this {
    this.config.maxTokens = tokens;
    return this;
  }

  /**
   * 配置是否包含项目资源摘要
   */
  withProjectResources(include: boolean): this {
    this.config.includeProjectResources = include;
    return this;
  }

  /**
   * 构建上下文字符串
   */
  async build(): Promise<string> {
    const parts: string[] = [];

    // 1. 添加选中的来源内容
    if (this.selectedSourceIds.length > 0) {
      const selectedSources = this.sources.filter(s => 
        this.selectedSourceIds.includes(s.source_id || '')
      );
      
      if (selectedSources.length > 0) {
        const sourcesContent = await this.buildSourcesContent(selectedSources);
        if (sourcesContent) {
          parts.push(sourcesContent);
        }
      }
    }

    // 2. 添加项目资源摘要（如果启用）
    if (this.config.includeProjectResources) {
      const resourcesSummary = this.buildProjectResourcesSummary();
      if (resourcesSummary) {
        parts.push(resourcesSummary);
      }
    }

    // 3. 添加对话历史（如果启用）
    if (this.config.includeConversationHistory && this.conversationMessages.length > 0) {
      const historyContent = this.buildConversationHistory();
      if (historyContent) {
        parts.push(historyContent);
      }
    }

    // 4. 合并并截断到最大token数
    const fullContext = parts.join('\n\n');
    return this.truncateToTokenLimit(fullContext);
  }

  /**
   * 构建来源内容
   */
  private async buildSourcesContent(sources: SourceInformation[]): Promise<string> {
    const sourceParts: string[] = [];

    for (const source of sources) {
      let content = `### ${source.title || '未命名来源'}\n`;
      
      if (source.description) {
        content += `${source.description}\n`;
      }

      // 如果是知识库来源，尝试获取详细内容
      if (source.type === 'knowledge_base' && source.source_id?.startsWith('public_kb_')) {
        try {
          // 这里可以调用知识库API获取详细内容
          // 暂时使用description
        } catch (error) {
          console.warn('获取知识库详细内容失败:', error);
        }
      }

      sourceParts.push(content);
    }

    if (sourceParts.length === 0) {
      return '';
    }

    return `## 参考来源\n\n${sourceParts.join('\n')}`;
  }

  /**
   * 构建项目资源摘要
   */
  private buildProjectResourcesSummary(): string {
    const summaryParts: string[] = [];

    if (this.knowledgePoints.length > 0) {
      const kpNames = this.knowledgePoints
        .slice(0, 10)
        .map(kp => kp.title || '未命名知识点')
        .join('、');
      summaryParts.push(`已关联的知识点：${kpNames}${this.knowledgePoints.length > 10 ? '...' : ''}`);
    }

    const fileSources = this.sources.filter(s => {
      const url = s.url || '';
      return url.includes('/uploads/') || 
             url.includes('/api/ai-search/files/') ||
             /\.(pdf|doc|docx|txt|md)$/i.test(url);
    });

    if (fileSources.length > 0) {
      const fileNames = fileSources
        .slice(0, 5)
        .map(f => f.title || '未命名文件')
        .join('、');
      summaryParts.push(`已上传的文件：${fileNames}${fileSources.length > 5 ? '...' : ''}`);
    }

    if (summaryParts.length === 0) {
      return '';
    }

    return `## 项目资源摘要\n\n${summaryParts.join('\n')}`;
  }

  /**
   * 构建对话历史
   */
  private buildConversationHistory(): string {
    if (this.conversationMessages.length === 0) {
      return '';
    }

    let messages = [...this.conversationMessages];

    // 根据窗口大小截取消息
    if (this.config.conversationWindowSize > 0) {
      messages = messages.slice(-this.config.conversationWindowSize);
    }

    const historyParts = messages.map(msg => {
      const role = msg.role === 'user' ? '用户' : '助手';
      const content = msg.content || '';
      return `${role}: ${content}`;
    });

    return `## 对话历史\n\n${historyParts.join('\n\n')}`;
  }

  /**
   * 估算文本的token数（简单估算：1 token ≈ 2 中文字符）
   */
  private estimateTokens(text: string): number {
    // 简单估算：中文字符按2字符=1token，英文按4字符=1token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 2 + englishChars / 4);
  }

  /**
   * 截断文本到最大token数
   */
  private truncateToTokenLimit(text: string): string {
    const estimatedTokens = this.estimateTokens(text);
    
    if (estimatedTokens <= this.config.maxTokens) {
      return text;
    }

    // 需要截断
    const ratio = this.config.maxTokens / estimatedTokens;
    const targetLength = Math.floor(text.length * ratio);
    
    // 尝试在句子边界截断
    const truncated = text.substring(0, targetLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('。'),
      truncated.lastIndexOf('！'),
      truncated.lastIndexOf('？'),
      truncated.lastIndexOf('\n')
    );

    if (lastSentenceEnd > targetLength * 0.8) {
      return truncated.substring(0, lastSentenceEnd + 1) + '\n\n...（内容已截断）';
    }

    return truncated + '...（内容已截断）';
  }

  /**
   * 构建工作流输入对象
   */
  async buildWorkflowInput(userQuery: string): Promise<any> {
    const context = await this.build();
    
    const input: any = {
      query: userQuery,
    };

    // 如果有上下文，添加到输入中
    if (context) {
      input.context = context;
      // 也可以作为单独的字段
      input.original_context = context;
    }

    // 添加来源信息（用于追踪）
    if (this.selectedSourceIds.length > 0) {
      const selectedSources = this.sources.filter(s => 
        this.selectedSourceIds.includes(s.source_id || '')
      );
      input.sources = selectedSources.map(s => ({
        id: s.source_id,
        title: s.title,
        type: s.type,
      }));
    }

    return input;
  }

  /**
   * 静态方法：快速构建上下文
   */
  static async buildContext(
    projectId: number,
    options: {
      sourceIds?: string[];
      sources?: SourceInformation[];
      knowledgePoints?: KnowledgePoint[];
      conversationMessages?: Message[];
      maxTokens?: number;
      includeHistory?: boolean;
      historyWindowSize?: number;
    }
  ): Promise<string> {
    const builder = new AIContextBuilder(projectId, {
      maxTokens: options.maxTokens,
      includeConversationHistory: options.includeHistory,
      conversationWindowSize: options.historyWindowSize,
    });

    if (options.sourceIds) {
      builder.withSources(options.sourceIds);
    }
    if (options.sources) {
      builder.setSources(options.sources);
    }
    if (options.knowledgePoints) {
      builder.setKnowledgePoints(options.knowledgePoints);
    }
    if (options.conversationMessages) {
      builder.setConversationMessages(options.conversationMessages);
    }

    return builder.build();
  }
}
