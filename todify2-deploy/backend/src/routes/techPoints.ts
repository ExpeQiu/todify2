import { Router } from 'express';
import { techPointController } from '../controllers';

const router = Router();

// 添加中间件来记录所有请求
router.use((req, res, next) => {
  console.log(`TechPoints route: ${req.method} ${req.path}`);
  next();
});

// 技术点路由
router.post('/', techPointController.create.bind(techPointController));
router.get('/', techPointController.getAll.bind(techPointController));
router.get('/tree', techPointController.getTree.bind(techPointController));
router.get('/search', techPointController.search.bind(techPointController));
router.get('/tags', techPointController.findByTags.bind(techPointController));
router.get('/stats', techPointController.getStats.bind(techPointController));
router.get('/category/:categoryId', techPointController.getByCategoryId.bind(techPointController));
router.get('/:id', techPointController.getById.bind(techPointController));
router.get('/:id/content', techPointController.getAssociatedContent.bind(techPointController));
router.get('/:id/car-models', techPointController.getAssociatedCarModels.bind(techPointController));

// 车型关联管理路由
router.post('/:id/car-models', techPointController.associateCarModel.bind(techPointController));
router.put('/:id/car-models/:carModelId', techPointController.updateCarModelAssociation.bind(techPointController));
router.delete('/:id/car-models/:carModelId', techPointController.disassociateCarModel.bind(techPointController));

router.put('/:id', techPointController.update.bind(techPointController));
router.delete('/:id', techPointController.delete.bind(techPointController));

export default router;