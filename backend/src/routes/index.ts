import { Router } from 'express';

import workflowModuleRouter from '@/modules/workflow/api/workflow.routes';
import aiSearchModuleRouter from '@/modules/ai-search/api/aiSearch.routes';
import { logger } from '@/shared/lib/logger';

import techCategoriesRouter from './techCategories';
import techPointsRouter from './techPoints';
import brandsRouter from './brands';
import carModelsRouter from './carModels';
import carSeriesRouter from './carSeries';
import knowledgePointsRouter from './knowledgePointRoutes';
import chatRouter from './chat';
import workflowStatsRouter from './workflowStats';
import difyProxyRouter from './dify-proxy';
import aiRoleRouter from './aiRole';
import agentWorkflowRouter from './agentWorkflow';
import workflowExecutionRouter from './workflowExecution';
import workflowTemplateRouter from './workflowTemplate';
import publicPageConfigRouter from './publicPageConfig';
import pageToolConfigRouter from './pageToolConfig';

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
router.use('/brands', brandsRouter);
router.use('/car-models', carModelsRouter);
router.use('/car-series', carSeriesRouter);
router.use('/workflow', workflowModuleRouter);
router.use('/knowledge-points', knowledgePointsRouter);
router.use('/chat', chatRouter);
router.use('/workflow-stats', workflowStatsRouter);
router.use('/dify', difyProxyRouter);
router.use('/ai-roles', aiRoleRouter);
router.use('/agent-workflows', agentWorkflowRouter);
router.use('/executions', workflowExecutionRouter);
router.use('/workflow-templates', workflowTemplateRouter);
router.use('/public-page-configs', publicPageConfigRouter);
router.use('/page-tool-configs', pageToolConfigRouter);
router.use('/ai-search', aiSearchModuleRouter);

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

export default router;