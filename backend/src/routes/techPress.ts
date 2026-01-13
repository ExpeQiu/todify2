/**
 * ⚠️ 警告: 此路由已废弃
 * 
 * tech_press_releases 表已从数据库中移除。
 * 技术通稿现在采用JSON存储策略，数据存储在 workflow_executions.outputs 字段中。
 * 
 * 此路由的所有端点将无法正常工作，因为对应的表不存在。
 * 如需使用技术通稿数据，请使用 workflow_executions API。
 * 
 * @deprecated 此路由已废弃，请使用 workflow_executions API
 */

import { Router } from 'express';
import { techPressController } from '../controllers';

const router = Router();

// ⚠️ 已废弃: 技术通稿路由（表已移除）
router.post('/', techPressController.create.bind(techPressController));
router.get('/:id', techPressController.getById.bind(techPressController));
router.put('/:id', techPressController.update.bind(techPressController));
router.post('/:id/conversations', techPressController.addConversation.bind(techPressController));
router.delete('/:id/conversations', techPressController.removeConversation.bind(techPressController));
router.post('/:id/sources', techPressController.addSource.bind(techPressController));
router.delete('/:id/sources', techPressController.removeSource.bind(techPressController));

export default router;
