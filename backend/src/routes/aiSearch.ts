import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../config/database';
import { formatApiResponse } from '../utils/validation';
import { agentWorkflowService } from '../services/AgentWorkflowService';
import { AiSearchService, FieldMappingService } from '../services/AiSearchService';
import { fieldMappingEngine } from '../utils/fieldMapping';

const router = Router();

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
// 延迟初始化标记，避免在数据库未连接时初始化
let tablesInitialized = false;

// 中间件：确保表已初始化
const ensureTablesInitialized = async (req: Request, res: Response, next: any) => {
  if (!tablesInitialized) {
    try {
      await aiSearchService.initializeTables();
      tablesInitialized = true;
      console.log('AI问答数据库表初始化成功（延迟初始化）');
    } catch (error) {
      console.error('延迟初始化AI问答数据库表失败:', error);
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
    console.error('获取工作流配置失败:', error);
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
      console.error('文件上传失败:', error);
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
    const { title, sources } = req.body;
    
    const conversationRecord = await aiSearchService.createConversation(
      title || `对话 ${new Date().toLocaleString()}`,
      sources || []
    );

    // 转换为前端需要的格式
    const conversation = {
      id: conversationRecord.id,
      title: conversationRecord.title,
      sources: JSON.parse(conversationRecord.sources),
      messages: [],
      createdAt: new Date(conversationRecord.created_at),
      updatedAt: new Date(conversationRecord.updated_at),
    };

    res.json(
      formatApiResponse(true, conversation, '创建对话成功')
    );
  } catch (error) {
    console.error('创建对话失败:', error);
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
    const conversations = await aiSearchService.getConversations();
    
    // 转换为前端需要的格式
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      sources: JSON.parse(conv.sources || '[]'),
      messages: [],
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
    }));
    
    res.json(
      formatApiResponse(true, formattedConversations, '获取对话列表成功')
    );
  } catch (error) {
    console.error('获取对话列表失败:', error);
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
    const conversation = await aiSearchService.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json(
        formatApiResponse(false, null, '对话不存在')
      );
    }

    res.json(
      formatApiResponse(true, conversation, '获取对话详情成功')
    );
  } catch (error) {
    console.error('获取对话详情失败:', error);
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
      const { content, sources } = req.body;
      const files = req.files as Express.Multer.File[];

      // 保存用户消息
      const userMessage = await aiSearchService.sendMessage(
        id,
        'user',
        content,
        sources ? JSON.parse(sources) : [],
        files || []
      );

      // 执行工作流获取AI回复
      try {
        // 获取工作流配置
        const workflowId = process.env.AI_SEARCH_WORKFLOW_ID || null;
        let finalWorkflowId = workflowId;
        
        if (!finalWorkflowId) {
          const workflows = await agentWorkflowService.getAllWorkflows();
          const defaultWorkflow = workflows.find((w) => w.name === '智能工作流');
          finalWorkflowId = defaultWorkflow?.id || workflows[0]?.id || null;
        }

        if (finalWorkflowId) {
          // 加载字段映射配置
          const mappingConfig = await fieldMappingService.getFieldMappingConfig(finalWorkflowId);

          // 准备对话数据
          const sourcesArray = sources ? JSON.parse(sources) : [];
          const conversationData = {
            query: content,
            sources: sourcesArray,
            files: files?.map((f) => ({
              name: f.originalname,
              url: `/uploads/ai-search/${f.filename}`,
              type: f.mimetype,
            })) || [],
          };

          // 如果有映射配置，使用映射引擎转换输入；否则使用默认格式
          let workflowInput: any;
          if (mappingConfig && mappingConfig.inputMappings.length > 0) {
            workflowInput = fieldMappingEngine.mapInputFields(
              conversationData,
              mappingConfig.inputMappings
            );
          } else {
            // 默认映射：保持向后兼容
            workflowInput = {
              query: content,
              sources: sourcesArray,
              files: conversationData.files,
            };
          }

          // 执行工作流
          const workflowResult = await agentWorkflowService.executeWorkflow(
            finalWorkflowId,
            { input: workflowInput }
          );

          // 提取工作流输出
          let extractedOutput: any = {};
          let aiContent = workflowResult.message || '工作流执行完成';

          if (mappingConfig && mappingConfig.outputMappings.length > 0) {
            // 如果有映射配置，使用映射引擎提取输出
            // 注意：workflowResult可能包含不同的数据结构，需要根据实际工作流返回格式调整
            const workflowOutput = (workflowResult as any).data || workflowResult;
            extractedOutput = fieldMappingEngine.extractOutputFields(
              workflowOutput,
              mappingConfig.outputMappings
            );

            // 如果有提取的content，使用它作为AI回复内容
            if (extractedOutput.content) {
              aiContent = extractedOutput.content;
            }
          }

          // 保存AI回复，包含提取的输出字段
          const aiMessage = await aiSearchService.sendMessage(
            id,
            'assistant',
            aiContent,
            sourcesArray,
            [],
            extractedOutput // 传递提取的输出字段
          );

          // 返回完整消息（用户消息和AI回复）
          res.json(
            formatApiResponse(
              true,
              {
                userMessage: {
                  id: userMessage.id,
                  role: userMessage.role,
                  content: userMessage.content,
                  sources: userMessage.sources ? JSON.parse(userMessage.sources) : [],
                  outputs: userMessage.outputs ? JSON.parse(userMessage.outputs) : {},
                  createdAt: new Date(userMessage.created_at),
                },
                aiMessage: {
                  id: aiMessage.id,
                  role: aiMessage.role,
                  content: aiMessage.content,
                  sources: aiMessage.sources ? JSON.parse(aiMessage.sources) : [],
                  outputs: aiMessage.outputs ? JSON.parse(aiMessage.outputs) : {},
                  createdAt: new Date(aiMessage.created_at),
                },
              },
              '发送消息成功'
            )
          );
        } else {
          // 如果没有工作流，返回简单的回复
          const aiMessage = await aiSearchService.sendMessage(
            id,
            'assistant',
            '抱歉，工作流配置未找到，请稍后再试。',
            [],
            [],
            undefined
          );

          res.json(
            formatApiResponse(
              true,
              {
                userMessage: {
                  id: userMessage.id,
                  role: userMessage.role,
                  content: userMessage.content,
                  sources: userMessage.sources ? JSON.parse(userMessage.sources) : [],
                  outputs: userMessage.outputs ? JSON.parse(userMessage.outputs) : {},
                  createdAt: new Date(userMessage.created_at),
                },
                aiMessage: {
                  id: aiMessage.id,
                  role: aiMessage.role,
                  content: aiMessage.content,
                  sources: aiMessage.sources ? JSON.parse(aiMessage.sources) : [],
                  outputs: aiMessage.outputs ? JSON.parse(aiMessage.outputs) : {},
                  createdAt: new Date(aiMessage.created_at),
                },
              },
              '发送消息成功'
            )
          );
        }
      } catch (workflowError) {
        console.error('工作流执行失败:', workflowError);
        // 即使工作流失败，也返回用户消息
        res.json(
          formatApiResponse(
            true,
            {
              userMessage: {
                id: userMessage.id,
                role: userMessage.role,
                content: userMessage.content,
                sources: userMessage.sources ? JSON.parse(userMessage.sources) : [],
                outputs: userMessage.outputs ? JSON.parse(userMessage.outputs) : {},
                createdAt: new Date(userMessage.created_at),
              },
              error: '工作流执行失败，请稍后重试',
            },
            '发送消息成功，但工作流执行失败'
          )
        );
      }
    } catch (error) {
      console.error('发送消息失败:', error);
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
    console.error('删除对话失败:', error);
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
    const { type, conversationId, messageId, content } = req.body;
    
    const output = await aiSearchService.generateOutput(
      type,
      conversationId,
      messageId,
      content
    );

    res.json(
      formatApiResponse(true, output, '生成输出内容成功')
    );
  } catch (error) {
    console.error('生成输出内容失败:', error);
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
    const outputs = await aiSearchService.getOutputs(
      conversationId as string | undefined
    );
    
    // 转换为前端需要的格式
    const formattedOutputs = outputs.map((output) => ({
      id: output.id,
      type: output.type,
      title: output.title,
      content: JSON.parse(output.content || '{}'),
      messageId: output.message_id,
      conversationId: output.conversation_id,
      createdAt: new Date(output.created_at),
    }));
    
    res.json(
      formatApiResponse(true, formattedOutputs, '获取输出内容列表成功')
    );
  } catch (error) {
    console.error('获取输出内容列表失败:', error);
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
    const config = await fieldMappingService.getFieldMappingConfig(workflowId);
    
    if (!config) {
      return res.status(404).json(
        formatApiResponse(false, null, '字段映射配置不存在')
      );
    }

    res.json(
      formatApiResponse(true, config, '获取字段映射配置成功')
    );
  } catch (error) {
    console.error('获取字段映射配置失败:', error);
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
    const config = req.body;

    // 验证配置格式
    if (!config.workflowId || !config.inputMappings || !config.outputMappings) {
      return res.status(400).json(
        formatApiResponse(false, null, '字段映射配置格式错误')
      );
    }

    await fieldMappingService.saveFieldMappingConfig(workflowId, config);

    res.json(
      formatApiResponse(true, config, '保存字段映射配置成功')
    );
  } catch (error) {
    console.error('保存字段映射配置失败:', error);
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
