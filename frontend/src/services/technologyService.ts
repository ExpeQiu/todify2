import api from './api';
import { ApiResponse } from '../types/techPoint';

export interface Technology {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  version?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const technologyService = {
  getAll: async (): Promise<{ data?: Technology[] }> => {
    try {
      const response = await api.get('/technologies');
      return { data: response.data?.data || response.data || [] };
    } catch (error) {
      console.error('获取技术IP列表失败:', error);
      return { data: [] };
    }
  },

  create: async (data: { name: string; name_en?: string; description?: string; version?: string }): Promise<ApiResponse<Technology>> => {
    try {
      const response = await api.post('/technologies', data);
      return response.data;
    } catch (error) {
      console.error('创建技术IP失败:', error);
      return {
        success: false,
        error: '创建技术IP失败'
      };
    }
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/technologies/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除技术IP失败:', error);
      return {
        success: false,
        error: '删除技术IP失败'
      };
    }
  },
};

export default technologyService;

