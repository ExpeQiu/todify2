import { agentWorkflowService } from '@/services/AgentWorkflowService';
import type { FieldMappingService } from '@/services/AiSearchService';
import { fieldMappingEngine } from '@/utils/fieldMapping';
import { logger } from '@/shared/lib/logger';

export const resolveWorkflowId = async (): Promise<string | null> => {
  const workflowId = process.env.AI_SEARCH_WORKFLOW_ID || null;
  if (workflowId) {
    return workflowId;
  }

  const workflows = await agentWorkflowService.getAllWorkflows();
  const defaultWorkflow = workflows.find((w) => w.name === '智能工作流');
  return defaultWorkflow?.id || workflows[0]?.id || null;
};

export const mapWorkflowInput = (
  data: any,
  inputMappings?: any[]
) => {
  if (inputMappings && inputMappings.length > 0) {
    const mapped = fieldMappingEngine.mapInputFields(data, inputMappings);
    
    // 确保关键字段始终被保留（即使映射配置中没有配置）
    // 这些字段对于附件传递至关重要
    if (data.sources && Array.isArray(data.sources)) {
      mapped.sources = data.sources;
      logger.info('mapWorkflowInput: 保留 sources 字段', {
        sourcesCount: data.sources.length,
        sources: data.sources.map((s: any) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          hasUrl: !!s.url,
          url: s.url,
        })),
      });
    }
    if (data.files && Array.isArray(data.files)) {
      mapped.files = data.files;
      logger.info('mapWorkflowInput: 保留 files 字段', {
        filesCount: data.files.length,
      });
    }
    if (data.fileList && Array.isArray(data.fileList)) {
      mapped.fileList = data.fileList;
      logger.info('mapWorkflowInput: 保留 fileList 字段', {
        fileListCount: data.fileList.length,
      });
    }
    
    // 确保 query 字段存在（即使映射配置中没有）
    if (!mapped.query && data.query) {
      mapped.query = data.query;
    }
    
    logger.info('mapWorkflowInput: 映射完成', {
      hasInputMappings: true,
      mappedKeys: Object.keys(mapped),
      hasSources: !!mapped.sources,
      sourcesCount: Array.isArray(mapped.sources) ? mapped.sources.length : 0,
      hasFiles: !!mapped.files,
      filesCount: Array.isArray(mapped.files) ? mapped.files.length : 0,
      hasFileList: !!mapped.fileList,
      fileListCount: Array.isArray(mapped.fileList) ? mapped.fileList.length : 0,
    });
    
    return mapped;
  }
  // 如果没有映射配置，直接返回数据，但确保 query 字段存在
  const result = { ...data };
  if (!result.query && data.query) {
    result.query = data.query;
  }
  
  logger.info('mapWorkflowInput: 无映射配置，直接返回', {
    hasInputMappings: false,
    resultKeys: Object.keys(result),
    hasSources: !!result.sources,
    sourcesCount: Array.isArray(result.sources) ? result.sources.length : 0,
    hasFiles: !!result.files,
    filesCount: Array.isArray(result.files) ? result.files.length : 0,
  });
  
  return result;
};

