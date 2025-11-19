import { AiSearchService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

export class GetOutputsUseCase {
  constructor(private readonly aiSearchService: AiSearchService) {}

  async execute(conversationId?: string, pageType?: string): Promise<Result<any[]>> {
    try {
      const outputs = await this.aiSearchService.getOutputs(conversationId, pageType);

      const formatted = outputs.map((output) => ({
        id: output.id,
        type: output.type,
        title: output.title,
        content: JSON.parse(output.content || '{}'),
        messageId: output.message_id,
        conversationId: output.conversation_id,
        createdAt: new Date(output.created_at),
      }));

      return success(formatted);
    } catch (error) {
      logger.error('获取输出内容列表失败', { error });
      return failure({
        code: 'GET_OUTPUTS_FAILED',
        message: error instanceof Error ? error.message : '获取输出内容列表失败',
        details: error,
      });
    }
  }
}

