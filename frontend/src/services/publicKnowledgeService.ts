import axios from 'axios';
import { API_V1_BASE } from '../config/apiBase';
import {
  CategoryTreeNode,
  PublicKnowledgeFile,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateFileDTO,
  ApiResponse,
} from '../types/publicKnowledge';

const API_BASE_URL = API_V1_BASE;

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
    config.headers = config.headers || {};
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  // 如果是 FormData，删除 Content-Type，让浏览器自动设置（包含 boundary）
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
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
   * 上传文件（支持单个或多个文件）
   */
  async uploadFile(files: File | File[], data?: CreateFileDTO): Promise<ApiResponse<PublicKnowledgeFile | PublicKnowledgeFile[]>> {
    try {
      const formData = new FormData();
      const fileArray = Array.isArray(files) ? files : [files];
      
      // 后端期望的字段名是 'files'（复数）
      fileArray.forEach(file => {
        formData.append('files', file);
      });
      
      if (data) {
        // category_id 可能是 number | null | undefined
        // null 表示无分类，需要发送 'null' 字符串；undefined 表示不设置，不发送字段
        if (data.category_id !== undefined) {
          formData.append('category_id', data.category_id === null ? 'null' : data.category_id.toString());
        }
        if (data.description) {
          formData.append('description', data.description);
        }
        if (data.uploaded_by) {
          formData.append('uploaded_by', data.uploaded_by.toString());
        }
      }

      // 上传文件时，拦截器会自动删除 Content-Type，让浏览器自动设置（包含 boundary）
      const response = await api.post<ApiResponse<PublicKnowledgeFile | PublicKnowledgeFile[]>>('/public-knowledge/upload', formData);
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

  /**
   * 获取文件URL（用于预览）
   * 始终使用预览 API，因为预览 API 会通过数据库查询文件并确保文件存在
   */
  getFileUrl(file: PublicKnowledgeFile): string {
    // 始终使用预览 API，通过文件ID查询，这样更可靠
    return `${API_BASE_URL}/public-knowledge/files/${file.id}/preview`;
  }

  /**
   * 下载文件
   */
  async downloadFile(id: number): Promise<Blob> {
    try {
      const response = await api.get(`/public-knowledge/files/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      console.error('下载文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件转换后的Markdown内容
   */
  async getFileMarkdown(id: number): Promise<ApiResponse<{ fileId: number; markdownContent: string }>> {
    try {
      const response = await api.get<ApiResponse<{ fileId: number; markdownContent: string }>>(`/public-knowledge/files/${id}/markdown`);
      return response.data;
    } catch (error: any) {
      console.error('获取文件Markdown内容失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || '获取文件Markdown内容失败',
      };
    }
  }
}

export const publicKnowledgeService = new PublicKnowledgeService();
export default publicKnowledgeService;

