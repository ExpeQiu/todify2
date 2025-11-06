import express from 'express';
import DifyClient from '../services/DifyClient';
import { formatApiResponse, formatValidationErrorResponse } from '../utils/validation';
import { aiRoleModel } from '../models';
import { CreateAIRoleDTO, UpdateAIRoleDTO } from '../models/AIRole';

const router = express.Router();

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
 * 获取单个AI角色
 * GET /api/v1/ai-roles/:id
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

/**
 * 创建AI角色
 * POST /api/v1/ai-roles
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, avatar, systemPrompt, difyConfig, enabled, source } = req.body;
    
    // 验证必填字段
    if (!name || !description || !difyConfig) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'name/description/difyConfig',
        message: '角色名称、描述和Dify配置不能为空'
      }]));
    }

    // 验证difyConfig结构
    if (!difyConfig.apiUrl || !difyConfig.apiKey || !difyConfig.connectionType) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'difyConfig',
        message: 'Dify配置必须包含apiUrl、apiKey和connectionType'
      }]));
    }
    
    const createData: CreateAIRoleDTO = {
      name,
      description,
      avatar,
      systemPrompt,
      difyConfig,
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
    
    const { name, description, avatar, systemPrompt, difyConfig, enabled, source } = req.body;
    
    const updateData: UpdateAIRoleDTO = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(avatar !== undefined && { avatar }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(difyConfig !== undefined && { difyConfig }),
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
 */
router.post('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { query, inputs = {}, conversationId = '' } = req.body;
    
    // 获取角色配置
    const role = await aiRoleModel.getById(id);
    
    if (!role) {
      return res.status(404).json(formatApiResponse(false, null, 'AI角色不存在'));
    }
    
    if (!role.enabled) {
      return res.status(400).json(formatApiResponse(false, null, 'AI角色已禁用'));
    }
    
    // 验证查询参数
    if (!query || query.trim() === '') {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'query',
        message: '查询内容不能为空'
      }]));
    }
    
    console.log('AI角色对话请求:', {
      roleId: id,
      roleName: role.name,
      query: query.substring(0, 100),
      conversationId
    });
    
    // 根据连接类型调用不同的Dify API
    const { connectionType, apiKey, apiUrl } = role.difyConfig;
    
    if (connectionType === 'chatflow') {
      // 使用聊天流模式
      const chatResponse = await DifyClient.aiSearch(query, inputs, conversationId);
      
      // 提取answer字段
      const result = {
        answer: chatResponse.answer,
        conversation_id: chatResponse.conversation_id,
        metadata: chatResponse.metadata
      };
      
      res.json(formatApiResponse(true, result, '对话成功'));
    } else {
      // 使用工作流模式
      const workflowResponse = await DifyClient.runWorkflow({
        type: 'workflow',
        apiUrl,
        apiKey
      } as any, inputs);
      
      const result = {
        result: workflowResponse.data?.outputs?.text || workflowResponse.data?.outputs?.answer || '',
        conversation_id: workflowResponse.conversation_id,
        workflow_run_id: workflowResponse.workflow_run_id,
        task_id: workflowResponse.task_id
      };
      
      res.json(formatApiResponse(true, result, '对话成功'));
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
    
    const { apiUrl, apiKey, connectionType } = role.difyConfig;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json(formatApiResponse(false, null, 'API配置不完整'));
    }
    
    // 简单的连接测试
    const testQuery = 'Hello, this is a connection test.';
    const startTime = Date.now();
    
    try {
      if (connectionType === 'chatflow') {
        await DifyClient.aiSearch(testQuery, {}, '');
      } else {
        await DifyClient.runWorkflow({
          type: 'workflow',
          apiUrl,
          apiKey
        } as any, {});
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
 * 查找重复的AI角色
 * GET /api/v1/ai-roles/duplicates
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

export default router;
