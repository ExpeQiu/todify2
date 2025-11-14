import express from 'express';
import { agentWorkflowService } from '../services/AgentWorkflowService';
import { formatApiResponse, formatValidationErrorResponse } from '../utils/validation';

const router = express.Router();

/**
 * 获取所有工作流模板
 * GET /api/v1/workflow-templates?category=xxx
 */
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const templates = await agentWorkflowService.getAllTemplates(category);
    
    res.json(formatApiResponse(true, templates, '获取模板列表成功'));
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取模板列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取单个工作流模板
 * GET /api/v1/workflow-templates/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await agentWorkflowService.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json(formatApiResponse(false, null, '模板不存在'));
    }
    
    res.json(formatApiResponse(true, template, '获取模板成功'));
  } catch (error) {
    console.error('获取模板失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取模板失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 创建工作流模板
 * POST /api/v1/workflow-templates
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, category, thumbnail, workflowStructure, metadata, isPublic } = req.body;
    
    console.log('收到创建模板请求:', {
      name,
      description,
      category,
      hasWorkflowStructure: !!workflowStructure,
      workflowStructureType: typeof workflowStructure,
      workflowStructureIsArray: Array.isArray(workflowStructure),
      workflowStructureKeys: workflowStructure && typeof workflowStructure === 'object' ? Object.keys(workflowStructure) : null,
      workflowStructurePreview: workflowStructure ? JSON.stringify(workflowStructure).substring(0, 200) : null,
      requestBody: JSON.stringify(req.body).substring(0, 500),
    });
    
    // 验证必填字段
    if (!name || !description || !category) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'name/description/category',
        message: '模板名称、描述和分类不能为空'
      }]));
    }

    // 验证 workflowStructure
    if (!workflowStructure) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'workflowStructure',
        message: '工作流结构不能为空'
      }]));
    }

    // 确保 workflowStructure 是有效的对象或字符串
    if (typeof workflowStructure !== 'object' && typeof workflowStructure !== 'string') {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'workflowStructure',
        message: '工作流结构格式无效'
      }]));
    }
    
    console.log('开始创建模板...');
    
    const template = await agentWorkflowService.createTemplate({
      name,
      description,
      category,
      thumbnail,
      workflowStructure,
      metadata,
      isPublic,
    });
    
    console.log('模板创建成功:', template.id);
    
    res.json(formatApiResponse(true, template, '创建模板成功'));
  } catch (error) {
    console.error('创建模板失败:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json(formatApiResponse(
      false,
      null,
      '创建模板失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 从模板创建工作流
 * POST /api/v1/workflow-templates/:id/create-workflow
 */
router.post('/:id/create-workflow', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, agentMappings } = req.body;
    
    if (!name) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'name',
        message: '工作流名称不能为空'
      }]));
    }
    
    const workflow = await agentWorkflowService.createWorkflowFromTemplate(id, {
      name,
      description,
      agentMappings,
    });
    
    res.json(formatApiResponse(true, workflow, '从模板创建工作流成功'));
  } catch (error) {
    console.error('从模板创建工作流失败:', error);
    
    if (error instanceof Error && error.message.includes('不存在')) {
      return res.status(404).json(formatApiResponse(false, null, error.message));
    }
    
    res.status(500).json(formatApiResponse(
      false,
      null,
      '从模板创建工作流失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除工作流模板
 * DELETE /api/v1/workflow-templates/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await agentWorkflowService.deleteTemplate(id);
    
    if (!success) {
      return res.status(404).json(formatApiResponse(false, null, '模板不存在'));
    }
    
    res.json(formatApiResponse(true, null, '删除模板成功'));
  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '删除模板失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

