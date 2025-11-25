import { ChatMessage } from '../llm/types';
import { ChatMessageService } from '../ChatMessageService';
import { DirectAgentConfig } from '../../models/AIRole';
import { OpenAIProvider } from '../llm/OpenAIProvider';

/**
 * 上下文管理服务
 * 负责管理对话历史，实现不同的上下文策略
 */
export class ContextManager {
  private promptManager: any; // 用于生成摘要时使用

  constructor() {
    // 可以注入 PromptManager，但为了简化，暂时不依赖
  }

  /**
   * 获取上下文消息
   * @param conversationId 对话ID
   * @param strategy 上下文策略
   * @param currentQuery 当前查询
   * @returns 消息列表
   */
  async getContextMessages(
    conversationId: string,
    strategy: DirectAgentConfig['contextStrategy'],
    currentQuery: string
  ): Promise<ChatMessage[]> {
    if (!conversationId) {
      return [];
    }

    // 获取历史消息
    const history = await ChatMessageService.getConversationMessages(conversationId, 100, 0);

    if (history.length === 0) {
      return [];
    }

    // 根据策略类型处理
    switch (strategy.type) {
      case 'window':
        return this.applyWindowStrategy(history, strategy);
      
      case 'summary':
        return await this.applySummaryStrategy(history, strategy);
      
      case 'hybrid':
        return await this.applyHybridStrategy(history, strategy, currentQuery);
      
      default:
        return this.applyWindowStrategy(history, strategy);
    }
  }

  /**
   * 窗口策略：保留最近N条消息
   */
  private applyWindowStrategy(history: any[], strategy: DirectAgentConfig['contextStrategy']): ChatMessage[] {
    const maxMessages = strategy.maxMessages || 10;
    const recentMessages = history.slice(-maxMessages);
    return recentMessages.map(msg => this.toMessage(msg));
  }

  /**
   * 摘要策略：旧消息压缩为摘要
   */
  private async applySummaryStrategy(
    history: any[],
    strategy: DirectAgentConfig['contextStrategy']
  ): Promise<ChatMessage[]> {
    const maxMessages = strategy.maxMessages || 10;
    const threshold = strategy.summaryThreshold || maxMessages * 2;

    // 如果消息数量未超过阈值，直接返回
    if (history.length <= threshold) {
      return history.map(msg => this.toMessage(msg));
    }

    // 分离旧消息和最近消息
    const oldMessages = history.slice(0, -maxMessages);
    const recentMessages = history.slice(-maxMessages);

    // 生成摘要
    const summary = await this.generateSummary(oldMessages);

    // 组合摘要和最近消息
    const messages: ChatMessage[] = [];
    
    if (summary) {
      messages.push({
        role: 'system',
        content: `对话历史摘要：${summary}`
      });
    }

    messages.push(...recentMessages.map(msg => this.toMessage(msg)));

    return messages;
  }

  /**
   * 混合策略：结合窗口和Token控制
   */
  private async applyHybridStrategy(
    history: any[],
    strategy: DirectAgentConfig['contextStrategy'],
    currentQuery: string
  ): Promise<ChatMessage[]> {
    const maxTokens = strategy.maxTokens || 4000;
    const maxMessages = strategy.maxMessages || 20;

    const messages: ChatMessage[] = [];
    let tokenCount = 0;
    const queryTokens = this.estimateTokens(currentQuery);

    // 从后往前遍历，保留尽可能多的消息
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const msgTokens = this.estimateTokens(msg.content || msg.query || '');

      // 检查是否超过限制（预留一些空间给当前查询和响应）
      if (tokenCount + msgTokens + queryTokens > maxTokens * 0.8) {
        // 超过限制，对剩余消息生成摘要
        if (i > 0) {
          const remainingMessages = history.slice(0, i);
          const summary = await this.generateSummary(remainingMessages);
          
          if (summary) {
            messages.unshift({
              role: 'system',
              content: `历史对话摘要：${summary}`
            });
          }
        }
        break;
      }

      messages.unshift(this.toMessage(msg));
      tokenCount += msgTokens;

      // 也限制消息数量
      if (messages.length >= maxMessages) {
        // 如果还有更多消息，生成摘要
        if (i > 0) {
          const remainingMessages = history.slice(0, i);
          const summary = await this.generateSummary(remainingMessages);
          
          if (summary) {
            messages.unshift({
              role: 'system',
              content: `历史对话摘要：${summary}`
            });
          }
        }
        break;
      }
    }

    return messages;
  }

  /**
   * 生成摘要
   * @param messages 消息列表
   * @returns 摘要文本
   */
  private async generateSummary(messages: any[]): Promise<string> {
    if (messages.length === 0) {
      return '';
    }

    try {
      // 构建摘要提示词
      const conversationText = messages
        .map(msg => {
          const role = msg.message_type === 'user' ? '用户' : '助手';
          const content = msg.content || msg.query || msg.dify_answer || '';
          return `${role}: ${content}`;
        })
        .join('\n');

      // 如果对话文本太长，截断（避免超出 token 限制）
      const maxLength = 2000; // 大约 500 tokens
      const truncatedText = conversationText.length > maxLength 
        ? conversationText.substring(0, maxLength) + '...'
        : conversationText;

      const summaryPrompt = `请总结以下对话的关键信息，保留重要的上下文和细节。用中文回答，控制在100字以内。

对话内容：
${truncatedText}

摘要：`;

      // 尝试使用环境变量中的 OpenAI API Key 生成摘要
      // 如果没有配置，则返回简化摘要
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        try {
          const provider = new OpenAIProvider(apiKey);
          const summaryMessages: ChatMessage[] = [
            {
              role: 'user',
              content: summaryPrompt
            }
          ];
          
          const response = await provider.chat(summaryMessages, {
            provider: 'openai',
            apiKey,
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
            maxTokens: 200
          });
          
          return response.content || '';
        } catch (error) {
          console.warn('使用 LLM 生成摘要失败，使用简化摘要:', error);
        }
      }
      
      // 降级方案：返回简化的摘要（前200字符）
      const text = conversationText.substring(0, 200);
      return text + (conversationText.length > 200 ? '...' : '');
    } catch (error) {
      console.error('生成摘要失败:', error);
      return '';
    }
  }

  /**
   * Token 估算（简单实现：1 token ≈ 4 chars）
   * @param text 文本
   * @returns Token 数量
   */
  private estimateTokens(text: string): number {
    if (!text) {
      return 0;
    }
    // 简单估算：1 token ≈ 4 个字符（中英文混合）
    return Math.ceil(text.length / 4);
  }

  /**
   * 将数据库记录转换为 ChatMessage 格式
   */
  private toMessage(msg: any): ChatMessage {
    const role = msg.message_type === 'user' ? 'user' : 'assistant';
    const content = msg.content || msg.query || msg.dify_answer || '';

    return {
      role,
      content,
    };
  }
}

