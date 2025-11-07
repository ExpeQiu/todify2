import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { db } from '@/config/database';
import { formatApiResponse } from '@/utils/validation';
import { agentWorkflowService } from '@/services/AgentWorkflowService';
import { AiSearchService, FieldMappingService } from '@/services/AiSearchService';
import { fieldMappingEngine } from '@/utils/fieldMapping';
import { FeatureObjectMapping } from '@/types/aiSearch';
import { logger } from '@/shared/lib/logger';
import { validateDTO, ValidationException, formatValidationFailure } from '@/shared/lib/validator';
import { CreateConversationSchema } from '../application/dto/CreateConversation.dto';
import { SendMessageSchema } from '../application/dto/SendMessage.dto';
import { GenerateOutputSchema } from '../application/dto/GenerateOutput.dto';
import { TriggerAgentSchema } from '../application/dto/TriggerAgent.dto';
import { SaveFieldMappingSchema } from '../application/dto/SaveFieldMapping.dto';
import { CreateConversationUseCase } from '../application/useCases/CreateConversation.usecase';
import { GetConversationsUseCase } from '../application/useCases/GetConversations.usecase';
import { GetConversationDetailUseCase } from '../application/useCases/GetConversationDetail.usecase';
import { SendMessageUseCase } from '../application/useCases/SendMessage.usecase';
import { GenerateOutputUseCase } from '../application/useCases/GenerateOutput.usecase';
import { GetOutputsUseCase } from '../application/useCases/GetOutputs.usecase';
import { TriggerAgentUseCase } from '../application/useCases/TriggerAgent.usecase';
import { GetFieldMappingConfigUseCase } from '../application/useCases/GetFieldMappingConfig.usecase';
import { SaveFieldMappingConfigUseCase } from '../application/useCases/SaveFieldMappingConfig.usecase';

const router = Router();

const resolveWorkflowId = async (): Promise<string | null> => {
  const workflowId = process.env.AI_SEARCH_WORKFLOW_ID || null;

  if (workflowId) {
    return workflowId;
  }

  const workflows = await agentWorkflowService.getAllWorkflows();
  const defaultWorkflow = workflows.find((w) => w.name === '智能工作流');
  return defaultWorkflow?.id || workflows[0]?.id || null;
};

