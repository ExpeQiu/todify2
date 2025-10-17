import { Request, Response } from 'express';
import { techPointModel } from '../models';
import { CreateTechPointDTO, UpdateTechPointDTO } from '../types/database';

export class TechPointController {
  /**
   * 创建技术点
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateTechPointDTO = req.body;
      const techPoint = await techPointModel.create(data);
      res.status(201).json({
        success: true,
        data: techPoint,
        message: '技术点创建成功'
      });
    } catch (error) {
      console.error('Create tech point error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '创建技术点失败'
      });
    }
  }

  /**
   * 获取技术点详情
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术点ID'
        });
      }

      const techPoint = await techPointModel.findById(id);
      if (!techPoint) {
        return res.status(404).json({
          success: false,
          message: '技术点不存在'
        });
      }

      res.json({
        success: true,
        data: techPoint
      });
    } catch (error) {
      console.error('Get tech point error:', error);
      res.status(500).json({
        success: false,
        message: '获取技术点失败'
      });
    }
  }

  /**
   * 获取技术点列表
   */
  async getAll(req: Request, res: Response) {
    try {
      console.log('TechPointController.getAll called with query:', req.query);
      
      const {
        page = 1,
        pageSize = 20,
        orderBy = 'created_at',
        orderDirection = 'DESC',
        status,
        category_id,
        parent_id,
        tech_type,
        priority
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
      if (category_id) {
        options.where.category_id = parseInt(category_id as string);
      }
      if (parent_id !== undefined) {
        options.where.parent_id = parent_id === 'null' ? null : parseInt(parent_id as string);
      }
      if (tech_type) {
        options.where.tech_type = tech_type;
      }
      if (priority) {
        options.where.priority = priority;
      }

      console.log('Query options:', options);
      
      const result = await techPointModel.findAll(options);
      console.log('Query result:', result);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get tech points error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
      res.status(500).json({
        success: false,
        message: '获取技术点列表失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 根据分类获取技术点
   */
  async getByCategoryId(req: Request, res: Response) {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: '无效的分类ID'
        });
      }

      const {
        page = 1,
        pageSize = 20,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = req.query;

      const options = {
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        orderBy: orderBy as string,
        orderDirection: orderDirection as 'ASC' | 'DESC'
      };

      const result = await techPointModel.findByCategoryId(categoryId, options);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get tech points by category error:', error);
      res.status(500).json({
        success: false,
        message: '获取分类技术点失败'
      });
    }
  }

  /**
   * 获取技术点树结构
   */
  async getTree(req: Request, res: Response) {
    try {
      const { category_id } = req.query;
      const categoryId = category_id ? parseInt(category_id as string) : undefined;
      
      const tree = await techPointModel.getTree(categoryId);
      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      console.error('Get tech point tree error:', error);
      res.status(500).json({
        success: false,
        message: '获取技术点树失败'
      });
    }
  }

  /**
   * 更新技术点
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术点ID'
        });
      }

      const data: UpdateTechPointDTO = req.body;
      const techPoint = await techPointModel.update(id, data);
      
      if (!techPoint) {
        return res.status(404).json({
          success: false,
          message: '技术点不存在'
        });
      }

      res.json({
        success: true,
        data: techPoint,
        message: '技术点更新成功'
      });
    } catch (error) {
      console.error('Update tech point error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新技术点失败'
      });
    }
  }

  /**
   * 删除技术点
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术点ID'
        });
      }

      const success = await techPointModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '技术点不存在'
        });
      }

      res.json({
        success: true,
        message: '技术点删除成功'
      });
    } catch (error) {
      console.error('Delete tech point error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '删除技术点失败'
      });
    }
  }

  /**
   * 搜索技术点
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

      const result = await techPointModel.search(keyword as string, options);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search tech points error:', error);
      res.status(500).json({
        success: false,
        message: '搜索技术点失败'
      });
    }
  }

  /**
   * 根据标签搜索技术点
   */
  async findByTags(req: Request, res: Response) {
    try {
      const { tags, page = 1, pageSize = 20 } = req.query;
      
      if (!tags) {
        return res.status(400).json({
          success: false,
          message: '标签不能为空'
        });
      }

      const tagArray = Array.isArray(tags) ? tags : [tags];
      const options = {
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string)
      };

      const result = await techPointModel.findByTags(tagArray as string[], options);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Find tech points by tags error:', error);
      res.status(500).json({
        success: false,
        message: '根据标签查找技术点失败'
      });
    }
  }

  /**
   * 获取技术点统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      console.log('TechPointController.getStats called');
      
      const stats = await techPointModel.getStats();
      console.log('Stats result:', stats);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get tech point stats error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
      res.status(500).json({
        success: false,
        message: '获取技术点统计失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取技术点关联的所有内容
   */
  async getAssociatedContent(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术点ID'
        });
      }

      const content = await techPointModel.getAssociatedContent(id);
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('Get associated content error:', error);
      res.status(500).json({
        success: false,
        message: '获取关联内容失败'
      });
    }
  }

  /**
   * 获取技术点关联的车型
   */
  async getAssociatedCarModels(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术点ID'
        });
      }

      const carModels = await techPointModel.getAssociatedCarModels(id);
      res.json({
        success: true,
        data: carModels
      });
    } catch (error) {
      console.error('Get associated car models error:', error);
      res.status(500).json({
        success: false,
        message: '获取关联车型失败'
      });
    }
  }

  /**
   * 关联车型到技术点
   */
  async associateCarModel(req: Request, res: Response) {
    try {
      const techPointId = parseInt(req.params.id);
      const { carModelId, applicationStatus, implementationDate, notes } = req.body;

      if (isNaN(techPointId)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术点ID'
        });
      }

      if (!carModelId) {
        return res.status(400).json({
          success: false,
          message: '车型ID不能为空'
        });
      }

      const result = await techPointModel.associateCarModel(
        techPointId, 
        carModelId, 
        applicationStatus,
        implementationDate,
        notes
      );

      res.status(201).json({
        success: true,
        data: result,
        message: '车型关联成功'
      });
    } catch (error) {
      console.error('Associate car model error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '关联车型失败'
      });
    }
  }

  /**
   * 取消车型与技术点的关联
   */
  async disassociateCarModel(req: Request, res: Response) {
    try {
      const techPointId = parseInt(req.params.id);
      const carModelId = parseInt(req.params.carModelId);

      if (isNaN(techPointId) || isNaN(carModelId)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID参数'
        });
      }

      const result = await techPointModel.disassociateCarModel(techPointId, carModelId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '关联关系不存在'
        });
      }

      res.json({
        success: true,
        message: '取消关联成功'
      });
    } catch (error) {
      console.error('Disassociate car model error:', error);
      res.status(500).json({
        success: false,
        message: '取消关联失败'
      });
    }
  }

  /**
   * 更新车型关联信息
   */
  async updateCarModelAssociation(req: Request, res: Response) {
    try {
      const techPointId = parseInt(req.params.id);
      const carModelId = parseInt(req.params.carModelId);
      const { applicationStatus, implementationDate, notes } = req.body;

      if (isNaN(techPointId) || isNaN(carModelId)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID参数'
        });
      }

      const result = await techPointModel.updateCarModelAssociation(
        techPointId,
        carModelId,
        applicationStatus,
        implementationDate,
        notes
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: '关联关系不存在'
        });
      }

      res.json({
        success: true,
        data: result,
        message: '关联信息更新成功'
      });
    } catch (error) {
      console.error('Update car model association error:', error);
      res.status(500).json({
        success: false,
        message: '更新关联信息失败'
      });
    }
  }
}