import { Request, Response } from 'express';
import { publicKnowledgeService } from '../services/publicKnowledgeService';
import { logger } from '../shared/lib/logger';
import multer from 'multer';

// 配置 multer 内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

export class PublicKnowledgeController {
  /**
   * 获取分类树
   */
  async getCategoryTree(req: Request, res: Response) {
    try {
      const tree = await publicKnowledgeService.getCategoryTree();
      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      logger.error('获取分类树失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取分类树失败'
      });
    }
  }

  /**
   * 获取所有分类
   */
  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await publicKnowledgeService.getAllCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('获取分类列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类列表失败'
      });
    }
  }

  /**
   * 获取分类详情
   */
  async getCategoryById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的分类ID'
        });
      }

      const category = await publicKnowledgeService.getCategoryById(id);
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error('获取分类详情失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取分类详情失败'
      });
    }
  }

  /**
   * 创建分类
   */
  async createCategory(req: Request, res: Response) {
    try {
      const { name, parent_id, sort_order } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '分类名称不能为空'
        });
      }

      const category = await publicKnowledgeService.createCategory({
        name,
        parent_id: parent_id !== undefined ? (parent_id === null ? null : parseInt(parent_id)) : undefined,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : undefined
      });

      res.status(201).json({
        success: true,
        data: category,
        message: '分类创建成功'
      });
    } catch (error) {
      logger.error('创建分类失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '创建分类失败'
      });
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的分类ID'
        });
      }

      const { name, parent_id, sort_order } = req.body;

      const category = await publicKnowledgeService.updateCategory(id, {
        name,
        parent_id: parent_id !== undefined ? (parent_id === null ? null : parseInt(parent_id)) : undefined,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : undefined
      });

      res.json({
        success: true,
        data: category,
        message: '分类更新成功'
      });
    } catch (error) {
      logger.error('更新分类失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新分类失败'
      });
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的分类ID'
        });
      }

      await publicKnowledgeService.deleteCategory(id);
      res.json({
        success: true,
        message: '分类删除成功'
      });
    } catch (error) {
      logger.error('删除分类失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '删除分类失败'
      });
    }
  }

  /**
   * 获取文件列表
   */
  async getFiles(req: Request, res: Response) {
    try {
      const { category_id } = req.query;
      const categoryId = category_id === undefined 
        ? undefined 
        : category_id === 'null' || category_id === null 
          ? null 
          : parseInt(category_id as string);

      const files = await publicKnowledgeService.getFiles(categoryId);
      res.json({
        success: true,
        data: files
      });
    } catch (error) {
      logger.error('获取文件列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取文件列表失败'
      });
    }
  }

  /**
   * 获取文件详情
   */
  async getFileById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的文件ID'
        });
      }

      const file = await publicKnowledgeService.getFileById(id);
      res.json({
        success: true,
        data: file
      });
    } catch (error) {
      logger.error('获取文件详情失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取文件详情失败'
      });
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(req: Request, res: Response) {
    try {
      const uploadMiddleware = upload.single('file');
      
      uploadMiddleware(req, res, async (err) => {
        if (err) {
          logger.error('文件上传失败:', err);
          return res.status(400).json({
            success: false,
            message: err.message || '文件上传失败'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: '未选择文件'
          });
        }

        try {
          const { category_id, description, uploaded_by } = req.body;
          const categoryId = category_id !== undefined 
            ? (category_id === 'null' || category_id === null ? null : parseInt(category_id))
            : undefined;
          const uploadedBy = uploaded_by ? parseInt(uploaded_by) : undefined;

          const file = await publicKnowledgeService.saveUploadedFile(
            req.file,
            categoryId,
            description,
            uploadedBy
          );

          res.status(201).json({
            success: true,
            data: file,
            message: '文件上传成功'
          });
        } catch (error) {
          logger.error('保存文件失败:', error);
          res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '保存文件失败'
          });
        }
      });
    } catch (error) {
      logger.error('上传文件失败:', error);
      res.status(500).json({
        success: false,
        message: '上传文件失败'
      });
    }
  }

  /**
   * 更新文件
   */
  async updateFile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的文件ID'
        });
      }

      const { category_id, name, description } = req.body;

      const file = await publicKnowledgeService.updateFile(id, {
        category_id: category_id !== undefined 
          ? (category_id === 'null' || category_id === null ? null : parseInt(category_id))
          : undefined,
        name,
        description
      });

      res.json({
        success: true,
        data: file,
        message: '文件更新成功'
      });
    } catch (error) {
      logger.error('更新文件失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新文件失败'
      });
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的文件ID'
        });
      }

      await publicKnowledgeService.deleteFile(id);
      res.json({
        success: true,
        message: '文件删除成功'
      });
    } catch (error) {
      logger.error('删除文件失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '删除文件失败'
      });
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的文件ID'
        });
      }

      const { stream, file } = await publicKnowledgeService.getFileStream(id);

      res.setHeader('Content-Type', file.file_type);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.setHeader('Content-Length', file.file_size);

      stream.pipe(res);
    } catch (error) {
      logger.error('下载文件失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '下载文件失败'
      });
    }
  }

  /**
   * 获取文件（用于直接访问）
   * 注意：这个路由实际上由静态文件服务处理，但保留作为备用
   */
  async getFile(req: Request, res: Response) {
    try {
      const filename = req.params.filename;
      const filePath = require('path').join(publicKnowledgeService.getUploadDir(), filename);

      if (!require('fs').existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error('获取文件失败:', error);
      res.status(500).json({
        success: false,
        message: '获取文件失败'
      });
    }
  }
}

export const publicKnowledgeController = new PublicKnowledgeController();
