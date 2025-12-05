import { Router } from 'express';
import { publicKnowledgeController } from '../controllers';

const router = Router();

// 分类路由
router.get('/categories/tree', publicKnowledgeController.getCategoryTree.bind(publicKnowledgeController));
router.get('/categories', publicKnowledgeController.getAllCategories.bind(publicKnowledgeController));
router.get('/categories/:id', publicKnowledgeController.getCategoryById.bind(publicKnowledgeController));
router.post('/categories', publicKnowledgeController.createCategory.bind(publicKnowledgeController));
router.put('/categories/:id', publicKnowledgeController.updateCategory.bind(publicKnowledgeController));
router.delete('/categories/:id', publicKnowledgeController.deleteCategory.bind(publicKnowledgeController));

// 文件路由
router.get('/files', publicKnowledgeController.getFiles.bind(publicKnowledgeController));
router.get('/files/:id', publicKnowledgeController.getFileById.bind(publicKnowledgeController));
router.post('/upload', publicKnowledgeController.uploadFile.bind(publicKnowledgeController));
router.put('/files/:id', publicKnowledgeController.updateFile.bind(publicKnowledgeController));
router.delete('/files/:id', publicKnowledgeController.deleteFile.bind(publicKnowledgeController));
router.get('/files/:id/download', publicKnowledgeController.downloadFile.bind(publicKnowledgeController));

export default router;
