import { AiSearchService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { CreateConversationDTO } from '../dto/CreateConversation.dto';

export type ConversationView = {
  id: string;
  title: string;
  sources: any[];
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
};

export class CreateConversationUseCase {
  constructor(private readonly aiSearchService: AiSearchService) {}

  async execute(dto: CreateConversationDTO): Promise<Result<ConversationView>> {
    try {
      const record = await this.aiSearchService.createConversation(
        dto.title || `对话 ${new Date().toLocaleString()}`,
        dto.sources || []
      );

      const conversation: ConversationView = {
        id: record.id,
        title: record.title,
        sources: JSON.parse(record.sources || '[]'),
        messages: [],
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      };

      return success(conversation);
    } catch (error) {
      logger.error('创建对话失败', { error });
      return failure({
        code: 'CREATE_CONVERSATION_FAILED',
        message: error instanceof Error ? error.message : '创建对话失败',
        details: error,
      });
    }
  }
}

