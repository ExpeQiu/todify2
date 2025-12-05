import { Router } from 'express';
import { techPromotionController } from '../controllers';

const router = Router();

// 技术推广策略路由
router.post('/', techPromotionController.create.bind(techPromotionController));
router.get('/:id', techPromotionController.getById.bind(techPromotionController));
router.put('/:id', techPromotionController.update.bind(techPromotionController));
router.post('/:id/conversations', techPromotionController.addConversation.bind(techPromotionController));
router.delete('/:id/conversations', techPromotionController.removeConversation.bind(techPromotionController));
router.post('/:id/sources', techPromotionController.addSource.bind(techPromotionController));
router.delete('/:id/sources', techPromotionController.removeSource.bind(techPromotionController));

export default router;
