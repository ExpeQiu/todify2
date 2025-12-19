import axios from 'axios';
import { PageConfig } from '../configs/pageConfigs';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加响应拦截器，静默处理 404 错误（配置不存在是正常情况）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 对于页面工具配置的 404 错误，静默处理（不抛出错误，也不在控制台显示）
    if (error?.config?.url?.includes('/page-tool-configs/') && error?.response?.status === 404) {
      // 阻止错误在控制台显示：创建一个静默的响应对象
      const silentResponse = {
        data: {
          success: false,
          data: null,
          message: '配置不存在',
        },
        status: 200, // 返回 200 而不是 404，避免浏览器控制台显示错误
        statusText: 'OK',
        headers: error.response?.headers || {},
        config: {
          ...error.config,
          // 标记为已处理，避免axios显示错误
          __silentError: true,
        },
      };
      // 阻止浏览器控制台显示网络错误
      if (error.config && typeof error.config === 'object') {
        Object.defineProperty(error.config, 'silent', { value: true, writable: false });
      }
      return Promise.resolve(silentResponse);
    }
    // 其他错误正常抛出
    return Promise.reject(error);
  }
);

export interface PageToolConfigDTO {
  id: string;
  pageType: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article';
  pageTitle: string;
  dialogueTitle: string;
  studioTitle: string;
  workflowSelectionKey: string;
  enabledToolIds?: string[];
  featureLabelMap?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 页面工具配置服务
 */
class PageToolConfigService {
  /**
   * 根据页面类型获取配置
   */
  async getByPageType(pageType: string): Promise<PageToolConfigDTO | null> {
    try {
      const response = await api.get<APIResponse<PageToolConfigDTO>>(`/page-tool-configs/${pageType}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      // 404 表示配置不存在，这是正常情况，不需要记录错误
      if (error?.response?.status === 404) {
        return null;
      }
      // 其他错误才记录日志
      console.error('获取页面工具配置失败:', error);
      return null;
    }
  }

  /**
   * 获取所有配置
   */
  async getAll(): Promise<PageToolConfigDTO[]> {
    try {
      const response = await api.get<APIResponse<PageToolConfigDTO[]>>('/page-tool-configs');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('获取所有页面工具配置失败:', error);
      return [];
    }
  }

  /**
   * 将数据库配置转换为PageConfig格式
   */
  convertToPageConfig(dto: PageToolConfigDTO): PageConfig {
    return {
      pageType: dto.pageType,
      pageTitle: dto.pageTitle,
      dialogueTitle: dto.dialogueTitle,
      studioTitle: dto.studioTitle,
      workflowSelectionKey: dto.workflowSelectionKey,
      featureLabelMap: dto.featureLabelMap || {},
      enabledToolIds: dto.enabledToolIds,
    };
  }
}

export const pageToolConfigService = new PageToolConfigService();

