import { agentWorkflowService } from '@/services/AgentWorkflowService';
import { AiSearchService, FieldMappingService } from '@/services/AiSearchService';
import { fileService } from '@/services/FileService';
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

        const conversationData = await this.buildConversationData({
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

        // 获取对话的 Dify conversation_id（如果存在），用于多轮对话
        const difyConversationId = conversationRecord?.difyConversationId || null;
        
        logger.info('准备发送消息到Dify工作流', {
          本地对话ID: params.conversationId,
          DifyConversationId: difyConversationId || '未设置（首次对话，Dify将返回新的conversation_id）',
        });
        
        // 将 Dify conversation_id 添加到 workflowInput 中，这样 Agent 节点可以获取到
        if (difyConversationId) {
          workflowInput.conversationId = difyConversationId;
          logger.info('已设置Dify conversation_id到工作流输入', { difyConversationId });
        } else {
          logger.info('首次对话，未设置Dify conversation_id，Dify将创建新的对话');
        }

        const workflowResult = await agentWorkflowService.executeWorkflow(finalWorkflowId, {
          input: workflowInput,
        });

        // 从工作流执行结果中提取 Dify conversation_id
        // Agent 节点的输出中可能包含 conversation_id
        let newDifyConversationId: string | null = null;
        
        // 尝试从工作流执行结果的数据中提取 conversation_id
        // 首先检查 outputs 中是否包含 conversation_id
        if (workflowResult?.data?.outputs) {
          const outputs = workflowResult.data.outputs;
          if (outputs.conversation_id && typeof outputs.conversation_id === 'string') {
            newDifyConversationId = outputs.conversation_id;
          } else if (outputs.output && typeof outputs.output === 'object' && outputs.output.conversation_id) {
            newDifyConversationId = outputs.output.conversation_id;
          } else if (outputs.metadata && typeof outputs.metadata === 'object' && outputs.metadata.conversation_id) {
            newDifyConversationId = outputs.metadata.conversation_id;
          }
        }
        
        // 如果还没有找到，尝试从 extractedOutput 中提取
        const extractedOutput = extractWorkflowOutput(workflowResult, mappingConfig.outputMappings);
        if (!newDifyConversationId && extractedOutput && typeof extractedOutput === 'object') {
          const outputObj = extractedOutput as any;
          if (outputObj.conversation_id && typeof outputObj.conversation_id === 'string') {
            newDifyConversationId = outputObj.conversation_id;
          }
        }

        // 如果获取到了新的 conversation_id，保存到对话记录中
        if (newDifyConversationId) {
          await this.aiSearchService.updateDifyConversationId(params.conversationId, newDifyConversationId);
          logger.info('✅ 已更新对话的 Dify conversation_id', {
            本地对话ID: params.conversationId,
            DifyConversationId: newDifyConversationId,
            是否首次对话: !difyConversationId,
          });
        } else {
          logger.warn('⚠️ 未从Dify工作流响应中提取到conversation_id', {
            本地对话ID: params.conversationId,
            之前是否有DifyConversationId: !!difyConversationId,
          });
        }

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

  /**
   * 获取功能类型的中文标签
   */
  private getFeatureLabel(featureType: string): string {
    const labelMap: Record<string, string> = {
      'five-view-analysis': '五看分析',
      'three-fix-analysis': '三定分析',
      'tech-matrix': '技术矩阵',
      'propagation-strategy': '传播策略',
      'exhibition-video': '展具与视频',
      'translation': '翻译',
      'ai-dialog': 'AI对话',
    };
    return labelMap[featureType] || '子Agent分析';
  }

  private async buildConversationData(
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

    // 从上传的文件中提取markdown内容
    let fileMarkdownContents: string[] = [];
    if (params.files && params.files.length > 0) {
      try {
        // 通过文件名查找文件记录，获取markdown内容
        for (const file of params.files) {
          try {
            // 通过原始文件名查找文件记录
            const allFiles = await fileService.getAllFiles({
              status: 'active',
            });
            const fileRecord = allFiles.find(
              (f) => f.original_name === file.originalname || f.stored_name === file.filename
            );
            
            if (fileRecord && fileRecord.metadata) {
              const metadata = typeof fileRecord.metadata === 'string' 
                ? JSON.parse(fileRecord.metadata) 
                : fileRecord.metadata;
              
              if (metadata.markdownContent) {
                fileMarkdownContents.push(`【${fileRecord.original_name}】\n${metadata.markdownContent}`);
                logger.info('从文件记录中提取markdown内容', {
                  fileName: fileRecord.original_name,
                  markdownLength: metadata.markdownContent.length,
                });
              }
            }
          } catch (error) {
            logger.warn('提取文件markdown内容失败', {
              fileName: file.originalname,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        logger.warn('批量提取文件markdown内容失败', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 判断是否是第一次对话（对话不存在或没有历史消息）
    const isFirstMessage = !params.conversation || 
                          !params.conversation.messages || 
                          params.conversation.messages.length === 0;
    
    // 提取附加信息：外部来源的文本内容和文件的markdown内容
    let additionalContext = '';
    
    const textContents: string[] = [];
    
    // 只在第一次对话时，提取外部来源的文本内容（description）
    if (isFirstMessage) {
      const externalTextSources = effectiveSources.filter((s: any) => 
        s.type === 'external' && s.description && s.description.trim()
      );
      
      externalTextSources.forEach((source: any) => {
        if (source.description && source.description.trim()) {
          const title = source.title || '附加信息';
          textContents.push(`【${title}】\n${source.description.trim()}`);
        }
      });
    }
    
    // 文件的markdown内容总是添加（无论是否第一次对话）
    if (fileMarkdownContents.length > 0) {
      textContents.push(...fileMarkdownContents);
    }
    
    if (textContents.length > 0) {
      additionalContext = '\n\n=== 附加信息（文件内容） ===\n' + textContents.join('\n\n---\n\n');
      logger.info('提取附加信息（外部来源和文件markdown）', {
        isFirstMessage,
        filesCount: fileMarkdownContents.length,
        totalTextLength: additionalContext.length,
      });
    }

    // 将附加信息合并到 query 中
    // 文件的markdown内容总是添加，外部来源的文本内容仅在第一次对话时添加
    let finalQuery = params.content;
    if (additionalContext) {
      finalQuery = params.content + additionalContext;
      logger.info('合并附加信息到查询内容', {
        isFirstMessage,
        originalLength: params.content.length,
        additionalLength: additionalContext.length,
        finalLength: finalQuery.length,
      });
    }

    // 检查上一条消息是否是子Agent（工具箱）生成的内容
    // 主Agent和子Agent交叉对话的逻辑：
    // 1. 主对话使用同一个 dify_conversation_id 保持多轮对话
    // 2. 子Agent（五看、三定等）处理上下文窗口内容，生成分析结果
    // 3. 当用户继续主对话时，如果上一条是子Agent的输出，则将其作为上下文传递给主Agent
    let toolOutputContext = '';
    if (!isFirstMessage && context.history && context.history.length > 0) {
      // 找到最后一条助手消息
      const lastAssistantMessage = [...context.history]
        .reverse()
        .find((msg: any) => msg.role === 'assistant');
      
      // 检查最后一条助手消息是否是子Agent的输出（hasOutputs 为 true 表示是工具生成的）
      if (lastAssistantMessage && lastAssistantMessage.hasOutputs) {
        // 获取工具类型标签
        const featureType = (params.conversation?.messages || [])
          .find((m: any) => m.id === lastAssistantMessage.id)?.outputs?.metadata?.featureType;
        const toolLabel = featureType ? this.getFeatureLabel(featureType) : '子Agent分析';
        
        // 将子Agent的输出作为上下文
        const contentPreview = lastAssistantMessage.content.length > 2000
          ? lastAssistantMessage.content.substring(0, 2000) + '\n...(内容已截断)'
          : lastAssistantMessage.content;
        
        toolOutputContext = `\n\n=== ${toolLabel}结果（请参考以下内容继续对话）===\n${contentPreview}`;
        
        logger.info('检测到上一条消息是子Agent输出，将其作为上下文', {
          messageId: lastAssistantMessage.id,
          featureType: featureType || 'unknown',
          toolLabel,
          contentLength: lastAssistantMessage.content.length,
          truncated: lastAssistantMessage.content.length > 2000,
        });
      }
    }
    
    // 将子Agent输出上下文合并到 query 中
    if (toolOutputContext) {
      finalQuery = finalQuery + toolOutputContext;
      logger.info('合并子Agent输出到查询内容', {
        originalLength: params.content.length,
        contextLength: toolOutputContext.length,
        finalLength: finalQuery.length,
      });
    }

    return {
      query: finalQuery,
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
      // 注意：使用 Dify 的 conversation_id，不是本地对话ID
      // 首次对话时为空，Dify 会返回新的 conversation_id
      conversationId: params.conversation?.difyConversationId || '',
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
