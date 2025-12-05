import { Request, Response } from 'express';
import { techPromotionStrategyModel } from '../models';
import { CreateTechPromotionStrategyDTO, UpdateTechPromotionStrategyDTO } from '../types/database';

export class TechPromotionController {
  /**
   * 创建技术推广策略
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateTechPromotionStrategyDTO = req.body;
      const strategy = await techPromotionStrategyModel.create(data);
      res.status(201).json({
        success: true,
        data: strategy,
        message: '技术推广策略创建成功'
      });
    } catch (error) {
      console.error('Create tech promotion error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '创建技术推广策略失败'
      });
    }
  }

  /**
   * 获取技术推广策略详情
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID'
        });
      }

      const strategy = await techPromotionStrategyModel.findById(id);
      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: '技术推广策略不存在'
        });
      }

      // 获取关联的对话和来源
      const [conversations, sources] = await Promise.all([
        techPromotionStrategyModel.getConversations(id),
        techPromotionStrategyModel.getSources(id)
      ]);

      res.json({
        success: true,
        data: {
          ...strategy,
          conversations,
          sources
        }
      });
    } catch (error) {
      console.error('Get tech promotion error:', error);
      res.status(500).json({
        success: false,
        message: '获取技术推广策略失败'
      });
    }
  }

  /**
   * 更新技术推广策略
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID'
        });
      }

      const data: UpdateTechPromotionStrategyDTO = req.body;
      const strategy = await techPromotionStrategyModel.update(id, data);
      
      if (!strategy) {
        return res.status(404).json({
          success: false,
          message: '技术推广策略不存在'
        });
      }

      res.json({
        success: true,
        data: strategy,
        message: '技术推广策略更新成功'
      });
    } catch (error) {
      console.error('Update tech promotion error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新技术推广策略失败'
      });
    }
  }

  /**
   * 添加对话关联
   */
  async addConversation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID'
        });
      }

      const { conversationId, notes } = req.body;
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: '缺少 conversationId 参数'
        });
      }

      const success = await techPromotionStrategyModel.addConversation(id, conversationId, notes);
      if (success) {
        res.json({
          success: true,
          message: '对话关联添加成功'
        });
      } else {
        res.status(400).json({
          success: false,
          message: '对话关联添加失败，可能已存在'
        });
      }
    } catch (error) {
      console.error('Add conversation error:', error);
      res.status(500).json({
        success: false,
        message: '添加对话关联失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 移除对话关联
   */
  async removeConversation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID'
        });
      }

      const { conversationId } = req.body;
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: '缺少 conversationId 参数'
        });
      }

      const success = await techPromotionStrategyModel.removeConversation(id, conversationId);
      if (success) {
        res.json({
          success: true,
          message: '对话关联移除成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '对话关联不存在'
        });
      }
    } catch (error) {
      console.error('Remove conversation error:', error);
      res.status(500).json({
        success: false,
        message: '移除对话关联失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 添加来源信息关联
   */
  async addSource(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID'
        });
      }

      const { sourceId, notes } = req.body;
      if (!sourceId) {
        return res.status(400).json({
          success: false,
          message: '缺少 sourceId 参数'
        });
      }

      const success = await techPromotionStrategyModel.addSource(id, sourceId, notes);
      if (success) {
        res.json({
          success: true,
          message: '来源信息关联添加成功'
        });
      } else {
        res.status(400).json({
          success: false,
          message: '来源信息关联添加失败，可能已存在'
        });
      }
    } catch (error) {
      console.error('Add source error:', error);
      res.status(500).json({
        success: false,
        message: '添加来源信息关联失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 移除来源信息关联
   */
  async removeSource(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的ID'
        });
      }

      const { sourceId } = req.body;
      if (!sourceId) {
        return res.status(400).json({
          success: false,
          message: '缺少 sourceId 参数'
        });
      }

      const success = await techPromotionStrategyModel.removeSource(id, sourceId);
      if (success) {
        res.json({
          success: true,
          message: '来源信息关联移除成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '来源信息关联不存在'
        });
      }
    } catch (error) {
      console.error('Remove source error:', error);
      res.status(500).json({
        success: false,
        message: '移除来源信息关联失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
