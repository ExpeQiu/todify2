/**
 * ⚠️ 警告: 此路由已废弃
 * 
 * tech_promotion_strategies 表已从数据库中移除。
 * 技术推广策略现在采用JSON存储策略，数据存储在 workflow_executions.outputs 字段中。
 * 
 * 此路由的所有端点将无法正常工作，因为对应的表不存在。
 * 如需使用技术推广策略数据，请使用 workflow_executions API。
 * 
 * @deprecated 此路由已废弃，请使用 workflow_executions API
 */

import { Router } from 'express';
import { techPromotionController } from '../controllers';

const router = Router();

// ⚠️ 已废弃: 技术推广策略路由（表已移除）
router.post('/', techPromotionController.create.bind(techPromotionController));
router.get('/:id', techPromotionController.getById.bind(techPromotionController));
router.put('/:id', techPromotionController.update.bind(techPromotionController));
router.post('/:id/conversations', techPromotionController.addConversation.bind(techPromotionController));
router.delete('/:id/conversations', techPromotionController.removeConversation.bind(techPromotionController));
router.post('/:id/sources', techPromotionController.addSource.bind(techPromotionController));
router.delete('/:id/sources', techPromotionController.removeSource.bind(techPromotionController));

export default router;
