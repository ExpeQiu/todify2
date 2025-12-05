import { Router } from 'express';
import { techPackagingController } from '../controllers';

const router = Router();

// 技术包装材料路由
router.post('/', techPackagingController.create.bind(techPackagingController));
router.get('/:id', techPackagingController.getById.bind(techPackagingController));
router.put('/:id', techPackagingController.update.bind(techPackagingController));
router.post('/:id/conversations', techPackagingController.addConversation.bind(techPackagingController));
router.delete('/:id/conversations', techPackagingController.removeConversation.bind(techPackagingController));
router.post('/:id/sources', techPackagingController.addSource.bind(techPackagingController));
router.delete('/:id/sources', techPackagingController.removeSource.bind(techPackagingController));

export default router;
