import { createContentConcatenationService } from '@/services/ContentConcatenationService';
import { ChatMessageService } from '@/services/ChatMessageService';
import DifyClient from '@/services/DifyClient';
import { db } from '@/config/database';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ExecuteAiSearchDTO } from '../dto/executeAiSearch.dto';

export class ExecuteAiSearchUseCase {
  async execute(dto: ExecuteAiSearchDTO): Promise<Result<unknown>> {
    try {
      logger.info('执行 AI 搜索', { query: dto.query });

      const processedInputs = await this.processInputs(dto.inputs);
      const result = await DifyClient.aiSearch(dto.query, processedInputs, dto.conversationId ?? '');

      await ChatMessageService.saveDifyChatResponse(result, dto.query, 'ai-search', processedInputs);

      return success(result);
    } catch (error) {
      logger.error('AI 搜索执行失败', { error });
      return failure({
        code: 'AI_SEARCH_FAILED',
        message: error instanceof Error ? error.message : 'AI搜索失败',
        details: error,
      });
    }
  }

  private async processInputs(inputs: Record<string, unknown> = {}) {
    const processedInputs = { ...inputs } as Record<string, unknown>;

    const selectedKnowledgePoints = inputs.selectedKnowledgePoints;
    if (Array.isArray(selectedKnowledgePoints) && selectedKnowledgePoints.length > 0) {
      try {
        const contentService = createContentConcatenationService(db);
        const concatenatedContent = await contentService.buildContextFromSelectedItems(selectedKnowledgePoints);

        processedInputs.knowledgeContext = concatenatedContent.contextString;
        processedInputs.knowledgeContextSummary = concatenatedContent.summary;
        processedInputs.originalSelectedKnowledgePoints = selectedKnowledgePoints;
      } catch (error) {
        logger.error('知识点内容拼接失败', { error });
        processedInputs.knowledgeContextError = error instanceof Error ? error.message : '内容拼接失败';
      }
    }

    return processedInputs;
  }
}

