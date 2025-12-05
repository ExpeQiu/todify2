import api from './api';
import {
  Project,
  ApiResponse,
  PaginatedResponse,
  ProjectFormData,
  ProjectSearchParams
} from '../types/project';

const PROJECT_BASE_URL = '/projects';

export const projectService = {
  // 获取项目列表
  async getProjects(params?: ProjectSearchParams): Promise<ApiResponse<PaginatedResponse<Project>>> {
    try {
      const response = await api.get(PROJECT_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('获取项目列表失败:', error);
      return {
        success: false,
        error: '获取项目列表失败'
      };
    }
  },

  // 获取项目详情
  async getProjectById(id: number): Promise<ApiResponse<Project>> {
    try {
      const response = await api.get(`${PROJECT_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取项目详情失败:', error);
      return {
        success: false,
        error: '获取项目详情失败'
      };
    }
  },

  // 创建项目
  async createProject(data: ProjectFormData): Promise<ApiResponse<Project>> {
    try {
      const response = await api.post(PROJECT_BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error('创建项目失败:', error);
      return {
        success: false,
        error: '创建项目失败'
      };
    }
  },

  // 更新项目
  async updateProject(id: number, data: Partial<ProjectFormData>): Promise<ApiResponse<Project>> {
    try {
      const response = await api.put(`${PROJECT_BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('更新项目失败:', error);
      return {
        success: false,
        error: '更新项目失败'
      };
    }
  },

  // 删除项目
  async deleteProject(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${PROJECT_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除项目失败:', error);
      return {
        success: false,
        error: '删除项目失败'
      };
    }
  },

  // 获取精选项目
  async getFeaturedProjects(limit: number = 10): Promise<ApiResponse<Project[]>> {
    try {
      const response = await api.get(`${PROJECT_BASE_URL}/featured`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取精选项目失败:', error);
      return {
        success: false,
        error: '获取精选项目失败'
      };
    }
  },

  // 获取最近打开的项目
  async getRecentProjects(limit: number = 20): Promise<ApiResponse<Project[]>> {
    try {
      const response = await api.get(`${PROJECT_BASE_URL}/recent`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取最近项目失败:', error);
      return {
        success: false,
        error: '获取最近项目失败'
      };
    }
  },

  // 更新最后打开时间
  async updateLastOpenedAt(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.put(`${PROJECT_BASE_URL}/${id}/last-opened`);
      return response.data;
    } catch (error) {
      console.error('更新最后打开时间失败:', error);
      return {
        success: false,
        error: '更新最后打开时间失败'
      };
    }
  }
};

export default projectService;
