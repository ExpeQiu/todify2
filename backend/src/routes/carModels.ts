import { Router } from 'express';
import { carModelController } from '../controllers/CarModelController';

const router = Router();

// 创建车型
router.post('/', carModelController.create.bind(carModelController));

// 获取所有车型
router.get('/', carModelController.getAll.bind(carModelController));

// 获取车型统计
router.get('/stats', carModelController.getStats.bind(carModelController));

// 根据品牌获取车型
router.get('/brand/:brandId', carModelController.getByBrand.bind(carModelController));

// 根据ID获取车型
router.get('/:id', carModelController.getById.bind(carModelController));

// 更新车型
router.put('/:id', carModelController.update.bind(carModelController));

// 删除车型
router.delete('/:id', carModelController.delete.bind(carModelController));

export default router;