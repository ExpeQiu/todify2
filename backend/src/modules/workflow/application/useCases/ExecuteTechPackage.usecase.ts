import { ChatMessageService } from '@/services/ChatMessageService';
import DifyClient from '@/services/DifyClient';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ExecuteTechPackageDTO } from '../dto/executeTechPackage.dto';
import { formatAdditionalInformation } from '../../domain/workflowFormatter';

export class ExecuteTechPackageUseCase {
  async execute(dto: ExecuteTechPackageDTO): Promise<Result<unknown>> {
    try {
      const difyInputs = {
        Additional_information: formatAdditionalInformation(dto.inputs),
      };

      const result = await DifyClient.techPackage(difyInputs);

      try {
        const userQuery = dto.inputs?.query || '技术包装请求';
        await ChatMessageService.saveDifyWorkflowResponse(
          result,
          userQuery,
          'tech-package',
          dto.inputs,
          dto.conversationId
        );
      } catch (error) {
        logger.warn('保存技术包装消息失败', { error });
      }

      return success(result);
    } catch (error) {
      logger.error('技术包装执行失败', { error });
      return failure({
        code: 'TECH_PACKAGE_FAILED',
        message: error instanceof Error ? error.message : '技术包装失败',
        details: error,
      });
    }
  }
}

