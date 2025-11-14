import { ChatMessageService } from '@/services/ChatMessageService';
import DifyClient from '@/services/DifyClient';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ExecuteTechPublishDTO } from '../dto/executeTechPublish.dto';

export class ExecuteTechPublishUseCase {
  async execute(dto: ExecuteTechPublishDTO): Promise<Result<unknown>> {
    try {
      const result = await DifyClient.techPublish(dto.inputs, dto.conversationId);

      try {
        await ChatMessageService.saveDifyWorkflowResponse(
          result,
          '技术发布生成',
          'tech-publish',
          dto.inputs,
          dto.conversationId
        );
      } catch (error) {
        logger.warn('保存技术发布消息失败', { error });
      }

      return success(result);
    } catch (error) {
      logger.error('技术发布执行失败', { error });
      return failure({
        code: 'TECH_PUBLISH_FAILED',
        message: error instanceof Error ? error.message : '技术发布失败',
        details: error,
      });
    }
  }
}

