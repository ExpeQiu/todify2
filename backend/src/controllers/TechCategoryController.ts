import { Request, Response } from 'express';
import { techCategoryModel } from '../models';
import { CreateTechCategoryDTO, UpdateTechCategoryDTO } from '../types/database';

export class TechCategoryController {
  /**
   * 创建技术分类
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateTechCategoryDTO = req.body;
      const category = await techCategoryModel.create(data);
      res.status(201).json({
        success: true,
        data: category,
        message: '技术分类创建成功'
      });
    } catch (error) {
      console.error('Create tech category error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '创建技术分类失败'
      });
    }
  }

  /**
   * 获取技术分类详情
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的分类ID'
        });
      }

      const category = await techCategoryModel.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: '技术分类不存在'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Get tech category error:', error);
      res.status(500).json({
        success: false,
        message: '获取技术分类失败'
      });
    }
  }

  /**
   * 获取技术分类列表
   */
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        pageSize = 20,
        orderBy = 'sort_order',
        orderDirection = 'ASC',
        status,
        parent_id
      } = req.query;

      const options = {
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        orderBy: orderBy as string,
        orderDirection: orderDirection as 'ASC' | 'DESC',
        where: {} as any
      };

      if (status) {
        options.where.status = status;
      }

      if (parent_id !== undefined) {
        options.where.parent_id = parent_id === 'null' ? null : parseInt(parent_id as string);
      }

      const result = await techCategoryModel.findAll(options);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get tech categories error:', error);
      res.status(500).json({
        success: false,
        message: '获取技术分类列表失败'
      });
    }
  }

  /**
   * 获取技术分类树结构
   */
  async getTree(req: Request, res: Response) {
    try {
      const tree = await techCategoryModel.getTree();
      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      console.error('Get tech category tree error:', error);
      res.status(500).json({
        success: false,
        message: '获取技术分类树失败'
      });
    }
  }

  /**
   * 更新技术分类
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的分类ID'
        });
      }

      const data: UpdateTechCategoryDTO = req.body;
      const category = await techCategoryModel.update(id, data);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: '技术分类不存在'
        });
      }

      res.json({
        success: true,
        data: category,
        message: '技术分类更新成功'
      });
    } catch (error) {
      console.error('Update tech category error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新技术分类失败'
      });
    }
  }

  /**
   * 删除技术分类
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的分类ID'
        });
      }

      const success = await techCategoryModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '技术分类不存在'
        });
      }

      res.json({
        success: true,
        message: '技术分类删除成功'
      });
    } catch (error) {
      console.error('Delete tech category error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '删除技术分类失败'
      });
    }
  }

  /**
   * 搜索技术分类
   */
  async search(req: Request, res: Response) {
    try {
      const { keyword, page = 1, pageSize = 20 } = req.query;
      
      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词不能为空'
        });
      }

      const options = {
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string)
      };

      const result = await techCategoryModel.search(keyword as string, options);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search tech categories error:', error);
      res.status(500).json({
        success: false,
        message: '搜索技术分类失败'
      });
    }
  }

  /**
   * 批量更新排序
   */
  async updateSortOrder(req: Request, res: Response) {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: '无效的排序数据'
        });
      }

      await techCategoryModel.updateSortOrder(items);
      res.json({
        success: true,
        message: '排序更新成功'
      });
    } catch (error) {
      console.error('Update sort order error:', error);
      res.status(500).json({
        success: false,
        message: '更新排序失败'
      });
    }
  }
}