export const extractWorkflowOutput = (
  workflowResult: any,
  outputMappings?: any[]
) => {
  logger.info('开始提取工作流输出', {
    hasWorkflowResult: !!workflowResult,
    workflowResultKeys: workflowResult && typeof workflowResult === 'object' ? Object.keys(workflowResult) : null,
    hasData: !!workflowResult?.data,
    dataKeys: workflowResult?.data && typeof workflowResult.data === 'object' ? Object.keys(workflowResult.data) : null,
    hasOutputMappings: !!outputMappings,
    outputMappingsLength: outputMappings?.length || 0,
    message: workflowResult?.message,
    messageType: typeof workflowResult?.message,
  });
  
  const workflowOutput = workflowResult?.data || workflowResult;
  
  logger.info('工作流输出对象', {
    hasWorkflowOutput: !!workflowOutput,
    workflowOutputKeys: workflowOutput && typeof workflowOutput === 'object' ? Object.keys(workflowOutput) : null,
    hasOutputs: !!workflowOutput?.outputs,
    outputsType: typeof workflowOutput?.outputs,
    outputsKeys: workflowOutput?.outputs && typeof workflowOutput.outputs === 'object' ? Object.keys(workflowOutput.outputs) : null,
  });
  
  // 如果有输出映射配置，使用映射引擎提取
  if (outputMappings && outputMappings.length > 0) {
    logger.info('使用输出映射配置提取', {
      mappingsCount: outputMappings.length,
    });
    const extracted = fieldMappingEngine.extractOutputFields(workflowOutput, outputMappings);
    logger.info('映射引擎提取结果', {
      hasContent: !!extracted.content,
      contentType: typeof extracted.content,
      contentLength: extracted.content && typeof extracted.content === 'string' ? extracted.content.length : null,
      extractedKeys: Object.keys(extracted),
    });
    // 如果提取到了内容，直接返回
    if (extracted.content) {
      return extracted;
    }
  }
  
  // 如果没有映射配置或提取失败，尝试从常见字段中提取
  const outputs = workflowOutput?.outputs || {};
  
  logger.info('尝试从outputs对象提取内容', {
    outputsType: typeof outputs,
    outputsKeys: outputs && typeof outputs === 'object' ? Object.keys(outputs) : null,
    hasText: !!outputs.text,
    textType: typeof outputs.text,
    textLength: outputs.text && typeof outputs.text === 'string' ? outputs.text.length : null,
    hasAnswer: !!outputs.answer,
    answerType: typeof outputs.answer,
    answerLength: outputs.answer && typeof outputs.answer === 'string' ? outputs.answer.length : null,
    hasContent: !!outputs.content,
    contentType: typeof outputs.content,
    contentLength: outputs.content && typeof outputs.content === 'string' ? outputs.content.length : null,
    hasOutput: !!outputs.output,
    outputType: typeof outputs.output,
  });
  
  // 辅助函数：确保内容是字符串
  const ensureString = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    // 如果是对象，尝试提取字符串字段
    if (typeof value === 'object') {
      const str = 
        (value.answer && typeof value.answer === 'string' ? value.answer.trim() : '') ||
        (value.text && typeof value.text === 'string' ? value.text.trim() : '') ||
        (value.content && typeof value.content === 'string' ? value.content.trim() : '') ||
        (value.message && typeof value.message === 'string' ? value.message.trim() : '') ||
        '';
      return str || null;
    }
    return String(value);
  };
  
  const fallbackContent = 
    ensureString(outputs.text) ||
    ensureString(outputs.answer) ||
    ensureString(outputs.content) ||
    ensureString(outputs.output) ||
    (typeof outputs === 'string' && outputs.trim() ? outputs.trim() : null) ||
    (typeof workflowResult?.message === 'string' && workflowResult.message !== '工作流执行完成' 
      ? workflowResult.message.trim() 
      : null);
  
  logger.info('提取结果', {
    hasFallbackContent: !!fallbackContent,
    fallbackContentLength: fallbackContent?.length || 0,
    fallbackContentPreview: fallbackContent ? fallbackContent.substring(0, 100) : null,
  });
  
  if (fallbackContent) {
    return {
      content: fallbackContent,
      metadata: outputs.metadata || {},
    };
  }
  
  logger.warn('未能从工作流输出中提取到内容', {
    workflowResultKeys: workflowResult && typeof workflowResult === 'object' ? Object.keys(workflowResult) : null,
    workflowOutputKeys: workflowOutput && typeof workflowOutput === 'object' ? Object.keys(workflowOutput) : null,
    outputsKeys: outputs && typeof outputs === 'object' ? Object.keys(outputs) : null,
  });
  
  return {};
};

export const ensureFieldMappingConfig = async (
  fieldMappingService: FieldMappingService,
  workflowId: string
) => {
  const config = await fieldMappingService.getFieldMappingConfig(workflowId);
  return config || null;
};

export const formatMessageRecord = (record: any) => ({
  id: record.id,
  role: record.role,
  content: record.content,
  sources: record.sources ? JSON.parse(record.sources) : [],
  outputs: record.outputs ? JSON.parse(record.outputs) : {},
  createdAt: new Date(record.created_at),
});
