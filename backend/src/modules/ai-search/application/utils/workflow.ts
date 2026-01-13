import { agentWorkflowService } from '@/services/AgentWorkflowService';
import type { FieldMappingService } from '@/services/AiSearchService';
import { fieldMappingEngine } from '@/utils/fieldMapping';
import { logger } from '@/shared/lib/logger';
import { aiRoleModel } from '@/models';
import type { FieldMappingConfig } from '@/types/aiSearch';

export const resolveWorkflowId = async (pageType?: string): Promise<string | null> => {
  // 如果是技术包装页面，优先使用主控 AI 角色
  if (pageType === 'tech-package') {
    const techPackageRoleId = 'independent-page-tech-package';
    const role = await aiRoleModel.getById(techPackageRoleId);
    if (role && role.enabled) {
      logger.info('技术包装页面使用主控 AI 角色', { roleId: techPackageRoleId });
      return techPackageRoleId;
    }
  }

  // 检查环境变量
  const workflowId = process.env.AI_SEARCH_WORKFLOW_ID || null;
  if (workflowId) {
    // 检查是否是 AI 角色 ID
    const isRoleId = workflowId.startsWith('role_') || workflowId.startsWith('ai-role-') || workflowId.startsWith('independent-page-');
    if (isRoleId) {
      const role = await aiRoleModel.getById(workflowId);
      if (role && role.enabled) {
        logger.info('使用环境变量指定的 AI 角色', { roleId: workflowId });
        return workflowId;
      }
    } else {
      // 是工作流 ID，直接返回
      return workflowId;
    }
  }

  // 尝试从工作流中查找
  const workflows = await agentWorkflowService.getAllWorkflows() as any[];
  const defaultWorkflow = workflows.find((w: any) => w.name === '智能工作流');
  const foundWorkflowId = defaultWorkflow?.id || workflows[0]?.id || null;
  
  // 如果找不到工作流，尝试使用技术包装页面的默认 AI 角色
  if (!foundWorkflowId) {
    const techPackageRoleId = 'independent-page-tech-package';
    const role = await aiRoleModel.getById(techPackageRoleId);
    if (role && role.enabled) {
      logger.info('未找到工作流，使用技术包装页面默认 AI 角色', { roleId: techPackageRoleId });
      return techPackageRoleId;
    }
  }
  
  return foundWorkflowId;
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

/**
 * 为AI角色创建默认字段映射配置
 */
const createDefaultMappingForAIRole = async (
  fieldMappingService: FieldMappingService,
  roleId: string
): Promise<FieldMappingConfig | null> => {
  try {
    // 获取AI角色信息
    const role = await aiRoleModel.getById(roleId);
    if (!role) {
      logger.warn('AI角色不存在，无法创建默认字段映射配置', { roleId });
      return null;
    }

    // 解析配置以获取输入字段
    // 支持 Direct Agent 和 Dify 两种类型
    let inputFields: Array<{ variable: string; label: string; type: string; required?: boolean }> = [];
    
    if (role.provider === 'direct-agent' && role.agentConfig) {
      // Direct Agent 类型：从工具参数中提取输入字段
      // 对于主控 Agent，工具参数会通过 query 传递
      // 这里使用默认的 query 映射
      inputFields = [
        {
          variable: 'query',
          label: '用户查询',
          type: 'string',
          required: true
        }
      ];
    } else if (role.difyConfig) {
      // Dify 类型：从 Dify 配置中获取输入字段
      try {
        const difyConfig = typeof role.difyConfig === 'string' 
          ? JSON.parse(role.difyConfig) 
          : role.difyConfig;
        inputFields = difyConfig.inputFields || [];
      } catch (error) {
        logger.warn('解析Dify配置失败，使用默认字段映射', { roleId, error });
      }
    }

    // 创建默认输入映射
    const inputMappings = inputFields.length > 0
      ? inputFields.map((field) => {
          // 根据字段名智能匹配
          const fieldNameLower = field.variable.toLowerCase();
          let sourceField = 'query'; // 默认映射到query
          
          if (fieldNameLower.includes('query') || fieldNameLower.includes('question') || fieldNameLower.includes('input')) {
            sourceField = 'query';
          } else if (fieldNameLower.includes('source') || fieldNameLower.includes('knowledge')) {
            sourceField = 'sources';
          } else if (fieldNameLower.includes('file')) {
            sourceField = 'files';
          } else if (fieldNameLower.includes('history') || fieldNameLower.includes('context')) {
            sourceField = 'history';
          }

          return {
            workflowInputName: field.variable,
            sourceType: 'field' as const,
            sourceField,
          };
        })
      : [
          // 如果没有输入字段配置，使用默认映射
          {
            workflowInputName: 'query',
            sourceType: 'field' as const,
            sourceField: 'query',
          },
        ];

    // 创建默认输出映射
    const outputMappings = [
      {
        workflowOutputName: 'answer',
        targetField: 'content',
        extractExpression: 'output.answer || output.text || output.content || output.output',
      },
    ];

    const defaultConfig: FieldMappingConfig = {
      workflowId: roleId,
      inputMappings,
      outputMappings,
    };

    // 保存默认配置
    await fieldMappingService.saveFieldMappingConfig(roleId, defaultConfig);
    logger.info('已为AI角色创建默认字段映射配置', { 
      roleId, 
      roleName: role.name,
      inputMappingsCount: inputMappings.length,
      outputMappingsCount: outputMappings.length,
    });

    return defaultConfig;
  } catch (error) {
    logger.error('为AI角色创建默认字段映射配置失败', { roleId, error });
    return null;
  }
};

export const ensureFieldMappingConfig = async (
  fieldMappingService: FieldMappingService,
  workflowId: string
): Promise<FieldMappingConfig | null> => {
  // 先尝试获取现有配置
  const config = await fieldMappingService.getFieldMappingConfig(workflowId);
  if (config) {
    return config;
  }

  // 如果找不到配置，检查是否是AI角色ID
  // 支持多种格式：role_*, ai-role-*, independent-page-*
  const isRoleId = workflowId.startsWith('role_') || 
                   workflowId.startsWith('ai-role-') || 
                   workflowId.startsWith('independent-page-') ||
                   workflowId.startsWith('tech-') ||
                   workflowId.startsWith('scene-') ||
                   workflowId.startsWith('market-') ||
                   workflowId.startsWith('content-');
  
  if (isRoleId) {
    logger.info('检测到AI角色ID，尝试创建默认字段映射配置', { workflowId });
    return await createDefaultMappingForAIRole(fieldMappingService, workflowId);
  }

  return null;
};

export const formatMessageRecord = (record: any) => ({
  id: record.id,
  role: record.role,
  content: record.content,
  sources: record.sources ? JSON.parse(record.sources) : [],
  outputs: record.outputs ? JSON.parse(record.outputs) : {},
  createdAt: new Date(record.created_at),
});
