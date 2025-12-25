import axios from 'axios';
import {
  CategoryTreeNode,
  PublicKnowledgeFile,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateFileDTO,
  ApiResponse,
} from '../types/publicKnowledge';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器，添加认证token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

class PublicKnowledgeService {
  /**
   * 获取分类树
   */
  async getCategoryTree(): Promise<ApiResponse<CategoryTreeNode[]>> {
    try {
      const response = await api.get<ApiResponse<CategoryTreeNode[]>>('/public-knowledge/categories/tree');
      return response.data;
    } catch (error: any) {
      console.error('获取分类树失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '获取分类树失败',
      };
    }
  }

  /**
   * 获取文件列表
   */
  async getFiles(categoryId?: number | null): Promise<ApiResponse<PublicKnowledgeFile[]>> {
    try {
      const params: any = {};
      if (categoryId !== undefined) {
        params.category_id = categoryId;
      }
      const response = await api.get<ApiResponse<PublicKnowledgeFile[]>>('/public-knowledge/files', { params });
      return response.data;
    } catch (error: any) {
      console.error('获取文件列表失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '获取文件列表失败',
      };
    }
  }

  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryDTO): Promise<ApiResponse<CategoryTreeNode>> {
    try {
      const response = await api.post<ApiResponse<CategoryTreeNode>>('/public-knowledge/categories', data);
      return response.data;
    } catch (error: any) {
      console.error('创建分类失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '创建分类失败',
      };
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(id: number, data: UpdateCategoryDTO): Promise<ApiResponse<CategoryTreeNode>> {
    try {
      const response = await api.put<ApiResponse<CategoryTreeNode>>(`/public-knowledge/categories/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('更新分类失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '更新分类失败',
      };
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await api.delete<ApiResponse<boolean>>(`/public-knowledge/categories/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('删除分类失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '删除分类失败',
      };
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File, data?: CreateFileDTO): Promise<ApiResponse<PublicKnowledgeFile>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (data) {
        if (data.category_id !== undefined) {
          formData.append('category_id', data.category_id?.toString() || '');
        }
        if (data.description) {
          formData.append('description', data.description);
        }
        if (data.uploaded_by) {
          formData.append('uploaded_by', data.uploaded_by.toString());
        }
      }

      const response = await api.post<ApiResponse<PublicKnowledgeFile>>('/public-knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('上传文件失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '上传文件失败',
      };
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(id: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await api.delete<ApiResponse<boolean>>(`/public-knowledge/files/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('删除文件失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '删除文件失败',
      };
    }
  }
}

export const publicKnowledgeService = new PublicKnowledgeService();
export default publicKnowledgeService;

