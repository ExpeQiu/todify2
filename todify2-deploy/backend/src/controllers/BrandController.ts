import { Request, Response } from 'express';
import { BrandModel } from '../models/brand';
import { CreateBrandDTO, UpdateBrandDTO, BrandStatus } from '../models/brand';

export class BrandController {
  private brandModel: BrandModel;

  constructor() {
    this.brandModel = new BrandModel();
  }

  /**
   * 创建品牌
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateBrandDTO = req.body;
      
      // 验证必填字段
      if (!data.name) {
        return res.status(400).json({
          success: false,
          message: '品牌名称为必填字段'
        });
      }

      const brand = await this.brandModel.create(data);
      
      res.status(201).json({
        success: true,
        message: '品牌创建成功',
        data: brand
      });
    } catch (error: any) {
      console.error('创建品牌失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建品牌失败'
      });
    }
  }

  /**
   * 根据ID获取品牌
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的品牌ID'
        });
      }

      const brand = await this.brandModel.findById(id);
      
      res.json({
        success: true,
        data: brand
      });
    } catch (error: any) {
      console.error('获取品牌失败:', error);
      if (error.message === '品牌不存在') {
        return res.status(404).json({
          success: false,
          message: '品牌不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: '获取品牌失败'
      });
    }
  }

  /**
   * 获取所有品牌
   */
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const orderBy = req.query.orderBy as string || 'created_at';
      const orderDirection = (req.query.orderDirection as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const status = req.query.status as BrandStatus;
      const name = req.query.name as string;
      const country = req.query.country as string;

      const options = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy,
        orderDirection: orderDirection as 'ASC' | 'DESC',
        where: {} as any
      };

      if (status) {
        options.where.status = status;
      }
      if (name) {
        options.where.name = name;
      }
      if (country) {
        options.where.country = country;
      }

      const result = await this.brandModel.findAll(options);
      
      res.json({
        success: true,
        data: result.brands,
        pagination: {
          page,
          pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / pageSize)
        }
      });
    } catch (error: any) {
      console.error('获取品牌列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取品牌列表失败'
      });
    }
  }

  /**
   * 根据名称查找品牌
   */
  async getByName(req: Request, res: Response) {
    try {
      const name = req.params.name;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: '品牌名称参数为必填'
        });
      }

      const brand = await this.brandModel.findByName(name);
      
      res.json({
        success: true,
        data: brand
      });
    } catch (error: any) {
      console.error('根据名称获取品牌失败:', error);
      if (error.message === '品牌不存在') {
        return res.status(404).json({
          success: false,
          message: '品牌不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: '根据名称获取品牌失败'
      });
    }
  }

  /**
   * 更新品牌
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的品牌ID'
        });
      }

      const data: UpdateBrandDTO = req.body;
      const brand = await this.brandModel.update(id, data);
      
      res.json({
        success: true,
        message: '品牌更新成功',
        data: brand
      });
    } catch (error: any) {
      console.error('更新品牌失败:', error);
      if (error.message === '品牌不存在') {
        return res.status(404).json({
          success: false,
          message: '品牌不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '更新品牌失败'
      });
    }
  }

  /**
   * 删除品牌
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的品牌ID'
        });
      }

      await this.brandModel.delete(id);
      
      res.json({
        success: true,
        message: '品牌删除成功'
      });
    } catch (error: any) {
      console.error('删除品牌失败:', error);
      if (error.message === '品牌不存在') {
        return res.status(404).json({
          success: false,
          message: '品牌不存在'
        });
      }
      if (error.message.includes('存在关联的车型')) {
        return res.status(400).json({
          success: false,
          message: '无法删除品牌，存在关联的车型'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '删除品牌失败'
      });
    }
  }

  /**
   * 获取品牌统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.brandModel.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('获取品牌统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取品牌统计失败'
      });
    }
  }
}

export const brandController = new BrandController();