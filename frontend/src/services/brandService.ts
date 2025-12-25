import api from './api';
import { ApiResponse } from '../types/techPoint';

export interface Brand {
  id: number;
  name: string;
  name_en?: string;
  [key: string]: any;
}

export const brandService = {
  getAll: async (): Promise<{ data?: Brand[] }> => {
    try {
      const response = await api.get('/brands');
      return { data: response.data?.data || response.data || [] };
    } catch (error) {
      console.error('获取品牌列表失败:', error);
      return { data: [] };
    }
  },

  create: async (data: { name: string; name_en?: string }): Promise<ApiResponse<Brand>> => {
    try {
      const response = await api.post('/brands', data);
      return response.data;
    } catch (error) {
      console.error('创建品牌失败:', error);
      return {
        success: false,
        error: '创建品牌失败'
      };
    }
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/brands/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除品牌失败:', error);
      return {
        success: false,
        error: '删除品牌失败'
      };
    }
  },
};

export default brandService;

