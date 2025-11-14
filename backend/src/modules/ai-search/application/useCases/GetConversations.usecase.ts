import { AiSearchService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ConversationSummaryView } from '../dto/GetConversations.dto';

export class GetConversationsUseCase {
  constructor(private readonly aiSearchService: AiSearchService) {}

  async execute(): Promise<Result<ConversationSummaryView[]>> {
    try {
      const conversations = await this.aiSearchService.getConversations();

      const formatted = conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        sources: JSON.parse(conv.sources || '[]'),
        messages: [],
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
      }));

      return success(formatted);
    } catch (error) {
      logger.error('获取对话列表失败', { error });
      return failure({
        code: 'GET_CONVERSATIONS_FAILED',
        message: error instanceof Error ? error.message : '获取对话列表失败',
        details: error,
      });
    }
  }
}

