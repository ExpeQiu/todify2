import api from './api';
import {
  TechPoint,
  TechCategory,
  CarModel,
  ApiResponse,
  PaginatedResponse,
  TechPointStats,
  TechPointSearchParams,
  TechPointFormData
} from '../types/techPoint';

const TECH_POINT_BASE_URL = '/tech-points';
const TECH_CATEGORY_BASE_URL = '/tech-categories';
const CAR_MODEL_BASE_URL = '/car-models';

export const techPointService = {
  // 技术点相关API
  async getTechPoints(params?: TechPointSearchParams): Promise<ApiResponse<PaginatedResponse<TechPoint>>> {
    try {
      const response = await api.get(TECH_POINT_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('获取技术点列表失败:', error);
      return {
        success: false,
        error: '获取技术点列表失败'
      };
    }
  },

  async getTechPointById(id: number): Promise<ApiResponse<TechPoint>> {
    try {
      const response = await api.get(`${TECH_POINT_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取技术点详情失败:', error);
      return {
        success: false,
        error: '获取技术点详情失败'
      };
    }
  },

  async createTechPoint(data: TechPointFormData): Promise<ApiResponse<TechPoint>> {
    try {
      const response = await api.post(TECH_POINT_BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error('创建技术点失败:', error);
      return {
        success: false,
        error: '创建技术点失败'
      };
    }
  },

  async updateTechPoint(id: number, data: Partial<TechPointFormData>): Promise<ApiResponse<TechPoint>> {
    try {
      const response = await api.put(`${TECH_POINT_BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('更新技术点失败:', error);
      return {
        success: false,
        error: '更新技术点失败'
      };
    }
  },

  async deleteTechPoint(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${TECH_POINT_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除技术点失败:', error);
      return {
        success: false,
        error: '删除技术点失败'
      };
    }
  },

  async searchTechPoints(keyword: string, params?: Omit<TechPointSearchParams, 'keyword'>): Promise<ApiResponse<PaginatedResponse<TechPoint>>> {
    try {
      const response = await api.get(`${TECH_POINT_BASE_URL}/search`, {
        params: { keyword, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('搜索技术点失败:', error);
      return {
        success: false,
        error: '搜索技术点失败'
      };
    }
  },

  async getTechPointStats(): Promise<ApiResponse<TechPointStats>> {
    try {
      const response = await api.get(`${TECH_POINT_BASE_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('获取技术点统计失败:', error);
      return {
        success: false,
        error: '获取技术点统计失败'
      };
    }
  },

  async getTechPointAssociatedContent(id: number): Promise<ApiResponse<{
    packagingMaterials: any[];
    promotionStrategies: any[];
    pressReleases: any[];
    speeches: any[];
  }>> {
    try {
      const response = await api.get(`${TECH_POINT_BASE_URL}/${id}/content`);
      return response.data;
    } catch (error) {
      console.error('获取技术点关联内容失败:', error);
      return {
        success: false,
        error: '获取技术点关联内容失败'
      };
    }
  },

  async getTechPointAssociatedCarModels(id: number): Promise<ApiResponse<CarModel[]>> {
    try {
      const response = await api.get(`${TECH_POINT_BASE_URL}/${id}/car-models`);
      return response.data;
    } catch (error) {
      console.error('获取技术点关联车型失败:', error);
      return {
        success: false,
        error: '获取技术点关联车型失败'
      };
    }
  },

  // 技术分类相关API
  async getTechCategories(): Promise<ApiResponse<TechCategory[]>> {
    try {
      const response = await api.get(TECH_CATEGORY_BASE_URL);
      return response.data;
    } catch (error) {
      console.error('获取技术分类失败:', error);
      return {
        success: false,
        error: '获取技术分类失败'
      };
    }
  },

  async createTechCategory(data: { name: string; description?: string; parent_id?: number }): Promise<ApiResponse<TechCategory>> {
    try {
      const response = await api.post(TECH_CATEGORY_BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error('创建技术分类失败:', error);
      return {
        success: false,
        error: '创建技术分类失败'
      };
    }
  },

  // 车型相关API
  async getCarModels(): Promise<ApiResponse<CarModel[]>> {
    try {
      const response = await api.get(CAR_MODEL_BASE_URL);
      return response.data;
    } catch (error) {
      console.error('获取车型列表失败:', error);
      return {
        success: false,
        error: '获取车型列表失败'
      };
    }
  },

  // 技术点与车型关联
  async getTechPointCarModels(techPointId: number): Promise<ApiResponse<CarModel[]>> {
    try {
      const response = await api.get(`${TECH_POINT_BASE_URL}/${techPointId}/car-models`);
      return response.data;
    } catch (error) {
      console.error('获取技术点关联车型失败:', error);
      return {
        success: false,
        error: '获取技术点关联车型失败'
      };
    }
  },

  // 关联车型到技术点
  async associateCarModelToTechPoint(
    techPointId: number,
    data: {
      carModelId: number;
      applicationStatus?: string;
      implementationDate?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await api.post(`${TECH_POINT_BASE_URL}/${techPointId}/car-models`, data);
      return response.data;
    } catch (error) {
      console.error('关联车型失败:', error);
      return {
        success: false,
        error: '关联车型失败'
      };
    }
  },

  // 取消车型与技术点的关联
  async disassociateCarModelFromTechPoint(
    techPointId: number,
    carModelId: number
  ): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`${TECH_POINT_BASE_URL}/${techPointId}/car-models/${carModelId}`);
      return response.data;
    } catch (error) {
      console.error('取消关联失败:', error);
      return {
        success: false,
        error: '取消关联失败'
      };
    }
  },

  // 更新车型关联信息
  async updateCarModelAssociation(
    techPointId: number,
    carModelId: number,
    data: {
      applicationStatus?: string;
      implementationDate?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await api.put(`${TECH_POINT_BASE_URL}/${techPointId}/car-models/${carModelId}`, data);
      return response.data;
    } catch (error) {
      console.error('更新关联信息失败:', error);
      return {
        success: false,
        error: '更新关联信息失败'
      };
    }
  },

  async addTechPointCarModel(techPointId: number, carModelId: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.post(`${TECH_POINT_BASE_URL}/${techPointId}/car-models`, {
        car_model_id: carModelId
      });
      return response.data;
    } catch (error) {
      console.error('添加技术点车型关联失败:', error);
      return {
        success: false,
        error: '添加技术点车型关联失败'
      };
    }
  },

  async removeTechPointCarModel(techPointId: number, carModelId: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${TECH_POINT_BASE_URL}/${techPointId}/car-models/${carModelId}`);
      return response.data;
    } catch (error) {
      console.error('移除技术点车型关联失败:', error);
      return {
        success: false,
        error: '移除技术点车型关联失败'
      };
    }
  }
};

export default techPointService;