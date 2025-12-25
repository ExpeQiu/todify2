import { Request, Response } from 'express';
import { CarModelModel, CreateCarModelDTO, UpdateCarModelDTO } from '../models/CarModel';

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
   * 获取所有车型
   */
  async getAll(req: Request, res: Response) {
    try {
      const { brand_id, status } = req.query;
      const options: any = {};
      
      if (brand_id) {
        options.where = { brand_id: parseInt(brand_id as string) };
      }
      if (status) {
        options.where = { ...options.where, status: status as string };
      }

      const result = await this.carModelModel.findAll(options);
      
      res.json({
        success: true,
        data: result.carModels
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
        data: result.carModels
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
   * 根据ID获取车型
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

      const carModel = await this.carModelModel.findById(id);
      
      res.json({
        success: true,
        data: carModel
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
      res.status(500).json({
        success: false,
        message: error.message || '删除车型失败'
      });
    }
  }
}

export const carModelController = new CarModelController();

