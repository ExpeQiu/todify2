import { Request, Response } from 'express';
import { BrandModel, CreateBrandDTO, UpdateBrandDTO } from '../models/brand';

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
   * 获取所有品牌
   */
  async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const options: any = {};
      
      if (status) {
        options.where = { status: status as string };
      }

      const result = await this.brandModel.findAll(options);
      
      res.json({
        success: true,
        data: result.brands
      });
    } catch (error: any) {
      console.error('获取品牌列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取品牌列表失败'
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
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: '品牌不存在'
        });
      }

      res.json({
        success: true,
        data: brand
      });
    } catch (error: any) {
      console.error('获取品牌详情失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取品牌详情失败'
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
      res.status(500).json({
        success: false,
        message: error.message || '删除品牌失败'
      });
    }
  }
}

export const brandController = new BrandController();

