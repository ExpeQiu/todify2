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
import { buildConversationContext } from '../utils/context';

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

      const requestedWorkflowId = dto.workflowId;
      const workflowId = requestedWorkflowId || await resolveWorkflowId();
      if (!workflowId) {
        return failure({
          code: 'WORKFLOW_NOT_FOUND',
          message: '未找到可用的工作流配置',
        });
      }

      let targetSources = Array.isArray(dto.sources) ? dto.sources : conversation.sources || [];

      const baseMappingConfig = await ensureFieldMappingConfig(this.fieldMappingService, workflowId);
      if (!baseMappingConfig) {
        const message =
          requestedWorkflowId && requestedWorkflowId === workflowId
            ? `所选工作流(${workflowId})尚未配置字段映射`
            : '尚未配置字段映射，请先完成字段映射配置';
        return failure({
          code: 'MAPPING_NOT_FOUND',
          message,
        });
      }

      const featureConfig = baseMappingConfig.featureObjects?.find(
        (f: FeatureObjectMapping) => f.featureType === dto.featureType
      );

      // 调试日志：检查功能对象配置
      logger.info('查找功能对象配置', {
        featureType: dto.featureType,
        allFeatureObjects: baseMappingConfig.featureObjects?.map((f: any) => ({
          featureType: f.featureType,
          workflowId: f.workflowId,
          pageType: f.pageType,
        })),
        foundConfig: featureConfig ? {
          featureType: featureConfig.featureType,
          workflowId: featureConfig.workflowId,
        } : null,
      });

      if (!featureConfig) {
        return failure({
          code: 'FEATURE_NOT_FOUND',
          message: `未找到功能对象映射配置: ${dto.featureType}`,
        });
      }

      // 优先使用 agentId（AI角色ID），如果没有再使用 workflowId
      // agentId 用于直接调用 AI 角色，workflowId 用于通过工作流调用
      const configuredAgentId = (featureConfig as any).agentId;
      const configuredWorkflowId = featureConfig.workflowId;
      
      // 如果配置了 agentId，使用它；否则使用 workflowId
      // 注意：只有当 agentId 是不同的角色时才使用它，避免使用当前工作流
      let targetWorkflowId: string;
      if (configuredAgentId && configuredAgentId !== workflowId) {
        targetWorkflowId = configuredAgentId;
        logger.info('使用配置的 AI 角色', {
          featureType: dto.featureType,
          agentId: configuredAgentId,
        });
      } else if (configuredWorkflowId && configuredWorkflowId !== workflowId) {
        targetWorkflowId = configuredWorkflowId;
        logger.info('使用配置的工作流', {
          featureType: dto.featureType,
          workflowId: configuredWorkflowId,
        });
      } else {
        targetWorkflowId = workflowId;
        logger.warn('功能对象未配置专属 agentId 或 workflowId，将使用当前工作流', {
          featureType: dto.featureType,
          fallbackWorkflowId: workflowId,
          configuredAgentId,
          configuredWorkflowId,
        });
      }
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

      const conversationData = this.buildConversationData(
        conversation,
        conversationQuery,
        targetSources,
        dto
      );

      const workflowInput = mapWorkflowInput(conversationData, effectiveInputMappings);

      // 判断 targetWorkflowId 是 AI 角色 ID 还是工作流 ID
      // AI 角色 ID 可能以 'role_' 或 'ai-role-' 开头，工作流 ID 以 'wf_' 开头
      const isRoleId = targetWorkflowId.startsWith('role_') || targetWorkflowId.startsWith('ai-role-');
      
      let workflowResult;
      if (isRoleId) {
        // 直接调用 AI 角色
        logger.info('检测到 AI 角色 ID，直接调用角色', { roleId: targetWorkflowId, featureType: dto.featureType });
        workflowResult = await agentWorkflowService.executeRole(targetWorkflowId, workflowInput);
      } else {
        // 通过工作流调用
        logger.info('检测到工作流 ID，通过工作流调用', { workflowId: targetWorkflowId, featureType: dto.featureType });
        workflowResult = await agentWorkflowService.executeWorkflow(
          targetWorkflowId,
          { input: workflowInput }
        );
      }

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
          context: {
            historySize: conversationData.history?.length || 0,
            historyLimit: conversationData.historyLimit,
            summary: conversationData.summary,
            keyPhrases: conversationData.keyPhrases,
          },
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
    const lastUserMessage = [...sortedMessages].reverse().find((m) => m.role === 'user');
    // 过滤掉无效的助手消息内容（如"工作流执行完成"）
    const invalidContents = ['工作流执行完成', '子Agent已执行', '触发子Agent'];
    const lastValidAssistantMessage = [...sortedMessages].reverse().find(
      (m) => m.role === 'assistant' && 
             m.content && 
             !invalidContents.some(invalid => m.content.startsWith(invalid))
    );

    // 优先使用用户消息作为输入（避免使用之前失败的助手回复）
    if (!baseContent && lastUserMessage) {
      baseContent = lastUserMessage.content;
    }

    // 如果没有用户消息，使用有效的助手消息
    if (!baseContent && lastValidAssistantMessage) {
      baseContent = lastValidAssistantMessage.content;
    }

    return baseContent;
  }

  /**
   * 构建对话数据，包含根据contextWindowSize截取的上下文历史
   * 此方法适用于所有工具（五看、三定、技术矩阵、传播、展具与视频、翻译等）
   * @param conversation 对话对象
   * @param conversationQuery 对话查询内容
   * @param targetSources 目标来源
   * @param dto 触发Agent的DTO，包含contextWindowSize参数
   * @returns 包含历史上下文的对话数据
   */
  private buildConversationData(
    conversation: any,
    conversationQuery: string,
    targetSources: any[],
    dto: TriggerAgentDTO
  ) {
    const sortedMessages = [...(conversation.messages || [])];
    // 根据contextWindowSize构建上下文（最近N条消息或全部历史）
    // contextWindowSize: 5/10/20 表示最近N条消息，0 表示全部历史
    const context = buildConversationContext(sortedMessages, {
      historyLimit: dto.contextWindowSize,
    });

    // 获取最后一条助手消息和用户消息，用于字段映射
    const lastAssistantMessage = [...sortedMessages].reverse().find((m) => m.role === 'assistant');
    const lastUserMessage = [...sortedMessages].reverse().find((m) => m.role === 'user');

    return {
      query: conversationQuery,
      sources: targetSources,
      files: [],
      history: context.history, // 根据contextWindowSize截取的历史消息
      historyLimit: context.historyLimit,
      historySize: context.historySize,
      summary: context.summary,
      keyPhrases: context.keyPhrases,
      // 子Agent（如五看、三定等）每次调用都是独立的分析任务
      // 不需要传递 conversationId，让 Dify 创建新的对话
      conversationId: '',
      featureType: dto.featureType,
      lastAssistantMessage: lastAssistantMessage || undefined,
      lastUserMessage: lastUserMessage || undefined,
    };
  }
}
