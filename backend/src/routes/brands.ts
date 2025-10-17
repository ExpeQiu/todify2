import { Router } from 'express';
import { brandController } from '../controllers/BrandController';

const router = Router();

// 创建品牌
router.post('/', brandController.create.bind(brandController));

// 获取所有品牌
router.get('/', brandController.getAll.bind(brandController));

// 获取品牌统计
router.get('/stats', brandController.getStats.bind(brandController));

// 根据名称获取品牌
router.get('/name/:name', brandController.getByName.bind(brandController));

// 根据ID获取品牌
router.get('/:id', brandController.getById.bind(brandController));

// 更新品牌
router.put('/:id', brandController.update.bind(brandController));

// 删除品牌
router.delete('/:id', brandController.delete.bind(brandController));

export default router;