// 配置multer用于文件上传
const upload = multer({
  dest: 'uploads/ai-search/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 允许的文件类型
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

// 确保上传目录存在
const uploadDir = 'uploads/ai-search/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 初始化服务
const aiSearchService = new AiSearchService();
const fieldMappingService = new FieldMappingService();
const createConversationUseCase = new CreateConversationUseCase(aiSearchService);
const getConversationsUseCase = new GetConversationsUseCase(aiSearchService);
const getConversationDetailUseCase = new GetConversationDetailUseCase(aiSearchService);
const sendMessageUseCase = new SendMessageUseCase(aiSearchService, fieldMappingService);
const generateOutputUseCase = new GenerateOutputUseCase(aiSearchService);
const getOutputsUseCase = new GetOutputsUseCase(aiSearchService);
const triggerAgentUseCase = new TriggerAgentUseCase(aiSearchService, fieldMappingService);
const getFieldMappingConfigUseCase = new GetFieldMappingConfigUseCase(fieldMappingService);
const saveFieldMappingConfigUseCase = new SaveFieldMappingConfigUseCase(fieldMappingService);
// 延迟初始化标记，避免在数据库未连接时初始化
let tablesInitialized = false;

// 中间件：确保表已初始化
const ensureTablesInitialized = async (req: Request, res: Response, next: any) => {
  if (!tablesInitialized) {
    try {
      await aiSearchService.initializeTables();
      tablesInitialized = true;
      logger.info('AI问答数据库表初始化成功（延迟初始化）');
    } catch (error) {
      logger.error('延迟初始化AI问答数据库表失败:', error);
    }
  }
  next();
};

/**
 * 获取工作流配置
 * GET /api/v1/ai-search/workflow
 */
router.get('/workflow', async (req: Request, res: Response) => {
  try {
    // 从配置或数据库获取工作流ID
    // 这里先尝试从环境变量或配置获取
    const workflowId = process.env.AI_SEARCH_WORKFLOW_ID || null;
    
    if (workflowId) {
      return res.json(
        formatApiResponse(true, { workflowId }, '获取工作流配置成功')
      );
    }
    
    // 如果没有配置，返回默认工作流
    const workflows = await agentWorkflowService.getAllWorkflows();
    const defaultWorkflow = workflows.find((w) => w.name === '智能工作流');
    const workflowIdToReturn = defaultWorkflow?.id || workflows[0]?.id || null;
    
    res.json(
      formatApiResponse(
        true,
        { workflowId: workflowIdToReturn },
        '获取工作流配置成功'
      )
    );
  } catch (error) {
    logger.error('获取工作流配置失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取工作流配置失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 文件上传
 * POST /api/v1/ai-search/upload
 */
router.post(
  '/upload',
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json(
          formatApiResponse(false, null, '没有上传文件')
        );
      }

      const uploadedFiles = files.map((file) => ({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: file.originalname,
        url: `/uploads/ai-search/${file.filename}`,
        type: file.mimetype,
        size: file.size,
      }));

      res.json(
        formatApiResponse(true, uploadedFiles, '文件上传成功')
      );
    } catch (error) {
      logger.error('文件上传失败:', error);
      res.status(500).json(
        formatApiResponse(
          false,
          null,
          '文件上传失败',
          error instanceof Error ? error.message : '未知错误'
        )
      );
    }
  }
);

/**
 * 创建对话
 * POST /api/v1/ai-search/conversations
 */
router.post('/conversations', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const dto = validateDTO(CreateConversationSchema, req.body);
    const result = await createConversationUseCase.execute(dto);

    if (!result.success) {
      return res.status(500).json(
        formatApiResponse(false, null, '创建对话失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '创建对话成功'));
  } catch (error) {
    if (error instanceof ValidationException) {
      const failure = formatValidationFailure(error);
      return res.status(400).json(failure);
    }

    logger.error('创建对话失败', { error });
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '创建对话失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 获取对话列表
 * GET /api/v1/ai-search/conversations
 */
router.get('/conversations', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const result = await getConversationsUseCase.execute();

    if (!result.success) {
      return res.status(500).json(
        formatApiResponse(false, null, '获取对话列表失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '获取对话列表成功'));
  } catch (error) {
    logger.error('获取对话列表失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取对话列表失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 获取对话详情
 * GET /api/v1/ai-search/conversations/:id
 */
router.get('/conversations/:id', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getConversationDetailUseCase.execute(id);

    if (!result.success) {
      const status = result.error.code === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
      return res.status(status).json(
        formatApiResponse(false, null, result.error.code === 'CONVERSATION_NOT_FOUND' ? '对话不存在' : '获取对话详情失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '获取对话详情成功'));
  } catch (error) {
    logger.error('获取对话详情失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取对话详情失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 发送消息
 * POST /api/v1/ai-search/conversations/:id/messages
 */
router.post(
  '/conversations/:id/messages',
  ensureTablesInitialized,
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let sourcesValue = req.body.sources;
      if (typeof sourcesValue === 'string') {
        try {
          sourcesValue = JSON.parse(sourcesValue);
        } catch (parseError) {
          logger.warn('解析sources失败，使用原始值', { parseError });
          sourcesValue = undefined;
        }
      }

      const body = {
        content: req.body.content,
        sources: Array.isArray(sourcesValue) ? sourcesValue : undefined,
      };
      const files = req.files as Express.Multer.File[];

      const dto = validateDTO(SendMessageSchema, body);
      const result = await sendMessageUseCase.execute({
        conversationId: id,
        content: dto.content,
        sources: dto.sources,
        files,
      });

      if (!result.success) {
        return res.status(500).json(
          formatApiResponse(false, null, '发送消息失败', result.error.message)
        );
      }

      res.json(
        formatApiResponse(
          true,
          result.value,
          result.value.error ? '发送消息成功，但工作流执行失败' : '发送消息成功'
        )
      );
    } catch (error) {
      if (error instanceof ValidationException) {
        const failure = formatValidationFailure(error);
        return res.status(400).json(failure);
      }

      logger.error('发送消息失败:', error);
      res.status(500).json(
        formatApiResponse(
          false,
          null,
          '发送消息失败',
          error instanceof Error ? error.message : '未知错误'
        )
      );
    }
  }
);

/**
 * 手动触发子Agent
 * POST /api/v1/ai-search/conversations/:id/agents
 */
router.post('/conversations/:id/agents', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawBody = req.body;
    const dto = validateDTO(TriggerAgentSchema, rawBody);
    const result = await triggerAgentUseCase.execute(id, dto);

    if (!result.success) {
      if (result.error.code === 'CONVERSATION_NOT_FOUND') {
        return res.status(404).json(formatApiResponse(false, null, '对话不存在', result.error.message));
      }
      if (result.error.code === 'WORKFLOW_NOT_FOUND') {
        return res.status(500).json(formatApiResponse(false, null, '未找到可用的工作流配置', result.error.message));
      }
      if (result.error.code === 'MAPPING_NOT_FOUND') {
        return res.status(400).json(formatApiResponse(false, null, '尚未配置字段映射，请先完成字段映射配置', result.error.message));
      }
      if (result.error.code === 'FEATURE_NOT_FOUND') {
        return res.status(400).json(formatApiResponse(false, null, result.error.message));
      }

      return res.status(500).json(formatApiResponse(false, null, '子Agent执行失败', result.error.message));
    }

    res.json(formatApiResponse(true, result.value, '子Agent执行完成'));
  } catch (error) {
    if (error instanceof ValidationException) {
      const failure = formatValidationFailure(error);
      return res.status(400).json(failure);
    }

    logger.error('子Agent执行失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '子Agent执行失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 删除对话
 * DELETE /api/v1/ai-search/conversations/:id
 */
router.delete('/conversations/:id', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await aiSearchService.deleteConversation(id);
    res.json(
      formatApiResponse(true, null, '删除对话成功')
    );
  } catch (error) {
    logger.error('删除对话失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '删除对话失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 生成输出内容
 * POST /api/v1/ai-search/outputs
 */
router.post('/outputs', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const dto = validateDTO(GenerateOutputSchema, req.body);
    const result = await generateOutputUseCase.execute(dto);

    if (!result.success) {
      return res.status(500).json(
        formatApiResponse(false, null, '生成输出内容失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '生成输出内容成功'));
  } catch (error) {
    if (error instanceof ValidationException) {
      const failure = formatValidationFailure(error);
      return res.status(400).json(failure);
    }

    logger.error('生成输出内容失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '生成输出内容失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 获取输出内容列表
 * GET /api/v1/ai-search/outputs
 */
router.get('/outputs', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.query;
    const result = await getOutputsUseCase.execute(conversationId as string | undefined);

    if (!result.success) {
      return res.status(500).json(
        formatApiResponse(false, null, '获取输出内容列表失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '获取输出内容列表成功'));
  } catch (error) {
    logger.error('获取输出内容列表失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取输出内容列表失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 获取字段映射配置
 * GET /api/v1/ai-search/field-mappings/:workflowId
 */
router.get('/field-mappings/:workflowId', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const result = await getFieldMappingConfigUseCase.execute(workflowId);

    if (!result.success) {
      const status = result.error.code === 'FIELD_MAPPING_NOT_FOUND' ? 404 : 500;
      return res.status(status).json(
        formatApiResponse(false, null, result.error.code === 'FIELD_MAPPING_NOT_FOUND' ? '字段映射配置不存在' : '获取字段映射配置失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '获取字段映射配置成功'));
  } catch (error) {
    logger.error('获取字段映射配置失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取字段映射配置失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 保存字段映射配置
 * POST /api/v1/ai-search/field-mappings/:workflowId
 */
router.post('/field-mappings/:workflowId', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const dto = validateDTO(SaveFieldMappingSchema, req.body);
    const result = await saveFieldMappingConfigUseCase.execute(workflowId, dto);

    if (!result.success) {
      const status = result.error.code === 'WORKFLOW_ID_MISMATCH' ? 400 : 500;
      return res.status(status).json(
        formatApiResponse(false, null, '保存字段映射配置失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '保存字段映射配置成功'));
  } catch (error) {
    if (error instanceof ValidationException) {
      const failure = formatValidationFailure(error);
      return res.status(400).json(failure);
    }

    logger.error('保存字段映射配置失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '保存字段映射配置失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

export default router;
