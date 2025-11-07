import { agentWorkflowService } from '@/services/AgentWorkflowService';
import { AiSearchService, FieldMappingService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import {
  resolveWorkflowId,
  mapWorkflowInput,
  extractWorkflowOutput,
  ensureFieldMappingConfig,
  formatMessageRecord,
} from '../utils/workflow';

export interface SendMessageResult {
  userMessage: any;
  aiMessage?: any;
  error?: string;
}

export class SendMessageUseCase {
  constructor(
    private readonly aiSearchService: AiSearchService,
    private readonly fieldMappingService: FieldMappingService,
  ) {}

  async execute(params: {
    conversationId: string;
    content: string;
    sources?: any[];
    files?: Express.Multer.File[];
  }): Promise<Result<SendMessageResult>> {
    try {
      const userMessageRecord = await this.aiSearchService.sendMessage(
        params.conversationId,
        'user',
        params.content,
        params.sources || [],
        params.files || []
      );

      try {
        const finalWorkflowId = await resolveWorkflowId();

        if (!finalWorkflowId) {
          return success({
            userMessage: formatMessageRecord(userMessageRecord),
            error: '未找到可用的工作流配置',
          });
        }

        const mappingConfig = await ensureFieldMappingConfig(this.fieldMappingService, finalWorkflowId);

        if (!mappingConfig) {
          return success({
            userMessage: formatMessageRecord(userMessageRecord),
            error: '尚未配置字段映射，请先完成字段映射配置',
          });
        }

        const conversationData = this.buildConversationData(params, params.files);
        const workflowInput = mapWorkflowInput(conversationData, mappingConfig.inputMappings);

        const workflowResult = await agentWorkflowService.executeWorkflow(finalWorkflowId, {
          input: workflowInput,
        });

        const extractedOutput = extractWorkflowOutput(workflowResult, mappingConfig.outputMappings);

        const aiContent = extractedOutput.content
          || workflowResult.message
          || '工作流执行完成';

        const aiMessageRecord = await this.aiSearchService.sendMessage(
          params.conversationId,
          'assistant',
          aiContent,
          params.sources || [],
          [],
          extractedOutput
        );

        return success({
          userMessage: formatMessageRecord(userMessageRecord),
          aiMessage: formatMessageRecord(aiMessageRecord),
        });
      } catch (workflowError) {
        logger.error('工作流执行失败', { workflowError });
        return success({
          userMessage: formatMessageRecord(userMessageRecord),
          error: '工作流执行失败，请稍后重试',
        });
      }
    } catch (error) {
      logger.error('发送消息失败', { error });
      return failure({
        code: 'SEND_MESSAGE_FAILED',
        message: error instanceof Error ? error.message : '发送消息失败',
        details: error,
      });
    }
  }

  private buildConversationData(
    params: {
      content: string;
      sources?: any[];
    },
    files?: Express.Multer.File[]
  ) {
    return {
      query: params.content,
      sources: params.sources || [],
      files: files?.map((f) => ({
        name: f.originalname,
        url: `/uploads/ai-search/${f.filename}`,
        type: f.mimetype,
      })) || [],
    };
  }
}
