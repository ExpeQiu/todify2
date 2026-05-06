import { Request, Response } from 'express';
import { CarModelModel, CreateCarModelDTO, UpdateCarModelDTO } from '../models/CarModel';
import { sharedDataService } from '../services/SharedDataService';

export class CarModelController {
  private carModelModel: CarModelModel;

  constructor() {
    this.carModelModel = new CarModelModel();
  }

  /**
   * 创建车型（⚠️ 已废弃 - shared.vehicles 为数据源，不应直接创建）
   */
  async create(req: Request, res: Response) {
    try {
      // ⚠️ DEPRECATED: 车型数据现在从 shared.vehicles 读取
      // 不应直接创建新车型的写操作被拒绝
      res.status(410).json({
        success: false,
        message: '[已废弃] 车型数据从 shared.vehicles 读取，不允许直接创建。请通过数据管理流程添加车型。',
        deprecated: true
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
   * 获取所有车型（从 shared.vehicles 读取）
   */
  async getAll(req: Request, res: Response) {
    try {
      const { brand, status, keyword, page = 1, pageSize = 20 } = req.query;
      
      const result = await sharedDataService.getVehicles({
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        brand: brand as string | undefined,
        status: status as string | undefined,
        keyword: keyword as string | undefined
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      console.error('获取车型列表失败:', error);
      // 如果是 PostgreSQL 错误，尝试回退到本地模型
      if (error.message?.includes('PostgreSQL') || error.message?.includes('shared')) {
        console.warn('shared schema 不可用，回退到本地 carModelModel');
        const options: any = {};
        if (req.query.brand_id) {
          options.where = { brand_id: parseInt(req.query.brand_id as string) };
        }
        if (req.query.status) {
          options.where = { ...options.where, status: req.query.status as string };
        }
        try {
          const result = await this.carModelModel.findAll(options);
          return res.json({
            success: true,
            data: result.carModels,
            source: 'local'
          });
        } catch (fallbackError) {
          console.error('本地模型也失败:', fallbackError);
        }
      }
      res.status(500).json({
        success: false,
        message: error.message || '获取车型列表失败'
      });
    }
  }

  /**
   * 根据品牌获取车型（从 shared.vehicles 读取）
   */
  async getByBrand(req: Request, res: Response) {
    try {
      const brand = req.params.brand;
      
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: '品牌名称不能为空'
        });
      }

      const vehicles = await sharedDataService.getVehiclesByBrand(brand);
      
      res.json({
        success: true,
        data: vehicles
      });
    } catch (error: any) {
      console.error('获取车型列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取车型列表失败'
      });
    }
  }

  /**
   * 根据ID获取车型（从 shared.vehicles 读取）
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的车型ID'
        });
      }

      const vehicle = await sharedDataService.getVehicleById(id);
      
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: '车型不存在'
        });
      }
      
      res.json({
        success: true,
        data: vehicle
      });
    } catch (error: any) {
      console.error('获取车型详情失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取车型详情失败'
      });
    }
  }

  /**
   * 更新车型（⚠️ 已废弃 - shared.vehicles 为只读数据源）
   */
  async update(req: Request, res: Response) {
    try {
      res.status(410).json({
        success: false,
        message: '[已废弃] 车型数据从 shared.vehicles 读取，不允许直接修改。请通过数据管理流程更新车型。',
        deprecated: true
      });
    } catch (error: any) {
      console.error('更新车型失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新车型失败'
      });
    }
  }

  /**
   * 删除车型（⚠️ 已废弃 - shared.vehicles 为只读数据源）
   */
  async delete(req: Request, res: Response) {
    try {
      res.status(410).json({
        success: false,
        message: '[已废弃] 车型数据从 shared.vehicles 读取，不允许直接删除。请通过数据管理流程删除车型。',
        deprecated: true
      });
    } catch (error: any) {
      console.error('删除车型失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除车型失败'
      });
    }
  }
}

export const carModelController = new CarModelController();
