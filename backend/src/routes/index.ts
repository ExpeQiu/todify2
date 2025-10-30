import { Router } from 'express';
import techCategoriesRouter from './techCategories';
import techPointsRouter from './techPoints';
import brandsRouter from './brands';
import carModelsRouter from './carModels';
import carSeriesRouter from './carSeries';
import workflowRouter from './workflow';
import knowledgePointsRouter from './knowledgePointRoutes';
import chatRouter from './chat';
import workflowStatsRouter from './workflowStats';
import { Logger } from '../utils/logger';

const router = Router();

// 添加路由级别的日志记录
router.use((req, res, next) => {
  Logger.http(`API请求`, {
    method: req.method,
    url: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path
  });
  Logger.debug('API请求详情', {
    params: req.params,
    query: req.query,
    body: req.body
  });
  next();
});

// 注册路由
router.use('/tech-categories', techCategoriesRouter);
router.use('/tech-points', techPointsRouter);
router.use('/brands', brandsRouter);
router.use('/car-models', carModelsRouter);
router.use('/car-series', carSeriesRouter);
router.use('/workflow', workflowRouter);
router.use('/knowledge-points', knowledgePointsRouter);
router.use('/chat', chatRouter);
router.use('/workflow-stats', workflowStatsRouter);

// 健康检查
router.get('/health', (req, res) => {
  Logger.http('健康检查端点', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  });

  try {
    Logger.debug('准备健康检查响应');
    const response = {
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    Logger.info('健康检查成功', { version: response.version });
    res.json(response);
  } catch (error) {
    Logger.exception(error as Error, '健康检查');
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 简单测试端点
router.get('/test', (req, res) => {
  Logger.http('测试端点被调用');
  res.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

export default router;