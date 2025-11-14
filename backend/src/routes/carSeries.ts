import { Router } from 'express';
import { carSeriesController } from '../controllers/CarSeriesController';

const router = Router();

// 创建车系
router.post('/', carSeriesController.create.bind(carSeriesController));

// 获取所有车系
router.get('/', carSeriesController.getAll.bind(carSeriesController));

// 搜索车系
router.get('/search', carSeriesController.search.bind(carSeriesController));

// 获取车系统计信息
router.get('/stats', carSeriesController.getStats.bind(carSeriesController));

// 根据品牌获取车系
router.get('/brand/:brandId', carSeriesController.getByBrand.bind(carSeriesController));

// 根据车型获取车系
router.get('/model/:modelId', carSeriesController.getByModel.bind(carSeriesController));

// 根据ID获取车系
router.get('/:id', carSeriesController.getById.bind(carSeriesController));

// 获取车系关联的技术点
router.get('/:id/tech-points', carSeriesController.getTechPoints.bind(carSeriesController));

// 更新车系
router.put('/:id', carSeriesController.update.bind(carSeriesController));

// 软删除车系（停用）
router.patch('/:id/discontinue', carSeriesController.softDelete.bind(carSeriesController));

// 删除车系
router.delete('/:id', carSeriesController.delete.bind(carSeriesController));

export default router;