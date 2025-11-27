import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DifyClient from '../services/DifyClient';
import { formatApiResponse, formatValidationErrorResponse } from '../utils/validation';
import { aiRoleModel } from '../models';
import { CreateAIRoleDTO, UpdateAIRoleDTO } from '../models/AIRole';
import { OpenAIProvider } from '../services/llm/OpenAIProvider';
import { ChatMessage } from '../services/llm/types';
import { AgentOrchestrator } from '../services/agent/AgentOrchestrator';
import { FileService } from '../services/FileService';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/ai-roles/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
      'application/json',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});

const fileService = new FileService();

/**
 * 获取所有AI角色
 * GET /api/v1/ai-roles
 */
router.get('/', async (req, res) => {
  try {
    const roles = await aiRoleModel.getAll();
    res.json(formatApiResponse(true, roles, '获取AI角色列表成功'));
  } catch (error) {
    console.error('获取AI角色列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取AI角色列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 查找重复的AI角色
 * GET /api/v1/ai-roles/duplicates
 * 注意：必须在 /:id 路由之前定义，否则会被当作 id 处理
 */
router.get('/duplicates', async (req, res) => {
  try {
    const duplicates = await aiRoleModel.findDuplicates();
    res.json(formatApiResponse(true, duplicates, '查找重复角色成功'));
  } catch (error) {
    console.error('查找重复角色失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '查找重复角色失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 清除重复的AI角色
 * DELETE /api/v1/ai-roles/duplicates
 * Body: { confirm: true } - 需要确认
 * 注意：必须在 /:id 路由之前定义
 */
router.delete('/duplicates', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        '请提供confirm=true来确认删除操作'
      ));
    }

    // 查找重复项
    const { duplicates } = await aiRoleModel.findDuplicates();

    if (duplicates.length === 0) {
      return res.json(formatApiResponse(true, {
        deleted: 0,
        message: '没有找到重复的角色'
      }, '没有重复角色需要清除'));
    }

    // 收集所有需要删除的角色ID
    const idsToDelete: string[] = [];
    for (const duplicate of duplicates) {
      idsToDelete.push(...duplicate.remove.map(r => r.id));
    }

    // 删除重复角色
    const deletedCount = await aiRoleModel.deleteMultiple(idsToDelete);

    res.json(formatApiResponse(true, {
      deleted: deletedCount,
      duplicates: duplicates.length,
      details: duplicates.map(d => ({
        key: d.key,
        kept: d.keep.id,
        removed: d.remove.map(r => r.id),
      })),
    }, `成功清除 ${deletedCount} 个重复角色`));
  } catch (error) {
    console.error('清除重复角色失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '清除重复角色失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 创建AI角色
 * POST /api/v1/ai-roles
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, avatar, systemPrompt, provider, difyConfig, agentConfig, enabled, source } = req.body;
    
    // 验证必填字段
    if (!name || !description) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'name/description',
        message: '角色名称和描述不能为空'
      }]));
    }

    const actualProvider = provider || 'dify';
    
    // 根据 provider 验证配置
    if (actualProvider === 'dify') {
      if (!difyConfig) {
        return res.status(400).json(formatValidationErrorResponse([{
          field: 'difyConfig',
          message: 'Dify配置不能为空'
        }]));
      }
      if (!difyConfig.apiUrl || !difyConfig.apiKey || !difyConfig.connectionType) {
        return res.status(400).json(formatValidationErrorResponse([{
          field: 'difyConfig',
          message: 'Dify配置必须包含apiUrl、apiKey和connectionType'
        }]));
      }
    } else if (actualProvider === 'direct-agent') {
      if (!agentConfig) {
        return res.status(400).json(formatValidationErrorResponse([{
          field: 'agentConfig',
          message: 'Direct Agent配置不能为空'
        }]));
      }
      if (!agentConfig.llm || !agentConfig.llm.apiKey || !agentConfig.llm.model) {
        return res.status(400).json(formatValidationErrorResponse([{
          field: 'agentConfig',
          message: 'Direct Agent配置必须包含llm.apiKey和llm.model'
        }]));
      }
      if (!agentConfig.prompt || !agentConfig.prompt.systemPrompt) {
        return res.status(400).json(formatValidationErrorResponse([{
          field: 'agentConfig',
          message: 'Direct Agent配置必须包含prompt.systemPrompt'
        }]));
      }
      if (!agentConfig.contextStrategy) {
        return res.status(400).json(formatValidationErrorResponse([{
          field: 'agentConfig',
          message: 'Direct Agent配置必须包含contextStrategy'
        }]));
      }
    }
    
    const createData: CreateAIRoleDTO = {
      name,
      description,
      avatar,
      systemPrompt,
      provider: actualProvider,
      difyConfig,
      agentConfig,
      enabled,
      source,
    };
    
    const newRole = await aiRoleModel.create(createData);
    
    res.json(formatApiResponse(true, newRole, '创建AI角色成功'));
  } catch (error) {
    console.error('创建AI角色失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '创建AI角色失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 更新AI角色
 * PUT /api/v1/ai-roles/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingRole = await aiRoleModel.getById(id);
    
    if (!existingRole) {
      return res.status(404).json(formatApiResponse(false, null, 'AI角色不存在'));
    }
    
    const { name, description, avatar, systemPrompt, provider, difyConfig, agentConfig, enabled, source } = req.body;
    
    const updateData: UpdateAIRoleDTO = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(avatar !== undefined && { avatar }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(provider !== undefined && { provider }),
      ...(difyConfig !== undefined && { difyConfig }),
      ...(agentConfig !== undefined && { agentConfig }),
      ...(enabled !== undefined && { enabled }),
      ...(source !== undefined && { source }),
    };
    
    const updatedRole = await aiRoleModel.update(id, updateData);
    
    res.json(formatApiResponse(true, updatedRole, '更新AI角色成功'));
  } catch (error) {
    console.error('更新AI角色失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '更新AI角色失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除AI角色
 * DELETE /api/v1/ai-roles/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await aiRoleModel.getById(id);
    
    if (!role) {
      return res.status(404).json(formatApiResponse(false, null, 'AI角色不存在'));
    }
    
    const deleted = await aiRoleModel.delete(id);
    
    if (!deleted) {
      return res.status(500).json(formatApiResponse(false, null, '删除AI角色失败'));
    }
    
    res.json(formatApiResponse(true, null, '删除AI角色成功'));
  } catch (error) {
    console.error('删除AI角色失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '删除AI角色失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 与指定AI角色对话
 * POST /api/v1/ai-roles/:id/chat
 * 支持multipart/form-data（带文件）和application/json（不带文件）
 * 注意：必须在 /:id 路由之前定义，否则会被当作 id 处理
 */
router.post('/:id/chat', upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    // 处理文件上传
    const uploadedFiles = req.files as Express.Multer.File[];
    let fileUrls: string[] = [];
    
    if (uploadedFiles && uploadedFiles.length > 0) {
      // 保存文件到数据库并获取文件URL
      const filePromises = uploadedFiles.map(async (file) => {
        const filePath = file.path;
        const fileUrl = `/uploads/ai-roles/${file.filename}`;
        
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

        // 处理文件名编码
        let originalName = file.originalname;
        try {
          const hasGarbledChars = /ã€|ç¥|æ|Ã|â€|â€|â€/.test(originalName);
          if (hasGarbledChars) {
            const buffer = Buffer.from(originalName, 'latin1');
            const decoded = buffer.toString('utf8');
            if (/[\u4e00-\u9fa5]/.test(decoded)) {
              originalName = decoded;
            }
          }
        } catch (e) {
          // 忽略编码错误，使用原始文件名
        }

        // 保存文件记录到数据库
        const fileRecord = await fileService.createFile({
          original_name: originalName,
          stored_name: file.filename,
          file_path: filePath,
          file_url: fileUrl,
          mime_type: file.mimetype,
          file_size: file.size,
          category,
          conversation_id: req.body.conversationId || undefined,
        });

        return fileUrl;
      });
      
      fileUrls = await Promise.all(filePromises);
    }
    
    // 获取请求参数（支持JSON和FormData）
    let query: string = '';
    let inputs: any = {};
    let conversationId: string = '';
    
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // FormData格式
      query = req.body.query || '';
      try {
        inputs = typeof req.body.inputs === 'string' ? JSON.parse(req.body.inputs) : (req.body.inputs || {});
      } catch (e) {
        inputs = req.body.inputs || {};
      }
      conversationId = req.body.conversationId || '';
    } else {
      // JSON格式
      query = req.body.query || '';
      inputs = req.body.inputs || {};
      conversationId = req.body.conversationId || '';
    }
    
    // 获取角色配置
    const role = await aiRoleModel.getById(id);
    
    if (!role) {
      return res.status(404).json(formatApiResponse(false, null, 'AI角色不存在'));
    }
    
    if (!role.enabled) {
      return res.status(400).json(formatApiResponse(false, null, 'AI角色已禁用'));
    }
    
    // 验证查询参数：如果没有查询内容，至少要有文件上传
    if ((!query || query.trim() === '') && fileUrls.length === 0) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'query',
        message: '查询内容或文件至少需要提供一个'
      }]));
    }
    
    console.log('AI角色对话请求:', {
      roleId: id,
      roleName: role.name,
      query: query.substring(0, 100),
      conversationId,
      provider: role.provider || 'dify'
    });
    
    // 根据 provider 类型选择不同的处理逻辑
    const provider = role.provider || 'dify';
    
    if (provider === 'direct-agent') {
      // Direct Agent 模式
      if (!role.agentConfig) {
        return res.status(400).json(formatApiResponse(false, null, 'Direct Agent配置不存在'));
      }
      
      // 使用 AgentOrchestrator 执行
      const orchestrator = new AgentOrchestrator();
      const context = inputs || {}; // 将 inputs 作为 context 传递
      
      const result = await orchestrator.executeAgent(
        id,
        query,
        conversationId,
        context
      );
      
      // 返回统一格式
      res.json(formatApiResponse(true, {
        answer: result.content,
        conversation_id: result.conversationId,
        metadata: {
          ...result.metadata,
          usage: result.usage
        }
      }, '对话成功'));
    } else {
      // Dify 模式（保持现有逻辑）
      if (!role.difyConfig) {
        return res.status(400).json(formatApiResponse(false, null, 'Dify配置不存在'));
      }
      
      const { connectionType, apiKey, apiUrl } = role.difyConfig;
      
      // 验证配置完整性
      if (!apiKey || !apiUrl) {
        return res.status(400).json(formatApiResponse(false, null, 'Dify配置不完整：缺少API密钥或API地址'));
      }
      
      // 处理相对路径：如果是相对路径，使用后端代理；否则使用完整URL
      let actualBaseUrl = apiUrl;
      if (apiUrl.startsWith('/')) {
        // 相对路径，通过后端代理处理，使用实际的 Dify 服务器地址
        actualBaseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
        console.log('检测到相对路径，转换为完整URL:', { 原始: apiUrl, 转换后: actualBaseUrl });
      }
      
      console.log('创建 DifyGateway，配置:', { 
        baseUrl: actualBaseUrl, 
        apiKey: apiKey.substring(0, 10) + '...',
        connectionType 
      });
      
      // 创建使用角色配置的DifyGateway实例
      const { DifyGateway } = await import('@/shared/infrastructure/integrations/dify');
      const gateway = new DifyGateway({
        baseUrl: actualBaseUrl,
        workflowBaseUrl: actualBaseUrl,
        apiKey,
        timeout: 60_000,
        maxRetries: 3,
      });
      
      if (connectionType === 'chatflow') {
        // 使用聊天流模式，使用角色配置的API信息
        // 将文件URL添加到inputs.files中，这样DifyGateway会自动处理
        const inputsWithFiles = { ...inputs };
        if (fileUrls.length > 0) {
          inputsWithFiles.files = fileUrls;
        }
        
        console.log('准备调用 Dify chatflow，参数:', { 
          query, 
          conversationId, 
          inputsKeys: Object.keys(inputsWithFiles),
          files: fileUrls.length,
          fileUrls,
          userId: 'ai-role-user' 
        });
        const chatResult = await gateway.executeChat({
          query: query || '',
          conversationId,
          inputs: inputsWithFiles,
          userId: 'ai-role-user',
        });
        
        console.log('Dify chatflow 调用结果:', { 
          success: chatResult.success, 
          error: chatResult.success ? null : chatResult.error 
        });
        
        if (!chatResult.success) {
          // 提取错误信息
          const errorObj = chatResult.error || {};
          const errorDetails = typeof errorObj.details === 'string' ? errorObj.details 
            : typeof errorObj.message === 'string' ? errorObj.message 
            : JSON.stringify(errorObj);
          const errorCode = errorObj.code || 'API_ERROR';
          
          console.error('Dify聊天流调用失败，完整错误对象:', JSON.stringify(chatResult, null, 2));
          
          // 返回详细错误信息给前端
          return res.status(500).json({
            success: false,
            error: {
              code: errorCode,
              message: 'Dify聊天流调用失败',
              details: errorDetails,
              fullError: errorObj // 临时添加完整错误对象用于调试
            }
          });
        }
        
        const chatData = chatResult.value.raw as any;
        const result = {
          answer: chatData.answer || chatResult.value.answer,
          conversation_id: chatData.conversation_id || chatResult.value.conversationId,
          metadata: chatData.metadata || {}
        };
        
        res.json(formatApiResponse(true, result, '对话成功'));
      } else {
        // 使用工作流模式，使用角色配置的API信息
        const workflowResult = await gateway.executeWorkflow({
          workflowId: 'custom-workflow',
          inputs,
          userId: 'ai-role-user',
        });
        
        if (!workflowResult.success) {
          return res.status(500).json(formatApiResponse(false, null, 'Dify工作流调用失败', workflowResult.error.message));
        }
        
        const workflowData = workflowResult.value.raw as any;
        const result = {
          result: workflowData.data?.outputs?.text || workflowData.data?.outputs?.answer || workflowResult.value.outputs?.text || '',
          conversation_id: workflowData.conversation_id,
          workflow_run_id: workflowData.workflow_run_id || workflowResult.value.workflowRunId,
          task_id: workflowData.task_id || workflowResult.value.taskId
        };
        
        res.json(formatApiResponse(true, result, '对话成功'));
      }
    }
  } catch (error) {
    console.error('AI角色对话失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      'AI角色对话失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 测试AI角色连接
 * POST /api/v1/ai-roles/:id/test
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await aiRoleModel.getById(id);
    
    if (!role) {
      return res.status(404).json(formatApiResponse(false, null, 'AI角色不存在'));
    }
    
    const provider = role.provider || 'dify';
    
    if (provider === 'direct-agent') {
      // Direct Agent 连接测试
      if (!role.agentConfig) {
        return res.status(400).json(formatApiResponse(false, null, 'Direct Agent配置不存在'));
      }
      
      const llmConfig = role.agentConfig.llm;
      
      // 创建 LLM Provider
      let llmProvider;
      switch (llmConfig.provider) {
        case 'openai':
          llmProvider = new OpenAIProvider(llmConfig.apiKey, llmConfig.apiBaseUrl);
          break;
        default:
          return res.status(400).json(formatApiResponse(false, null, `不支持的LLM Provider: ${llmConfig.provider}`));
      }
      
      // 测试连接
      const isConnected = await llmProvider.testConnection();
      
      if (isConnected) {
        res.json(formatApiResponse(true, { connected: true }, '连接测试成功'));
      } else {
        res.status(400).json(formatApiResponse(false, { connected: false }, '连接测试失败'));
      }
      return;
    }
    
    // Dify 连接测试（保持现有逻辑）
    if (!role.difyConfig) {
      return res.status(400).json(formatApiResponse(false, null, 'Dify配置不存在'));
    }
    
    const { apiUrl, apiKey, connectionType } = role.difyConfig;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json(formatApiResponse(false, null, 'API配置不完整'));
    }
    
    // 处理相对路径：如果是相对路径，使用后端代理；否则使用完整URL
    let actualBaseUrl = apiUrl;
    if (apiUrl.startsWith('/')) {
      // 相对路径，通过后端代理处理，使用实际的 Dify 服务器地址
      actualBaseUrl = process.env.DIFY_BASE_URL || 'http://47.113.225.93:9999/v1';
    }
    
    // 使用角色配置的API信息进行连接测试
    const testQuery = 'Hello, this is a connection test.';
    const startTime = Date.now();
    
    try {
      // 创建使用角色配置的DifyGateway实例
      const { DifyGateway } = await import('@/shared/infrastructure/integrations/dify');
      const gateway = new DifyGateway({
        baseUrl: actualBaseUrl,
        workflowBaseUrl: actualBaseUrl,
        apiKey,
        timeout: 30_000,
        maxRetries: 1,
      });
      
      if (connectionType === 'chatflow') {
        const testResult = await gateway.executeChat({
          query: testQuery,
          conversationId: '',
          inputs: {},
          userId: 'test-user',
        });
        
        if (!testResult.success) {
          throw new Error(testResult.error.message);
        }
      } else {
        const testResult = await gateway.executeWorkflow({
          workflowId: 'test-workflow',
          inputs: {},
          userId: 'test-user',
        });
        
        if (!testResult.success) {
          throw new Error(testResult.error.message);
        }
      }
      
      const responseTime = Date.now() - startTime;
      
      res.json(formatApiResponse(true, {
        success: true,
        responseTime
      }, '连接测试成功'));
    } catch (testError) {
      const responseTime = Date.now() - startTime;
      
      res.json(formatApiResponse(true, {
        success: false,
        responseTime,
        error: testError instanceof Error ? testError.message : '连接失败'
      }, '连接测试失败'));
    }
  } catch (error) {
    console.error('AI角色连接测试失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      'AI角色连接测试失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取AI角色的使用情况
 * GET /api/v1/ai-roles/:id/usage
 */
router.get('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await aiRoleModel.getById(id);
    
    if (!role) {
      return res.status(404).json(formatApiResponse(false, null, 'AI角色不存在'));
    }

    // 分析使用情况
    const usage = {
      roleId: role.id,
      roleName: role.name,
      locations: [] as any[],
      totalUsageCount: 0,
    };

    // 检查是否在独立页面中使用
    // 这里可以根据角色ID/名称匹配独立页面节点配置
    const independentPagePatterns = [
      { pattern: /ai-search|ai问答|智能搜索/i, name: 'AI问答', path: '/node/ai-search' },
      { pattern: /tech-package|技术包装/i, name: '技术包装', path: '/node/tech-package' },
      { pattern: /promotion-strategy|tech-strategy|技术策略|推广策略/i, name: '技术策略', path: '/node/promotion-strategy' },
      { pattern: /core-draft|tech-article|技术通稿|核心稿件/i, name: '技术通稿', path: '/node/core-draft' },
      { pattern: /speech|发布会|演讲稿|tech-publish/i, name: '发布会演讲稿', path: '/node/speech' },
    ];

    for (const pagePattern of independentPagePatterns) {
      if (
        pagePattern.pattern.test(role.id) ||
        pagePattern.pattern.test(role.name) ||
        pagePattern.pattern.test(role.description || '')
      ) {
        if (role.source === 'independent-page' || !role.source) {
          usage.locations.push({
            type: 'independent-page',
            name: pagePattern.name,
            path: pagePattern.path,
          });
        }
      }
    }

    // 检查Agent工作流使用情况
    try {
      const { agentWorkflowModel } = await import('../models');
      const workflows = await agentWorkflowModel.getAll();
      
      for (const workflow of workflows) {
        const nodesData = typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes;
        const nodesUsingRole = (nodesData || []).filter(
          (node: any) => node.agentId === role.id
        );

        if (nodesUsingRole.length > 0) {
          usage.locations.push({
            type: 'agent-workflow',
            name: workflow.name || '未命名工作流',
            path: '/agent-workflow',
            description: `${nodesUsingRole.length}个节点使用此角色`,
          });
        }
      }
    } catch (error) {
      console.warn('检查工作流使用情况失败:', error);
    }

    // 检查是否在智能工作流中使用
    if (role.source === 'smart-workflow') {
      const alreadyInWorkflow = usage.locations.some(
        (loc: any) => loc.type === 'agent-workflow'
      );
      if (!alreadyInWorkflow) {
        usage.locations.push({
          type: 'agent-workflow',
          name: '智能工作流',
          path: '/agent-workflow',
          description: '标记为智能工作流角色',
        });
      }
    }

    // 检查是否可以在多窗口对话中使用
    if (role.enabled) {
      usage.locations.push({
        type: 'multi-chat',
        name: '多窗口对话',
        path: '/multi-chat',
        description: '可以在多窗口对话功能中使用',
      });
    }

    usage.totalUsageCount = usage.locations.length;

    res.json(formatApiResponse(true, usage, '获取AI角色使用情况成功'));
  } catch (error) {
    console.error('获取AI角色使用情况失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取AI角色使用情况失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取单个AI角色
 * GET /api/v1/ai-roles/:id
 * 注意：必须在所有 /:id/xxx 路由之后定义
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const role = await aiRoleModel.getById(id);
    
    if (!role) {
      return res.status(404).json(formatApiResponse(false, null, 'AI角色不存在'));
    }
    
    res.json(formatApiResponse(true, role, '获取AI角色成功'));
  } catch (error) {
    console.error('获取AI角色失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取AI角色失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;
