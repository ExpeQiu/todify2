import DifyClient from '@/services/DifyClient';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ExecuteCoreDraftDTO } from '../dto/executeCoreDraft.dto';

export class ExecuteCoreDraftUseCase {
  async execute(dto: ExecuteCoreDraftDTO): Promise<Result<unknown>> {
    try {
      const promotionStrategy = dto.inputs?.promotionStrategy;
      const formattedInputs = {
        input3: typeof promotionStrategy === 'string' ? promotionStrategy : JSON.stringify(promotionStrategy),
        input: typeof promotionStrategy === 'string' ? promotionStrategy : JSON.stringify(promotionStrategy),
        promotionStrategy,
        template: dto.inputs?.template || 'default',
      };

      const result = await DifyClient.coreDraft(formattedInputs);

      return success(result);
    } catch (error) {
      logger.error('核心稿件执行失败', { error });
      return failure({
        code: 'CORE_DRAFT_FAILED',
        message: error instanceof Error ? error.message : '核心稿件生成失败',
        details: error,
      });
    }
  }
}

