import { Router } from 'express';

import workflowModuleRouter from '@/modules/workflow/api/workflow.routes';
import aiSearchModuleRouter from '@/modules/ai-search/api/aiSearch.routes';
import { logger } from '@/shared/lib/logger';

import techCategoriesRouter from './techCategories';
import techPointsRouter from './techPoints';
import knowledgePointsRouter from './knowledgePointRoutes';
import difyProxyRouter from './dify-proxy';
import aiRoleRouter from './aiRole';
import projectsRouter from './projects';
import techPackagingRouter from './techPackaging';
import techPromotionRouter from './techPromotion';
import techPressRouter from './techPress';
import publicKnowledgeRouter from './publicKnowledge';
import bochaWebSearchRouter from './bochaWebSearch';
import brandsRouter from './brands';
import carModelsRouter from './carModels';
import carSeriesRouter from './carSeries';
import technologiesRouter from './technologies';
import sourceInformationRouter from './sourceInformationRoutes';
import agentWorkflowRouter from './agentWorkflow';
import chatRouter from './chat';
import workflowTemplateRouter from './workflowTemplate';
import workflowStatsRouter from './workflowStats';
import pageToolConfigRouter from './pageToolConfig';
import publicPageConfigRouter from './publicPageConfig';
import workflowExecutionRouter from './workflowExecution';
import brainstormRouter from './brainstorm';

const router = Router();

// 添加路由级别的日志记录
router.use((req, res, next) => {
  logger.debug('API Route Handler', {
    method: req.method,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body,
  });
  next();
});

// 注册路由
router.use('/tech-categories', techCategoriesRouter);
router.use('/tech-points', techPointsRouter);
router.use('/workflow', workflowModuleRouter);
router.use('/knowledge-points', knowledgePointsRouter);
router.use('/dify', difyProxyRouter);
router.use('/ai-roles', aiRoleRouter);
router.use('/projects', projectsRouter);
router.use('/tech-packaging', techPackagingRouter);
router.use('/tech-promotion', techPromotionRouter);
router.use('/tech-press', techPressRouter);
router.use('/ai-search', aiSearchModuleRouter);
router.use('/public-knowledge', publicKnowledgeRouter);
router.use('/bocha', bochaWebSearchRouter);
router.use('/brands', brandsRouter);
router.use('/car-models', carModelsRouter);
router.use('/car-series', carSeriesRouter);
router.use('/technologies', technologiesRouter);
router.use('/source-information', sourceInformationRouter);
router.use('/agent-workflows', agentWorkflowRouter);
router.use('/chat', chatRouter);
router.use('/workflow-templates', workflowTemplateRouter);
router.use('/workflow-stats', workflowStatsRouter);
router.use('/page-tool-configs', pageToolConfigRouter);
router.use('/public-page-configs', publicPageConfigRouter);
router.use('/workflow-executions', workflowExecutionRouter);
router.use('/brainstorm', brainstormRouter);

// 健康检查
router.get('/health', (req, res) => {
  logger.debug('Health check endpoint called', {
    headers: req.headers,
    method: req.method,
    url: req.url,
  });
  try {
    const response = {
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    res.json(response);
  } catch (error) {
    logger.error('Health check error', { error });
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 简单测试端点
router.get('/test', (req, res) => {
  logger.debug('Test endpoint called');
  res.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// 404 处理中间件（必须在所有路由之后）
router.use((req, res) => {
  logger.warn('API 路由未找到', {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
  });
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由不存在: ${req.method} ${req.path}`,
    },
  });
});

export default router;