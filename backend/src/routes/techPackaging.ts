/**
 * ⚠️ 警告: 此路由已废弃
 * 
 * tech_packaging_materials 表已从数据库中移除。
 * 技术包装材料现在采用JSON存储策略，数据存储在 workflow_executions.outputs 字段中。
 * 
 * 此路由的所有端点将无法正常工作，因为对应的表不存在。
 * 如需使用技术包装材料数据，请使用 workflow_executions API。
 * 
 * @deprecated 此路由已废弃，请使用 workflow_executions API
 */

import { Router } from 'express';
import { techPackagingController } from '../controllers';

const router = Router();

// ⚠️ 已废弃: 技术包装材料路由（表已移除）
router.post('/', techPackagingController.create.bind(techPackagingController));
router.get('/:id', techPackagingController.getById.bind(techPackagingController));
router.put('/:id', techPackagingController.update.bind(techPackagingController));
router.post('/:id/conversations', techPackagingController.addConversation.bind(techPackagingController));
router.delete('/:id/conversations', techPackagingController.removeConversation.bind(techPackagingController));
router.post('/:id/sources', techPackagingController.addSource.bind(techPackagingController));
router.delete('/:id/sources', techPackagingController.removeSource.bind(techPackagingController));

export default router;
