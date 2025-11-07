import { ChatMessageService } from '@/services/ChatMessageService';
import DifyClient from '@/services/DifyClient';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ExecuteTechStrategyDTO } from '../dto/executeTechStrategy.dto';

export class ExecuteTechStrategyUseCase {
  async execute(dto: ExecuteTechStrategyDTO): Promise<Result<unknown>> {
    try {
      const inputs = dto.inputs?.techPackage || JSON.stringify(dto.inputs);
      const difyInputs = {
        input1: inputs,
        input2: inputs,
        query: inputs,
        techPackage: inputs,
        template: dto.inputs?.template || 'default',
      };

      const result = await DifyClient.techStrategy(difyInputs);

      try {
        await ChatMessageService.saveDifyWorkflowResponse(
          result,
          '技术策略生成',
          'tech-strategy',
          dto.inputs,
          dto.conversationId
        );
      } catch (error) {
        logger.warn('保存技术策略消息失败', { error });
      }

      return success(result);
    } catch (error) {
      logger.error('技术策略执行失败', { error });
      return failure({
        code: 'TECH_STRATEGY_FAILED',
        message: error instanceof Error ? error.message : '技术策略失败',
        details: error,
      });
    }
  }
}

