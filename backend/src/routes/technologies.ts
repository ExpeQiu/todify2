import { Router } from 'express';
import { technologyController } from '../controllers/TechnologyController';

const router = Router();

// 创建技术IP
router.post('/', technologyController.create.bind(technologyController));

// 获取所有技术IP
router.get('/', technologyController.getAll.bind(technologyController));

// 根据ID获取技术IP
router.get('/:id', technologyController.getById.bind(technologyController));

// 更新技术IP
router.put('/:id', technologyController.update.bind(technologyController));

// 删除技术IP
router.delete('/:id', technologyController.delete.bind(technologyController));

export default router;

