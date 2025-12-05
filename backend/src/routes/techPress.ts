import { Router } from 'express';
import { techPressController } from '../controllers';

const router = Router();

// 技术通稿路由
router.post('/', techPressController.create.bind(techPressController));
router.get('/:id', techPressController.getById.bind(techPressController));
router.put('/:id', techPressController.update.bind(techPressController));
router.post('/:id/conversations', techPressController.addConversation.bind(techPressController));
router.delete('/:id/conversations', techPressController.removeConversation.bind(techPressController));
router.post('/:id/sources', techPressController.addSource.bind(techPressController));
router.delete('/:id/sources', techPressController.removeSource.bind(techPressController));

export default router;
