import { Router } from 'express';
import { projectController } from '../controllers';

const router = Router();

// 添加中间件来记录所有请求
router.use((req, res, next) => {
  console.log(`Projects route: ${req.method} ${req.path}`);
  next();
});

// 项目路由
router.post('/', projectController.create.bind(projectController));
router.get('/', projectController.getAll.bind(projectController));
router.get('/featured', projectController.getFeatured.bind(projectController));
router.get('/recent', projectController.getRecent.bind(projectController));
router.get('/:id', projectController.getById.bind(projectController));
router.get('/:id/details', projectController.getProjectDetails.bind(projectController));
router.get('/:id/full-context', projectController.getFullContext.bind(projectController));
router.post('/:id/intelligence-mining', projectController.mineProjectIntelligence.bind(projectController));
router.get('/:id/conversations', projectController.getConversations.bind(projectController));
router.put('/:id', projectController.update.bind(projectController));
router.put('/:id/last-opened', projectController.updateLastOpenedAt.bind(projectController));
router.post('/:id/relations', projectController.addProjectRelation.bind(projectController));
router.delete('/:id/relations', projectController.removeProjectRelation.bind(projectController));
router.delete('/:id', projectController.delete.bind(projectController));

export default router;
