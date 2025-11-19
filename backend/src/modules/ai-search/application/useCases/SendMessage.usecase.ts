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
import { buildConversationContext } from '../utils/context';

export interface SendMessageResult {
  userMessage: any;
  aiMessage?: any;
  error?: string;
  errorDetail?: string;
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
    contextWindowSize?: number;
    workflowId?: string;
    fileList?: string;
    knowledgeBaseNames?: string;
  }): Promise<Result<SendMessageResult>> {
    try {
      const userMessageRecord = await this.aiSearchService.sendMessage(
        params.conversationId,
        'user',
        params.content,
        params.sources || [],
        params.files || []
      );

      const conversationRecord = await this.aiSearchService.getConversation(params.conversationId);

      try {
        const requestedWorkflowId = params.workflowId;
        const finalWorkflowId = requestedWorkflowId || await resolveWorkflowId();

        if (!finalWorkflowId) {
          return success({
            userMessage: formatMessageRecord(userMessageRecord),
            error: '未找到可用的工作流配置',
          });
        }

        const mappingConfig = await ensureFieldMappingConfig(this.fieldMappingService, finalWorkflowId);

        if (!mappingConfig) {
          const message =
            requestedWorkflowId && requestedWorkflowId === finalWorkflowId
              ? `所选工作流(${finalWorkflowId})尚未配置字段映射`
              : '尚未配置字段映射，请先完成字段映射配置';
          return success({
            userMessage: formatMessageRecord(userMessageRecord),
            error: message,
            errorDetail: '请在字段映射配置中为该工作流完成输入输出映射',
          });
        }

        const conversationData = this.buildConversationData({
          conversation: conversationRecord,
          content: params.content,
          sources: params.sources,
          files: params.files,
          contextWindowSize: params.contextWindowSize,
          workflowId: finalWorkflowId,
          fileList: params.fileList,
          knowledgeBaseNames: params.knowledgeBaseNames,
        });
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
      } catch (workflowError: any) {
        logger.error('工作流执行失败', { workflowError });
        return success({
          userMessage: formatMessageRecord(userMessageRecord),
          error: '工作流执行失败，请稍后重试',
          errorDetail: workflowError?.message || String(workflowError),
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
      conversation: any | null;
      content: string;
      sources?: any[];
      files?: Express.Multer.File[];
      contextWindowSize?: number;
      workflowId?: string;
      fileList?: string;
      knowledgeBaseNames?: string;
    }
  ) {
    const conversationSources = params.conversation?.sources || [];
    const effectiveSources =
      Array.isArray(params.sources) && params.sources.length > 0
        ? params.sources
        : conversationSources;
    const context = buildConversationContext(params.conversation?.messages || [], {
      historyLimit: params.contextWindowSize,
    });

    // 解析文件列表和知识库名称（从逗号分隔的字符串转换为数组）
    const fileListArray = params.fileList
      ? params.fileList.split(',').map((name) => name.trim()).filter((name) => name.length > 0)
      : [];
    const knowledgeBaseNamesArray = params.knowledgeBaseNames
      ? params.knowledgeBaseNames.split(',').map((name) => name.trim()).filter((name) => name.length > 0)
      : [];

    return {
      query: params.content,
      summary: context.summary,
      keyPhrases: context.keyPhrases,
      sources: effectiveSources,
      files:
        params.files?.map((f) => ({
          name: f.originalname,
          url: `/uploads/ai-search/${f.filename}`,
          type: f.mimetype,
        })) || [],
      fileList: fileListArray, // 文件列表数组
      knowledgeBaseNames: knowledgeBaseNamesArray, // 知识库名称数组
      conversationId: params.conversation?.id,
      history: context.history,
      historySize: context.historySize,
      historyLimit: context.historyLimit,
      metadata: {
        contextGeneratedAt: new Date().toISOString(),
        workflowId: params.workflowId,
      },
    };
  }
}
