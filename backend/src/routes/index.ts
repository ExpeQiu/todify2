import { Router } from 'express';
import techCategoriesRouter from './techCategories';
import techPointsRouter from './techPoints';
import brandsRouter from './brands';
import carModelsRouter from './carModels';
import carSeriesRouter from './carSeries';
import workflowRouter from './workflow';

const router = Router();

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
      timestamp: new Date().toISOString()
    };
    console.log('Response data:', response);
    
    res.status(200).json(response);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Health check error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;