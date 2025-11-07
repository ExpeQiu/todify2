import { ChatMessageService } from '@/services/ChatMessageService';
import DifyClient from '@/services/DifyClient';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ExecuteTechArticleDTO } from '../dto/executeTechArticle.dto';

export class ExecuteTechArticleUseCase {
  async execute(dto: ExecuteTechArticleDTO): Promise<Result<unknown>> {
    try {
      const inputs = dto.inputs ?? {};
      const content = `${inputs.techTopic || ''}。${inputs.tech_content || ''}。车型：${inputs.vehicle_model || ''}。核心技术：${inputs.Highlight_tech || ''}。关联技术：${inputs.Associate_tech || ''}`;

      const difyInputs = { input: content };
      const result = await DifyClient.techArticle(difyInputs);

      try {
        await ChatMessageService.saveDifyWorkflowResponse(
          result,
          '技术通稿生成',
          'tech-article',
          inputs,
          dto.conversationId
        );
      } catch (error) {
        logger.warn('保存技术通稿消息失败', { error });
      }

      return success(result);
    } catch (error) {
      logger.error('技术通稿执行失败', { error });
      return failure({
        code: 'TECH_ARTICLE_FAILED',
        message: error instanceof Error ? error.message : '技术通稿生成失败',
        details: error,
      });
    }
  }
}

