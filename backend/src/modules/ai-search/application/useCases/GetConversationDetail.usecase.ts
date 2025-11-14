import { AiSearchService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ConversationDetailView, MessageView } from '../dto/GetConversationDetail.dto';

export class GetConversationDetailUseCase {
  constructor(private readonly aiSearchService: AiSearchService) {}

  async execute(
    id: string,
    options?: {
      limit?: number;
      before?: string;
    }
  ): Promise<Result<ConversationDetailView>> {
    try {
      const conversation = await this.aiSearchService.getConversation(id, options);

      if (!conversation) {
        return failure({
          code: 'CONVERSATION_NOT_FOUND',
          message: '对话不存在',
        });
      }

      const messages: MessageView[] = (conversation.messages || []).map((message: any) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        sources: message.sources || [],
        outputs: message.outputs || {},
        createdAt: message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt),
      }));

      const detail: ConversationDetailView = {
        id: conversation.id,
        title: conversation.title,
        sources: conversation.sources || [],
        messages,
        createdAt: conversation.createdAt instanceof Date ? conversation.createdAt : new Date(conversation.createdAt),
        updatedAt: conversation.updatedAt instanceof Date ? conversation.updatedAt : new Date(conversation.updatedAt),
        hasMoreMessages: Boolean(conversation.hasMoreMessages),
        nextCursor: conversation.nextCursor || undefined,
      };

      return success(detail);
    } catch (error) {
      logger.error('获取对话详情失败', { error });
      return failure({
        code: 'GET_CONVERSATION_FAILED',
        message: error instanceof Error ? error.message : '获取对话详情失败',
        details: error,
      });
    }
  }
}

