import { Request, Response } from 'express';
import { CarModelModel } from '../models/CarModel';
import { CreateCarModelDTO, UpdateCarModelDTO, CarModelStatus } from '../models/CarModel';

export class CarModelController {
  private carModelModel: CarModelModel;

  constructor() {
    this.carModelModel = new CarModelModel();
  }

  /**
   * 创建车型
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateCarModelDTO = req.body;
      
      // 验证必填字段
      if (!data.brand_id || !data.name) {
        return res.status(400).json({
          success: false,
          message: '品牌ID和车型名称为必填字段'
        });
      }

      const carModel = await this.carModelModel.create(data);
      
      res.status(201).json({
        success: true,
        message: '车型创建成功',
        data: carModel
      });
    } catch (error: any) {
      console.error('创建车型失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建车型失败'
      });
    }
  }

  /**
   * 根据ID获取车型
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const includeBrand = req.query.includeBrand === 'true';
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车型ID'
        });
      }

      const carModel = await this.carModelModel.findById(id, includeBrand);
      
      if (!carModel) {
        return res.status(404).json({
          success: false,
          message: '车型不存在'
        });
      }

      res.json({
        success: true,
        data: carModel
      });
    } catch (error: any) {
      console.error('获取车型失败:', error);
      res.status(500).json({
        success: false,
        message: '获取车型失败'
      });
    }
  }

  /**
   * 获取所有车型
   */
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const orderBy = req.query.orderBy as string || 'created_at';
      const orderDirection = (req.query.orderDirection as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const status = req.query.status as CarModelStatus;
      const brandId = req.query.brandId ? parseInt(req.query.brandId as string) : undefined;
      const category = req.query.category as string;
      const launchYear = req.query.launchYear ? parseInt(req.query.launchYear as string) : undefined;
      const includeBrand = req.query.includeBrand === 'true';

      const options = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy,
        orderDirection: orderDirection as 'ASC' | 'DESC',
        where: {} as any,
        includeBrand
      };

      if (status) {
        options.where.status = status;
      }
      if (brandId) {
        options.where.brand_id = brandId;
      }
      if (category) {
        options.where.category = category;
      }
      if (launchYear) {
        options.where.launch_year = launchYear;
      }

      let result;
      if (brandId) {
        result = await this.carModelModel.findByBrandId(brandId, options);
      } else {
        result = await this.carModelModel.findAll(options);
      }
      
      res.json({
        success: true,
        data: result.carModels,
        pagination: {
          page,
          pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / pageSize)
        }
      });
    } catch (error: any) {
      console.error('获取车型列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取车型列表失败'
      });
    }
  }

  /**
   * 根据品牌获取车型
   */
  async getByBrand(req: Request, res: Response) {
    try {
      const brandId = parseInt(req.params.brandId);
      
      if (isNaN(brandId)) {
        return res.status(400).json({
          success: false,
          message: '无效的品牌ID'
        });
      }

      const result = await this.carModelModel.findByBrandId(brandId);
      
      res.json({
        success: true,
        data: result.carModels,
        total: result.total
      });
    } catch (error: any) {
      console.error('根据品牌获取车型失败:', error);
      res.status(500).json({
        success: false,
        message: '根据品牌获取车型失败'
      });
    }
  }

  /**
   * 更新车型
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车型ID'
        });
      }

      const data: UpdateCarModelDTO = req.body;
      const carModel = await this.carModelModel.update(id, data);
      
      res.json({
        success: true,
        message: '车型更新成功',
        data: carModel
      });
    } catch (error: any) {
      console.error('更新车型失败:', error);
      if (error.message === '车型不存在') {
        return res.status(404).json({
          success: false,
          message: '车型不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '更新车型失败'
      });
    }
  }

  /**
   * 删除车型
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车型ID'
        });
      }

      await this.carModelModel.delete(id);
      
      res.json({
        success: true,
        message: '车型删除成功'
      });
    } catch (error: any) {
      console.error('删除车型失败:', error);
      if (error.message === '车型不存在') {
        return res.status(404).json({
          success: false,
          message: '车型不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '删除车型失败'
      });
    }
  }

  /**
   * 获取车型统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.carModelModel.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('获取车型统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取车型统计失败'
      });
    }
  }
}

export const carModelController = new CarModelController();