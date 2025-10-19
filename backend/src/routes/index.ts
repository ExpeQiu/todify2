import { Router } from 'express';
import techCategoriesRouter from './techCategories';
import techPointsRouter from './techPoints';
import brandsRouter from './brands';
import carModelsRouter from './carModels';
import carSeriesRouter from './carSeries';
import workflowRouter from './workflow';

const router = Router();

// 添加路由级别的日志记录
router.use((req, res, next) => {
  console.log(`=== API Route Handler ===`);
  console.log(`${req.method} ${req.originalUrl}`);
  console.log('Base URL:', req.baseUrl);
  console.log('Path:', req.path);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// 注册路由
router.use('/tech-categories', techCategoriesRouter);
router.use('/tech-points', techPointsRouter);
router.use('/brands', brandsRouter);
router.use('/car-models', carModelsRouter);
router.use('/car-series', carSeriesRouter);
router.use('/workflow', workflowRouter);

// 健康检查
router.get('/health', (req, res) => {
  console.log('=== Health check endpoint called ===');
  console.log('Request headers:', req.headers);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    console.log('Preparing response...');
    const response = {
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 简单测试端点
router.get('/test', (req, res) => {
  console.log('=== Test endpoint called ===');
  res.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

export default router;