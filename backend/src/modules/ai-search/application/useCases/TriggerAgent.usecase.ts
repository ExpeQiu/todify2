import { agentWorkflowService } from '@/services/AgentWorkflowService';
import { AiSearchService, FieldMappingService } from '@/services/AiSearchService';
import { FeatureObjectMapping } from '@/types/aiSearch';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { TriggerAgentDTO } from '../dto/TriggerAgent.dto';
import {
  resolveWorkflowId,
  mapWorkflowInput,
  extractWorkflowOutput,
  ensureFieldMappingConfig,
  formatMessageRecord,
} from '../utils/workflow';

export class TriggerAgentUseCase {
  constructor(
    private readonly aiSearchService: AiSearchService,
    private readonly fieldMappingService: FieldMappingService,
  ) {}

  async execute(conversationId: string, dto: TriggerAgentDTO): Promise<Result<any>> {
    try {
      const conversation = await this.aiSearchService.getConversation(conversationId);
      if (!conversation) {
        return failure({
          code: 'CONVERSATION_NOT_FOUND',
          message: '对话不存在',
        });
      }

      const workflowId = await resolveWorkflowId();
      if (!workflowId) {
        return failure({
          code: 'WORKFLOW_NOT_FOUND',
          message: '未找到可用的工作流配置',
        });
      }

      let targetSources = Array.isArray(dto.sources) ? dto.sources : conversation.sources || [];

      const baseMappingConfig = await ensureFieldMappingConfig(this.fieldMappingService, workflowId);
      if (!baseMappingConfig) {
        return failure({
          code: 'MAPPING_NOT_FOUND',
          message: '尚未配置字段映射，请先完成字段映射配置',
        });
      }

      const featureConfig = baseMappingConfig.featureObjects?.find(
        (f: FeatureObjectMapping) => f.featureType === dto.featureType
      );

      if (!featureConfig) {
        return failure({
          code: 'FEATURE_NOT_FOUND',
          message: `未找到功能对象映射配置: ${dto.featureType}`,
        });
      }

      const targetWorkflowId = featureConfig.workflowId || workflowId;
      const targetMappingConfig = targetWorkflowId === workflowId
        ? baseMappingConfig
        : await ensureFieldMappingConfig(this.fieldMappingService, targetWorkflowId);

      const effectiveInputMappings = featureConfig.inputMappings?.length
        ? featureConfig.inputMappings
        : targetMappingConfig?.inputMappings || [];

      const effectiveOutputMappings = featureConfig.outputMappings?.length
        ? featureConfig.outputMappings
        : targetMappingConfig?.outputMappings || [];

      const baseContent = await this.resolveBaseContent(conversation, dto);
      const conversationQuery = baseContent || `触发子Agent：${dto.featureType}`;

      const conversationData = this.buildConversationData(conversation, conversationQuery, targetSources, dto);

      const workflowInput = mapWorkflowInput(conversationData, effectiveInputMappings);

      const workflowResult = await agentWorkflowService.executeWorkflow(
        targetWorkflowId,
        { input: workflowInput }
      );

      const extractedOutput = extractWorkflowOutput(workflowResult, effectiveOutputMappings);

      const aiContent = extractedOutput.content
        || workflowResult.message
        || `子Agent ${dto.featureType} 已执行`;

      const messageOutputs = {
        ...extractedOutput,
        metadata: {
          ...(extractedOutput.metadata || {}),
          featureType: dto.featureType,
          workflowId: targetWorkflowId,
          sourceMessageId: dto.messageId || null,
          executionId: (workflowResult as any).executionId || null,
          triggeredAt: new Date().toISOString(),
          workflowInput,
          baseContent: conversationQuery,
        },
      };

      const aiMessage = await this.aiSearchService.sendMessage(
        conversationId,
        'assistant',
        aiContent,
        targetSources,
        [],
        messageOutputs
      );

      return success({
        message: formatMessageRecord(aiMessage),
      });
    } catch (error) {
      logger.error('子Agent执行失败', { error });
      return failure({
        code: 'TRIGGER_AGENT_FAILED',
        message: error instanceof Error ? error.message : '子Agent执行失败',
        details: error,
      });
    }
  }

  private async resolveBaseContent(conversation: any, dto: TriggerAgentDTO) {
    let baseContent = dto.content;

    if (!baseContent && dto.messageId) {
      const messageRecord = await this.aiSearchService.getMessageById(dto.messageId);
      baseContent = messageRecord?.content;
    }

    const sortedMessages = [...(conversation.messages || [])];
    const lastAssistantMessage = [...sortedMessages].reverse().find((m) => m.role === 'assistant');
    const lastUserMessage = [...sortedMessages].reverse().find((m) => m.role === 'user');

    if (!baseContent && lastAssistantMessage) {
      baseContent = lastAssistantMessage.content;
    }

    if (!baseContent && lastUserMessage) {
      baseContent = lastUserMessage.content;
    }

    return baseContent;
  }

  private buildConversationData(
    conversation: any,
    conversationQuery: string,
    targetSources: any[],
    dto: TriggerAgentDTO
  ) {
    const sortedMessages = [...(conversation.messages || [])];
    const conversationHistory = sortedMessages.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      sources: item.sources,
      outputs: item.outputs,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    }));

    const lastAssistantMessage = [...sortedMessages].reverse().find((m) => m.role === 'assistant');
    const lastUserMessage = [...sortedMessages].reverse().find((m) => m.role === 'user');

    return {
      query: conversationQuery,
      sources: targetSources,
      files: [],
      history: conversationHistory,
      lastAssistantMessage,
      lastUserMessage,
      conversationId: conversation.id,
      featureType: dto.featureType,
    };
  }
}
