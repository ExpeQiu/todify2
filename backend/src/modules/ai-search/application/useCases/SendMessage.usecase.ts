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

        // 辅助函数：确保内容是字符串
        const ensureStringContent = (content: any): string => {
          if (!content) return '';
          if (typeof content === 'string') {
            return content.trim();
          }
          // 如果是对象，尝试提取字符串字段
          if (typeof content === 'object') {
            // 尝试从常见字段中提取
            const str = 
              (content.answer && typeof content.answer === 'string' ? content.answer.trim() : '') ||
              (content.text && typeof content.text === 'string' ? content.text.trim() : '') ||
              (content.content && typeof content.content === 'string' ? content.content.trim() : '') ||
              (content.message && typeof content.message === 'string' ? content.message.trim() : '') ||
              '';
            if (str) return str;
            // 如果都没有，字符串化（但只取前1000字符）
            try {
              const jsonStr = JSON.stringify(content, null, 2);
              return jsonStr.length > 1000 ? jsonStr.substring(0, 1000) + '...' : jsonStr;
            } catch {
              return String(content);
            }
          }
          return String(content);
        };

        // 尝试从多个来源提取内容
        let aiContent = ensureStringContent(extractedOutput.content);
        
        logger.info('提取工作流输出', {
          workflowId: finalWorkflowId,
          hasExtractedContent: !!aiContent,
          extractedContentLength: aiContent?.length || 0,
          extractedContentType: typeof extractedOutput.content,
          workflowResultKeys: Object.keys(workflowResult || {}),
          dataOutputsKeys: Object.keys(workflowResult?.data?.outputs || {}),
        });
        
        // 如果提取的内容为空，尝试从工作流结果中提取
        if (!aiContent || aiContent.trim() === '') {
          const outputs = workflowResult?.data?.outputs || {};
          
          // 按优先级尝试多个字段
          aiContent = 
            ensureStringContent(outputs.text) ||
            ensureStringContent(outputs.answer) ||
            ensureStringContent(outputs.content) ||
            ensureStringContent(outputs.output) ||
            '';
          
          // 如果outputs.output是对象，尝试从中提取
          if (!aiContent && outputs.output && typeof outputs.output === 'object') {
            aiContent = 
              ensureStringContent(outputs.output.answer) ||
              ensureStringContent(outputs.output.text) ||
              ensureStringContent(outputs.output.content) ||
              '';
          }
        }
        
        // 如果还是没有内容，尝试使用 message 字段（但排除默认消息）
        if (!aiContent || aiContent.trim() === '') {
          const message = workflowResult?.message;
          if (message && typeof message === 'string' && message.trim() && message.trim() !== '工作流执行完成') {
            aiContent = message.trim();
          }
        }
        
        // 记录最终提取的内容
        logger.info('最终提取的AI内容', {
          workflowId: finalWorkflowId,
          hasContent: !!aiContent,
          contentLength: aiContent?.length || 0,
          contentPreview: aiContent ? aiContent.substring(0, 100) : null,
        });
        
        // 最后使用默认消息
        if (!aiContent || aiContent.trim() === '') {
          aiContent = '工作流执行完成';
        }

        // 确保 extractedOutput.content 也是字符串（用于保存到 outputs 字段）
        const cleanExtractedOutput = {
          ...extractedOutput,
          content: aiContent, // 使用提取的字符串内容
        };

        // 记录保存的消息内容
        logger.info('保存AI消息', {
          workflowId: finalWorkflowId,
          content: aiContent,
          contentLength: aiContent.length,
          outputsContent: cleanExtractedOutput.content,
          outputsKeys: Object.keys(cleanExtractedOutput),
        });

        const aiMessageRecord = await this.aiSearchService.sendMessage(
          params.conversationId,
          'assistant',
          aiContent,
          params.sources || [],
          [],
          cleanExtractedOutput
        );
        
        logger.info('AI消息已保存', {
          messageId: aiMessageRecord.id,
          content: aiMessageRecord.content,
          contentLength: aiMessageRecord.content?.length || 0,
        });

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
