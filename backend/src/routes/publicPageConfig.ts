import express from 'express';
import { formatApiResponse, formatValidationErrorResponse } from '../utils/validation';
import { publicPageConfigModel, agentWorkflowModel, aiRoleModel } from '../models';
import { CreatePublicPageConfigDTO, UpdatePublicPageConfigDTO } from '../models/PublicPageConfig';

const router = express.Router();

/**
 * 获取所有公开页面配置
 * GET /api/v1/public-page-configs
 */
router.get('/', async (req, res) => {
  try {
    const configs = await publicPageConfigModel.getAll();
    res.json(formatApiResponse(true, configs, '获取配置列表成功'));
  } catch (error) {
    console.error('获取配置列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取配置列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取单个配置
 * GET /api/v1/public-page-configs/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await publicPageConfigModel.getById(id);
    
    if (!config) {
      return res.status(404).json(formatApiResponse(false, null, '配置不存在'));
    }
    
    res.json(formatApiResponse(true, config, '获取配置成功'));
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 创建公开页面配置
 * POST /api/v1/public-page-configs
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, address, displayMode, workflowId, roleIds, templateType, customHtml } = req.body;
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'name',
        message: '配置名称不能为空'
      }]));
    }

    // 如果没有提供displayMode，使用默认值'role'
    const finalDisplayMode = displayMode || 'role';

    // 验证显示模式
    if (finalDisplayMode && !['all', 'workflow', 'custom', 'role'].includes(finalDisplayMode)) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'displayMode',
        message: '显示模式必须是all、workflow、custom或role之一'
      }]));
    }

    // 验证workflow模式
    if (finalDisplayMode === 'workflow' && !workflowId) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'workflowId',
        message: '工作流模式下必须提供workflowId'
      }]));
    }

    // 验证custom模式
    if (finalDisplayMode === 'custom' && (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0)) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'roleIds',
        message: '自定义模式下必须提供角色ID列表'
      }]));
    }

    // 验证role模式（如果没有提供roleIds，使用空数组）
    // 注意：role模式允许空数组，表示显示所有角色
    
    const createData: CreatePublicPageConfigDTO = {
      name,
      description,
      address,
      displayMode: finalDisplayMode,
      workflowId,
      roleIds: roleIds || (finalDisplayMode === 'role' ? [] : undefined),
      templateType,
      customHtml,
      isActive: req.body.isActive, // 支持创建时设置isActive
    };
    
    const newConfig = await publicPageConfigModel.create(createData);
    
    res.json(formatApiResponse(true, newConfig, '创建配置成功'));
  } catch (error) {
    console.error('创建配置失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '创建配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 更新公开页面配置
 * PUT /api/v1/public-page-configs/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, displayMode, workflowId, roleIds, isActive, templateType, customHtml } = req.body;
    
    // 检查配置是否存在
    const existingConfig = await publicPageConfigModel.getById(id);
    if (!existingConfig) {
      return res.status(404).json(formatApiResponse(false, null, '配置不存在'));
    }

    // 验证显示模式
    if (displayMode && !['all', 'workflow', 'custom', 'role'].includes(displayMode)) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'displayMode',
        message: '显示模式必须是all、workflow、custom或role之一'
      }]));
    }

    const updateData: UpdatePublicPageConfigDTO = {
      name,
      description,
      address,
      displayMode,
      workflowId,
      roleIds,
      isActive,
      templateType,
      customHtml,
    };
    
    const updatedConfig = await publicPageConfigModel.update(id, updateData);
    
    res.json(formatApiResponse(true, updatedConfig, '更新配置成功'));
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '更新配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除公开页面配置
 * DELETE /api/v1/public-page-configs/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查配置是否存在
    const existingConfig = await publicPageConfigModel.getById(id);
    if (!existingConfig) {
      return res.status(404).json(formatApiResponse(false, null, '配置不存在'));
    }
    
    await publicPageConfigModel.delete(id);
    
    res.json(formatApiResponse(true, null, '删除配置成功'));
  } catch (error) {
    console.error('删除配置失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '删除配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 预览配置（获取角色列表）
 * GET /api/v1/public-page-configs/:id/preview
 */
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await publicPageConfigModel.getById(id);
    
    if (!config) {
      return res.status(404).json(formatApiResponse(false, null, '配置不存在'));
    }

    let roles: any[] = [];
    
    if (config.displayMode === 'all') {
      // 获取所有启用的角色
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => r.enabled);
    } else if (config.displayMode === 'workflow' && config.workflowId) {
      // 从工作流中提取角色
      const workflow = await agentWorkflowModel.getById(config.workflowId);
      if (workflow) {
        const workflowNodes = JSON.parse(workflow.nodes);
        const agentIds = workflowNodes.map((node: any) => node.agentId).filter(Boolean);
        const allRoles = await aiRoleModel.getAll();
        roles = allRoles.filter(r => agentIds.includes(r.id) && r.enabled);
      }
    } else if (config.displayMode === 'custom' && config.roleIds && config.roleIds.length > 0) {
      // 获取指定的角色
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => config.roleIds!.includes(r.id) && r.enabled);
    }
    
    res.json(formatApiResponse(true, { roles, config }, '获取配置预览成功'));
  } catch (error) {
    console.error('获取配置预览失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取配置预览失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 导入独立页面配置
 * POST /api/v1/public-page-configs/import-independent-pages
 */
router.post('/import-independent-pages', async (req, res) => {
  try {
    // 获取所有独立页面角色
    const allRoles = await aiRoleModel.getAll();
    const independentPageRoles = allRoles.filter(
      r => r.source === 'independent-page' && r.enabled
    );

    if (independentPageRoles.length === 0) {
      return res.status(404).json(formatApiResponse(
        false,
        null,
        '未找到独立页面角色，请先初始化独立页面AI角色'
      ));
    }

    // 定义节点映射
    const nodeMapping: Record<string, { name: string; description: string }> = {
      'independent-page-ai-search': {
        name: 'AI问答',
        description: '智能问答和搜索功能公开页面'
      },
      'independent-page-tech-package': {
        name: '技术包装',
        description: '技术内容包装工作流公开页面'
      },
      'independent-page-tech-strategy': {
        name: '技术策略',
        description: '技术策略生成工作流公开页面'
      },
      'independent-page-core-draft': {
        name: '技术通稿',
        description: '核心内容生成工作流公开页面'
      },
      'independent-page-speech': {
        name: '发布会演讲稿',
        description: '技术发布内容生成工作流公开页面'
      }
    };

    const importResults: Array<{ role: any; config: any; status: 'created' | 'exists' | 'error'; error?: string }> = [];

    // 为每个独立页面角色创建公开页面配置
    for (const role of independentPageRoles) {
      try {
        // 检查是否已存在配置（通过名称匹配）
        const existingConfigs = await publicPageConfigModel.getAll();
        const existing = existingConfigs.find(
          c => c.name === (nodeMapping[role.id]?.name || role.name)
        );

        if (existing) {
          importResults.push({
            role,
            config: existing,
            status: 'exists'
          });
          continue;
        }

        // 创建新配置
        const nodeInfo = nodeMapping[role.id] || {
          name: role.name,
          description: `${role.description}公开页面`
        };

        const createData: CreatePublicPageConfigDTO = {
          name: nodeInfo.name,
          description: nodeInfo.description,
          displayMode: 'custom',
          roleIds: [role.id],
        };

        const newConfig = await publicPageConfigModel.create(createData);
        importResults.push({
          role,
          config: newConfig,
          status: 'created'
        });
      } catch (error) {
        importResults.push({
          role,
          config: null,
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    const createdCount = importResults.filter(r => r.status === 'created').length;
    const existsCount = importResults.filter(r => r.status === 'exists').length;
    const errorCount = importResults.filter(r => r.status === 'error').length;

    res.json(formatApiResponse(true, {
      results: importResults,
      summary: {
        total: independentPageRoles.length,
        created: createdCount,
        exists: existsCount,
        errors: errorCount
      }
    }, `导入完成：创建${createdCount}个，已存在${existsCount}个，失败${errorCount}个`));
  } catch (error) {
    console.error('导入独立页面配置失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '导入独立页面配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 根据地址获取配置
 * GET /api/v1/public-page-configs/by-address/:address
 */
router.get('/by-address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const config = await publicPageConfigModel.getByAddress(address);
    
    if (!config) {
      return res.status(404).json(formatApiResponse(false, null, '配置不存在或已禁用'));
    }
    
    res.json(formatApiResponse(true, config, '获取配置成功'));
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 切换配置启用状态
 * PATCH /api/v1/public-page-configs/:id/toggle
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // 检查配置是否存在
    const existingConfig = await publicPageConfigModel.getById(id);
    if (!existingConfig) {
      return res.status(404).json(formatApiResponse(false, null, '配置不存在'));
    }

    const updateData: UpdatePublicPageConfigDTO = {
      isActive: typeof isActive === 'boolean' ? isActive : !existingConfig.isActive,
    };

    const updatedConfig = await publicPageConfigModel.update(id, updateData);

    res.json(formatApiResponse(true, updatedConfig, '切换状态成功'));
  } catch (error) {
    console.error('切换状态失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '切换状态失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

