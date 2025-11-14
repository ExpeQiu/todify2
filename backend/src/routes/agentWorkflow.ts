import express from 'express';
import { agentWorkflowService } from '../services/AgentWorkflowService';
import { formatApiResponse, formatValidationErrorResponse } from '../utils/validation';

const router = express.Router();

/**
 * 获取所有Agent工作流
 * GET /api/v1/agent-workflows
 */
router.get('/', async (req, res) => {
  try {
    const workflows = await agentWorkflowService.getAllWorkflows();
    res.json(formatApiResponse(true, workflows, '获取工作流列表成功'));
  } catch (error) {
    console.error('获取工作流列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取工作流列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 搜索Agent工作流
 * GET /api/v1/agent-workflows/search?q=xxx
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim() === '') {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'q',
        message: '搜索关键词不能为空'
      }]));
    }
    
    const workflows = await agentWorkflowService.searchWorkflows(query);
    res.json(formatApiResponse(true, workflows, '搜索成功'));
  } catch (error) {
    console.error('搜索工作流失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '搜索工作流失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取单个Agent工作流
 * GET /api/v1/agent-workflows/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await agentWorkflowService.getWorkflowById(id);
    
    if (!workflow) {
      return res.status(404).json(formatApiResponse(false, null, '工作流不存在'));
    }
    
    res.json(formatApiResponse(true, workflow, '获取工作流成功'));
  } catch (error) {
    console.error('获取工作流失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取工作流失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 创建Agent工作流
 * POST /api/v1/agent-workflows
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, version, nodes, edges, metadata } = req.body;
    
    // 验证必填字段
    if (!name || !nodes || !edges) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'name/nodes/edges',
        message: '工作流名称、节点和边不能为空'
      }]));
    }
    
    // 验证数据格式
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'nodes/edges',
        message: '节点和边必须是数组'
      }]));
    }
    
    const workflow = await agentWorkflowService.createWorkflow({
      name,
      description,
      version,
      nodes,
      edges,
      metadata,
    });
    
    res.json(formatApiResponse(true, workflow, '创建工作流成功'));
  } catch (error) {
    console.error('创建工作流失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '创建工作流失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 更新Agent工作流
 * PUT /api/v1/agent-workflows/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, version, nodes, edges, metadata } = req.body;
    
    const workflow = await agentWorkflowService.updateWorkflow(id, {
      name,
      description,
      version,
      nodes,
      edges,
      metadata,
    });
    
    res.json(formatApiResponse(true, workflow, '更新工作流成功'));
  } catch (error) {
    console.error('更新工作流失败:', error);
    
    if (error instanceof Error && error.message.includes('不存在')) {
      return res.status(404).json(formatApiResponse(false, null, error.message));
    }
    
    res.status(500).json(formatApiResponse(
      false,
      null,
      '更新工作流失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除Agent工作流
 * DELETE /api/v1/agent-workflows/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await agentWorkflowService.deleteWorkflow(id);
    
    if (!success) {
      return res.status(404).json(formatApiResponse(false, null, '工作流不存在'));
    }
    
    res.json(formatApiResponse(true, null, '删除工作流成功'));
  } catch (error) {
    console.error('删除工作流失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '删除工作流失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 执行Agent工作流
 * POST /api/v1/agent-workflows/:id/execute
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { input, options } = req.body;
    
    const result = await agentWorkflowService.executeWorkflow(id, {
      input,
      ...options,
    });
    
    res.json(formatApiResponse(true, result, '工作流执行已开始'));
  } catch (error) {
    console.error('执行工作流失败:', error);
    
    if (error instanceof Error && error.message.includes('不存在')) {
      return res.status(404).json(formatApiResponse(false, null, error.message));
    }
    
    res.status(500).json(formatApiResponse(
      false,
      null,
      '执行工作流失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取工作流执行历史
 * GET /api/v1/agent-workflows/:id/executions
 */
router.get('/:id/executions', async (req, res) => {
  try {
    const { id } = req.params;
    const executions = await agentWorkflowService.getExecutionHistory(id);
    
    res.json(formatApiResponse(true, executions, '获取执行历史成功'));
  } catch (error) {
    console.error('获取执行历史失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取执行历史失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

