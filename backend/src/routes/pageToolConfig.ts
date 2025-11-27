import express from 'express';
import { formatValidationErrorResponse } from '../utils/validation';
import { createSuccessResponse, createErrorResponse, ApiErrorCode } from '../shared/types/api';
import { DatabaseManager } from '../config/database';
import { PageToolConfigModel, CreatePageToolConfigDTO, UpdatePageToolConfigDTO } from '../models/PageToolConfig';

const router = express.Router();
const db = new DatabaseManager();
const pageToolConfigModel = new PageToolConfigModel(db);

/**
 * 获取所有配置
 * GET /api/v1/page-tool-configs
 * 注意：必须在 /:pageType 之前定义，否则会被参数路由匹配
 */
router.get('/', async (req, res) => {
  try {
    const configs = await pageToolConfigModel.getAll();
    res.json(createSuccessResponse(configs, '获取配置列表成功'));
  } catch (error) {
    console.error('获取配置列表失败:', error);
    res.status(500).json(createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      '获取配置列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 根据页面类型获取配置
 * GET /api/v1/page-tool-configs/:pageType
 * 注意：必须在 / 之后定义，否则会拦截根路径
 */
router.get('/:pageType', async (req, res) => {
  try {
    const { pageType } = req.params;
    
    const config = await pageToolConfigModel.getByPageType(pageType);
    
    if (!config) {
      return res.status(404).json(createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        '配置不存在'
      ));
    }
    
    res.json(createSuccessResponse(config, '获取配置成功'));
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json(createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      '获取配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 创建页面工具配置
 * POST /api/v1/page-tool-configs
 */
router.post('/', async (req, res) => {
  try {
    const { pageType, pageTitle, dialogueTitle, studioTitle, workflowSelectionKey, enabledToolIds, featureLabelMap } = req.body;
    
    // 验证必填字段
    if (!pageType || !pageTitle || !dialogueTitle || !studioTitle || !workflowSelectionKey) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'pageType/pageTitle/dialogueTitle/studioTitle/workflowSelectionKey',
        message: '必填字段不能为空'
      }]));
    }

    // 验证页面类型
    if (!['tech-package', 'press-release', 'tech-strategy', 'tech-article'].includes(pageType)) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'pageType',
        message: '页面类型必须是tech-package、press-release、tech-strategy或tech-article之一'
      }]));
    }

    const dto: CreatePageToolConfigDTO = {
      pageType,
      pageTitle,
      dialogueTitle,
      studioTitle,
      workflowSelectionKey,
      enabledToolIds,
      featureLabelMap,
    };

    const config = await pageToolConfigModel.create(dto);
    res.status(201).json(createSuccessResponse(config, '创建配置成功'));
  } catch (error) {
    console.error('创建配置失败:', error);
    res.status(500).json(createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      '创建配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 更新页面工具配置
 * PUT /api/v1/page-tool-configs/:pageType
 */
router.put('/:pageType', async (req, res) => {
  try {
    const { pageType } = req.params;
    const { pageTitle, dialogueTitle, studioTitle, workflowSelectionKey, enabledToolIds, featureLabelMap, isActive } = req.body;

    const dto: UpdatePageToolConfigDTO = {
      pageTitle,
      dialogueTitle,
      studioTitle,
      workflowSelectionKey,
      enabledToolIds,
      featureLabelMap,
      isActive,
    };

    const config = await pageToolConfigModel.update(pageType, dto);
    
    if (!config) {
      return res.status(404).json(createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        '配置不存在'
      ));
    }
    
    res.json(createSuccessResponse(config, '更新配置成功'));
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json(createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      '更新配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除页面工具配置（软删除）
 * DELETE /api/v1/page-tool-configs/:pageType
 */
router.delete('/:pageType', async (req, res) => {
  try {
    const { pageType } = req.params;
    
    const success = await pageToolConfigModel.delete(pageType);
    
    if (!success) {
      return res.status(404).json(createErrorResponse(
        ApiErrorCode.NOT_FOUND,
        '配置不存在'
      ));
    }
    
    res.json(createSuccessResponse(null, '删除配置成功'));
  } catch (error) {
    console.error('删除配置失败:', error);
    res.status(500).json(createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      '删除配置失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

