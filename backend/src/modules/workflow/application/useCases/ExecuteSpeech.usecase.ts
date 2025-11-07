import { ChatMessageService } from '@/services/ChatMessageService';
import DifyClient from '@/services/DifyClient';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { ExecuteSpeechDTO } from '../dto/executeSpeech.dto';

export class ExecuteSpeechUseCase {
  async execute(dto: ExecuteSpeechDTO): Promise<Result<unknown>> {
    try {
      const inputs = dto.inputs ?? {};
      const speechInputs: Record<string, unknown> = {
        'sys.query': inputs['sys.query'] || inputs.query || '请根据提供的补充信息生成技术发布会稿',
      };

      if (inputs.Additional_information && String(inputs.Additional_information).trim() !== '') {
        speechInputs.Additional_information = inputs.Additional_information;
      } else if (inputs.coreDraft && String(inputs.coreDraft).trim() !== '') {
        speechInputs.Additional_information = inputs.coreDraft;
      }

      const result = await DifyClient.techPublish(speechInputs, dto.conversationId);

      try {
        await ChatMessageService.saveDifyWorkflowResponse(
          result,
          '发布会稿生成',
          'speech-generation',
          inputs,
          dto.conversationId
        );
      } catch (error) {
        logger.warn('保存发布会稿消息失败', { error });
      }

      return success(result);
    } catch (error) {
      logger.error('发布会稿执行失败', { error });
      return failure({
        code: 'SPEECH_GENERATION_FAILED',
        message: error instanceof Error ? error.message : '发布会稿生成失败',
        details: error,
      });
    }
  }
}

