import { Request, Response } from 'express';
import { TechnologyModel, CreateTechnologyDTO, UpdateTechnologyDTO } from '../models/Technology';
import { db } from '../config/database';

export class TechnologyController {
  private technologyModel: TechnologyModel;

  constructor() {
    this.technologyModel = new TechnologyModel(db);
  }

  /**
   * 创建技术IP
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateTechnologyDTO = req.body;
      
      // 验证必填字段
      if (!data.name) {
        return res.status(400).json({
          success: false,
          message: '技术IP名称为必填字段'
        });
      }

      const technology = await this.technologyModel.create(data);
      
      res.status(201).json({
        success: true,
        message: '技术IP创建成功',
        data: technology
      });
    } catch (error: any) {
      console.error('创建技术IP失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建技术IP失败'
      });
    }
  }

  /**
   * 获取所有技术IP
   */
  async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const options: any = {};
      
      if (status) {
        options.where = { status: status as string };
      }

      const result = await this.technologyModel.findAll(options);
      
      res.json({
        success: true,
        data: result.technologies || []
      });
    } catch (error: any) {
      console.error('获取技术IP列表失败:', error);
      // 如果表不存在，返回空数组
      if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
        return res.json({
          success: true,
          data: []
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '获取技术IP列表失败'
      });
    }
  }

  /**
   * 根据ID获取技术IP
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术IP ID'
        });
      }

      const technology = await this.technologyModel.findById(id);
      
      res.json({
        success: true,
        data: technology
      });
    } catch (error: any) {
      console.error('获取技术IP详情失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取技术IP详情失败'
      });
    }
  }

  /**
   * 更新技术IP
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术IP ID'
        });
      }

      const data: UpdateTechnologyDTO = req.body;
      const technology = await this.technologyModel.update(id, data);
      
      res.json({
        success: true,
        message: '技术IP更新成功',
        data: technology
      });
    } catch (error: any) {
      console.error('更新技术IP失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新技术IP失败'
      });
    }
  }

  /**
   * 删除技术IP
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的技术IP ID'
        });
      }

      await this.technologyModel.delete(id);
      
      res.json({
        success: true,
        message: '技术IP删除成功'
      });
    } catch (error: any) {
      console.error('删除技术IP失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除技术IP失败'
      });
    }
  }
}

export const technologyController = new TechnologyController();

