import { Router } from 'express';
import { techCategoryController } from '../controllers';

const router = Router();

// 技术分类路由
router.post('/', techCategoryController.create.bind(techCategoryController));
router.get('/', techCategoryController.getAll.bind(techCategoryController));
router.get('/tree', techCategoryController.getTree.bind(techCategoryController));
router.get('/search', techCategoryController.search.bind(techCategoryController));
router.get('/:id', techCategoryController.getById.bind(techCategoryController));
router.put('/:id', techCategoryController.update.bind(techCategoryController));
router.delete('/:id', techCategoryController.delete.bind(techCategoryController));
router.put('/sort-order', techCategoryController.updateSortOrder.bind(techCategoryController));

export default router;