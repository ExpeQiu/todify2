import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { db } from '@/config/database';
import { formatApiResponse } from '@/utils/validation';
import { agentWorkflowService } from '@/services/AgentWorkflowService';
import { AiSearchService, FieldMappingService } from '@/services/AiSearchService';
import { fileService } from '@/services/FileService';
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
import { GetAllFieldMappingConfigsUseCase } from '../application/useCases/GetAllFieldMappingConfigs.usecase';
import { DeleteFieldMappingConfigUseCase } from '../application/useCases/DeleteFieldMappingConfig.usecase';

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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ai-search/');
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名，但保留原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
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
const getAllFieldMappingConfigsUseCase = new GetAllFieldMappingConfigsUseCase(fieldMappingService);
const deleteFieldMappingConfigUseCase = new DeleteFieldMappingConfigUseCase(fieldMappingService);
// 延迟初始化标记，避免在数据库未连接时初始化
let tablesInitialized = false;

// 初始化文件表
const initializeFileTable = async () => {
  try {
    await fileService.initializeTable();
  } catch (error) {
    logger.warn('文件表初始化失败，将在首次使用时重试:', error);
  }
};

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
 * GET /api/v1/ai-search/workflow?pageType=tech-package|press-release
 */
router.get('/workflow', async (req: Request, res: Response) => {
  try {
    const pageType = req.query.pageType as string | undefined; // 'tech-package' | 'press-release'
    const workflows = await agentWorkflowService.getAllWorkflows();
    
    // 根据页面类型选择不同的环境变量或默认工作流
    let workflowIdFromEnv: string | null = null;
    if (pageType === 'press-release') {
      workflowIdFromEnv = process.env.PRESS_RELEASE_WORKFLOW_ID || process.env.AI_SEARCH_WORKFLOW_ID || null;
    } else {
      workflowIdFromEnv = process.env.AI_SEARCH_WORKFLOW_ID || null;
    }

    let resolvedWorkflowId: string | null = null;

    if (workflowIdFromEnv) {
      const matched = workflows.find((workflow) => workflow.id === workflowIdFromEnv);
      if (matched) {
        resolvedWorkflowId = matched.id;
      } else {
        logger.warn('工作流ID指定的工作流不存在，已自动回退', {
          workflowId: workflowIdFromEnv,
          pageType,
        });
      }
    }

    if (!resolvedWorkflowId) {
      // 根据页面类型选择默认工作流名称
      const defaultWorkflowName = pageType === 'press-release' ? '发布会稿工作流' : '智能工作流';
      const defaultWorkflow = workflows.find((workflow) => workflow.name === defaultWorkflowName);
      resolvedWorkflowId = defaultWorkflow?.id || workflows[0]?.id || null;
    }

    res.json(
      formatApiResponse(
        true,
        { workflowId: resolvedWorkflowId },
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
      // 确保文件表已初始化
      await initializeFileTable();

      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json(
          formatApiResponse(false, null, '没有上传文件')
        );
      }

      const conversationId = req.body.conversationId || req.query.conversationId;
      const uploaderId = req.body.uploaderId || req.query.uploaderId;
      const pageType = req.body.pageType || req.query.pageType as string | undefined; // 'tech-package' | 'press-release'

      // 保存文件到数据库
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const filePath = file.path;
          const fileUrl = `/uploads/ai-search/${file.filename}`;
          
          // 确定文件分类
          let category = 'general';
          if (file.mimetype.startsWith('image/')) {
            category = 'image';
          } else if (file.mimetype.startsWith('application/pdf') || 
                     file.mimetype.includes('document') || 
                     file.mimetype.includes('word') ||
                     file.mimetype.includes('text')) {
            category = 'document';
          }

          // 确保文件名正确编码（处理中文文件名）
          let originalName = file.originalname;
          // 检测并修复常见的编码问题（UTF-8被误读为ISO-8859-1）
          try {
            // 检查是否包含乱码字符
            const hasGarbledChars = /ã€|ç¥|æ|Ã|â€|â€|â€/.test(originalName);
            if (hasGarbledChars) {
              // 尝试将ISO-8859-1编码的字符串转换为UTF-8
              const buffer = Buffer.from(originalName, 'latin1');
              const decoded = buffer.toString('utf8');
              // 验证解码后的字符串是否包含中文字符
              if (/[\u4e00-\u9fa5]/.test(decoded)) {
                originalName = decoded;
                logger.info('文件名编码已修复', { before: file.originalname, after: originalName });
              }
            }
          } catch (e) {
            logger.warn('文件名编码修复失败，使用原始文件名', { originalName, error: e });
          }

          // 构建metadata，包含pageType信息
          const metadata = pageType ? { pageType } : undefined;

          const fileRecord = await fileService.createFile({
            original_name: originalName,
            stored_name: file.filename,
            file_path: filePath,
            file_url: fileUrl,
            mime_type: file.mimetype,
            file_size: file.size,
            category,
            conversation_id: conversationId || undefined,
            uploader_id: uploaderId || undefined,
            metadata,
          });

          return {
            id: fileRecord.file_id,
            fileId: fileRecord.file_id,
            name: fileRecord.original_name,
            url: fileRecord.file_url,
            type: fileRecord.mime_type,
            size: fileRecord.file_size,
            category: fileRecord.category,
            createdAt: fileRecord.created_at,
          };
        })
      );

      res.json(
        formatApiResponse(true, uploadedFiles, '文件上传成功并已保存到数据库')
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
 * 获取文件列表
 * GET /api/v1/ai-search/files?pageType=tech-package|press-release
 */
router.get('/files', async (req: Request, res: Response) => {
  try {
    await initializeFileTable();

    const category = req.query.category as string | undefined;
    const conversationId = req.query.conversationId as string | undefined;
    const pageType = req.query.pageType as string | undefined; // 'tech-package' | 'press-release'
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
    const excludeGarbled = req.query.excludeGarbled !== 'false'; // 默认排除乱码文件名

    const files = await fileService.getAllFiles({
      category,
      conversationId,
      pageType,
      limit,
      offset,
      excludeGarbled, // 默认排除乱码文件名
    });

    const fileList = files.map((file) => ({
      id: file.file_id,
      fileId: file.file_id,
      name: file.original_name,
      url: file.file_url,
      type: file.mime_type,
      size: file.file_size,
      category: file.category,
      tags: file.tags ? JSON.parse(file.tags) : [],
      description: file.description,
      usageCount: file.usage_count,
      lastUsedAt: file.last_used_at,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    }));

    res.json(
      formatApiResponse(true, fileList, '获取文件列表成功')
    );
  } catch (error) {
    logger.error('获取文件列表失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取文件列表失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 删除文件（软删除）
 * DELETE /api/v1/ai-search/files/:fileId
 */
router.delete('/files/:fileId', async (req: Request, res: Response) => {
  try {
    await initializeFileTable();

    const { fileId } = req.params;
    const success = await fileService.deleteFile(fileId);

    if (!success) {
      return res.status(404).json(
        formatApiResponse(false, null, '文件不存在或删除失败')
      );
    }

    res.json(
      formatApiResponse(true, null, '文件删除成功')
    );
  } catch (error) {
    logger.error('删除文件失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '删除文件失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

/**
 * 批量删除乱码文件
 * DELETE /api/v1/ai-search/files/garbled/cleanup
 */
router.delete('/files/garbled/cleanup', async (req: Request, res: Response) => {
  try {
    await initializeFileTable();

    // 查找所有乱码文件
    const sql = `SELECT file_id FROM files WHERE status = 'active' AND (original_name LIKE '%ã€%' OR original_name LIKE '%ç¥%' OR original_name LIKE '%æ%')`;
    const garbledFiles = await db.query(sql);
    
    let deletedCount = 0;
    for (const file of garbledFiles as any[]) {
      const success = await fileService.deleteFile(file.file_id);
      if (success) {
        deletedCount++;
      }
    }

    res.json(
      formatApiResponse(true, { deletedCount }, `成功删除 ${deletedCount} 个乱码文件`)
    );
  } catch (error) {
    logger.error('批量删除乱码文件失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '批量删除乱码文件失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});
router.get('/files/:fileId', async (req: Request, res: Response) => {
  try {
    await initializeFileTable();

    const { fileId } = req.params;
    const file = await fileService.getFileByFileId(fileId);

    if (!file) {
      return res.status(404).json(
        formatApiResponse(false, null, '文件不存在')
      );
    }

    // 增加使用次数
    await fileService.incrementUsageCount(fileId);

    const fileInfo = {
      id: file.file_id,
      fileId: file.file_id,
      name: file.original_name,
      url: file.file_url,
      type: file.mime_type,
      size: file.file_size,
      category: file.category,
      tags: file.tags ? JSON.parse(file.tags) : [],
      description: file.description,
      usageCount: file.usage_count + 1, // 已增加使用次数
      lastUsedAt: new Date().toISOString(),
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    };

    res.json(
      formatApiResponse(true, fileInfo, '获取文件信息成功')
    );
  } catch (error) {
    logger.error('获取文件信息失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取文件信息失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

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
    const pageType = req.query.pageType as string | undefined;
    const result = await getConversationsUseCase.execute(pageType);

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
    const rawLimit = req.query.limit;
    const rawBefore = req.query.before;

    const limit =
      typeof rawLimit === 'string' && rawLimit.trim() !== ''
        ? Math.max(1, Math.min(parseInt(rawLimit, 10) || 0, 200))
        : undefined;
    const before =
      typeof rawBefore === 'string' && rawBefore.trim() !== ''
        ? rawBefore
        : undefined;

    const result = await getConversationDetailUseCase.execute(id, {
      limit,
      before,
    });

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
        contextWindowSize: req.body.contextWindowSize,
        workflowId: req.body.workflowId,
        fileList: req.body.fileList,
        knowledgeBaseNames: req.body.knowledgeBaseNames,
      };
      const files = req.files as Express.Multer.File[];

      const dto = validateDTO(SendMessageSchema, body);
      const result = await sendMessageUseCase.execute({
        conversationId: id,
        content: dto.content,
        sources: dto.sources,
        files,
        contextWindowSize: typeof dto.contextWindowSize === 'number' ? dto.contextWindowSize : (dto.contextWindowSize ? parseInt(String(dto.contextWindowSize), 10) : undefined),
        workflowId: dto.workflowId,
        fileList: dto.fileList,
        knowledgeBaseNames: dto.knowledgeBaseNames,
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
    // 确保 contextWindowSize 是 number 类型
    const processedDto = {
      ...dto,
      contextWindowSize: typeof dto.contextWindowSize === 'number' ? dto.contextWindowSize : (dto.contextWindowSize ? parseInt(String(dto.contextWindowSize), 10) : undefined),
    };
    const result = await triggerAgentUseCase.execute(id, processedDto);

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
    const { conversationId, pageType } = req.query;
    const result = await getOutputsUseCase.execute(
      conversationId as string | undefined,
      pageType as string | undefined
    );

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
 * 获取所有字段映射配置
 * GET /api/v1/ai-search/field-mappings
 */
router.get('/field-mappings', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const result = await getAllFieldMappingConfigsUseCase.execute();

    if (!result.success) {
      return res.status(500).json(
        formatApiResponse(false, null, '获取字段映射配置列表失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, result.value, '获取字段映射配置列表成功'));
  } catch (error) {
    logger.error('获取字段映射配置列表失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '获取字段映射配置列表失败',
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

/**
 * 删除字段映射配置
 * DELETE /api/v1/ai-search/field-mappings/:workflowId
 */
router.delete('/field-mappings/:workflowId', ensureTablesInitialized, async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const result = await deleteFieldMappingConfigUseCase.execute(workflowId);

    if (!result.success) {
      return res.status(500).json(
        formatApiResponse(false, null, '删除字段映射配置失败', result.error.message)
      );
    }

    res.json(formatApiResponse(true, null, '删除字段映射配置成功'));
  } catch (error) {
    logger.error('删除字段映射配置失败:', error);
    res.status(500).json(
      formatApiResponse(
        false,
        null,
        '删除字段映射配置失败',
        error instanceof Error ? error.message : '未知错误'
      )
    );
  }
});

export default router;
