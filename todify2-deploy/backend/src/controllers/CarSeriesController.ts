import { Request, Response } from 'express';
import { CarSeriesModel } from '../models/CarSeries';
import { CreateCarSeriesDTO, UpdateCarSeriesDTO, CarSeriesStatus } from '../models/CarSeries';

export class CarSeriesController {
  private carSeriesModel: CarSeriesModel;

  constructor() {
    this.carSeriesModel = new CarSeriesModel();
  }

  /**
   * 创建车系
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateCarSeriesDTO = req.body;
      
      // 验证必填字段
      if (!data.model_id || !data.name) {
        return res.status(400).json({
          success: false,
          message: '车型ID和车系名称为必填字段'
        });
      }

      const carSeries = await this.carSeriesModel.create(data);
      
      res.status(201).json({
        success: true,
        message: '车系创建成功',
        data: carSeries
      });
    } catch (error: any) {
      console.error('创建车系失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建车系失败'
      });
    }
  }

  /**
   * 根据ID获取车系
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const includeModel = req.query.includeModel === 'true';
      const includeBrand = req.query.includeBrand === 'true';
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车系ID'
        });
      }

      const carSeries = await this.carSeriesModel.findById(id, includeModel, includeBrand);
      
      if (!carSeries) {
        return res.status(404).json({
          success: false,
          message: '车系不存在'
        });
      }

      res.json({
        success: true,
        data: carSeries
      });
    } catch (error: any) {
      console.error('获取车系失败:', error);
      res.status(500).json({
        success: false,
        message: '获取车系失败'
      });
    }
  }

  /**
   * 获取所有车系
   */
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const orderBy = req.query.orderBy as string || 'created_at';
      const orderDirection = (req.query.orderDirection as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const status = req.query.status as CarSeriesStatus;
      const modelId = req.query.modelId ? parseInt(req.query.modelId as string) : undefined;
      const brandId = req.query.brandId ? parseInt(req.query.brandId as string) : undefined;
      const includeModel = req.query.includeModel === 'true';
      const includeBrand = req.query.includeBrand === 'true';

      const options = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy,
        orderDirection: orderDirection as 'ASC' | 'DESC',
        where: {} as any,
        includeModel,
        includeBrand
      };

      if (status) {
        options.where.status = status;
      }
      if (modelId) {
        options.where.model_id = modelId;
      }

      let result;
      if (brandId) {
        result = await this.carSeriesModel.findByBrandId(brandId, options);
      } else {
        result = await this.carSeriesModel.findAll(options);
      }
      
      res.json({
        success: true,
        data: result.carSeries,
        pagination: {
          page,
          pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / pageSize)
        }
      });
    } catch (error: any) {
      console.error('获取车系列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取车系列表失败'
      });
    }
  }

  /**
   * 根据车型获取车系
   */
  async getByModel(req: Request, res: Response) {
    try {
      const modelId = parseInt(req.params.modelId);
      
      if (isNaN(modelId)) {
        return res.status(400).json({
          success: false,
          message: '无效的车型ID'
        });
      }

      const result = await this.carSeriesModel.findByModelId(modelId);
      
      res.json({
        success: true,
        data: result.carSeries,
        total: result.total
      });
    } catch (error: any) {
      console.error('根据车型获取车系失败:', error);
      res.status(500).json({
        success: false,
        message: '根据车型获取车系失败'
      });
    }
  }

  /**
   * 根据品牌获取车系
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

      const result = await this.carSeriesModel.findByBrandId(brandId);
      
      res.json({
        success: true,
        data: result.carSeries,
        total: result.total
      });
    } catch (error: any) {
      console.error('根据品牌获取车系失败:', error);
      res.status(500).json({
        success: false,
        message: '根据品牌获取车系失败'
      });
    }
  }

  /**
   * 更新车系
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车系ID'
        });
      }

      const data: UpdateCarSeriesDTO = req.body;
      const carSeries = await this.carSeriesModel.update(id, data);
      
      res.json({
        success: true,
        message: '车系更新成功',
        data: carSeries
      });
    } catch (error: any) {
      console.error('更新车系失败:', error);
      if (error.message === '车系不存在') {
        return res.status(404).json({
          success: false,
          message: '车系不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '更新车系失败'
      });
    }
  }

  /**
   * 软删除车系
   */
  async softDelete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车系ID'
        });
      }

      await this.carSeriesModel.softDelete(id);
      
      res.json({
        success: true,
        message: '车系已停用'
      });
    } catch (error: any) {
      console.error('停用车系失败:', error);
      if (error.message === '车系不存在') {
        return res.status(404).json({
          success: false,
          message: '车系不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '停用车系失败'
      });
    }
  }

  /**
   * 删除车系
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车系ID'
        });
      }

      await this.carSeriesModel.delete(id);
      
      res.json({
        success: true,
        message: '车系删除成功'
      });
    } catch (error: any) {
      console.error('删除车系失败:', error);
      if (error.message === '车系不存在') {
        return res.status(404).json({
          success: false,
          message: '车系不存在'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '删除车系失败'
      });
    }
  }

  /**
   * 搜索车系
   */
  async search(req: Request, res: Response) {
    try {
      const {
        keyword,
        page = 1,
        pageSize = 10,
        status,
        modelId,
        brandId,
        includeModel = false,
        includeBrand = false
      } = req.query;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词不能为空'
        });
      }

      const options = {
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        where: {} as any,
        includeModel: includeModel === 'true',
        includeBrand: includeBrand === 'true'
      };

      if (status) {
        options.where.status = status;
      }
      if (modelId) {
        options.where.model_id = parseInt(modelId as string);
      }
      if (brandId) {
        options.where.brand_id = parseInt(brandId as string);
      }

      const result = await this.carSeriesModel.search(keyword as string, options);
      
      res.json({
        success: true,
        data: result.carSeries,
        pagination: {
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(pageSize as string))
        }
      });
    } catch (error: any) {
      console.error('搜索车系失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索车系失败'
      });
    }
  }

  /**
   * 获取车系统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.carSeriesModel.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('获取车系统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取车系统计失败'
      });
    }
  }

  /**
   * 获取车系关联的技术点
   */
  async getTechPoints(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车系ID'
        });
      }

      const techPoints = await this.carSeriesModel.getTechPoints(id);
      
      res.json({
        success: true,
        data: techPoints
      });
    } catch (error: any) {
      console.error('获取车系技术点失败:', error);
      res.status(500).json({
        success: false,
        message: '获取车系技术点失败'
      });
    }
  }
}

export const carSeriesController = new CarSeriesController();