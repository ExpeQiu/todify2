import { AiSearchService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { GenerateOutputDTO } from '../dto/GenerateOutput.dto';

export class GenerateOutputUseCase {
  constructor(private readonly aiSearchService: AiSearchService) {}

  async execute(dto: GenerateOutputDTO): Promise<Result<any>> {
    try {
      const record = await this.aiSearchService.generateOutput(
        dto.type,
        dto.conversationId,
        dto.messageId,
        dto.content,
        dto.title,
        dto.pageType
      );

      return success({
        id: record.id,
        type: record.type,
        title: record.title,
        content: JSON.parse(record.content || '{}'),
        messageId: record.message_id,
        conversationId: record.conversation_id,
        createdAt: new Date(record.created_at),
      });
    } catch (error) {
      logger.error('生成输出内容失败', { error });
      return failure({
        code: 'GENERATE_OUTPUT_FAILED',
        message: error instanceof Error ? error.message : '生成输出内容失败',
        details: error,
      });
    }
  }
}

