import axios from 'axios';
import { 
  PublicPageConfig, 
  CreatePublicPageConfigRequest, 
  UpdatePublicPageConfigRequest,
  PublicPageConfigPreview,
  ApiResponse 
} from '../types/publicPageConfig';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 公开页面配置服务
 */
class PublicPageConfigService {
  private async ensureConfigActive(config: PublicPageConfig): Promise<PublicPageConfig> {
    if (config.isActive) {
      return config;
    }
    return this.toggleConfig(config.id, true);
  }

  private normalizeConfig(config: PublicPageConfig): PublicPageConfig {
    return {
      ...config,
      createdAt: new Date(config.createdAt),
      updatedAt: new Date(config.updatedAt),
    };
  }

  /**
   * 获取所有公开页面配置
   */
  async getAllConfigs(): Promise<PublicPageConfig[]> {
    try {
      const response = await api.get<ApiResponse<PublicPageConfig[]>>('/public-page-configs');
      if (response.data.success && response.data.data) {
        return response.data.data.map((config) => this.normalizeConfig(config));
      }
      return [];
    } catch (error: any) {
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      
      // 对于500错误或连接错误（后端未运行），静默处理，不输出日志
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        // 静默失败，返回空数组
        return [];
      }
      
      // 其他错误才输出日志
      console.error('获取配置列表失败:', error);
      throw error;
    }
  }

  /**
   * 确保默认功能页面配置存在并启用
   */
  async ensureDefaultFeatureConfigs(): Promise<PublicPageConfig[]> {
    const existingConfigs = await this.getAllConfigs();
    const updatedConfigs = [...existingConfigs];

    const defaultConfigs: Array<{
      match: (config: PublicPageConfig) => boolean;
      create: CreatePublicPageConfigRequest;
      activate?: boolean;
    }> = [
      {
        match: (config) => config.address === 'ai-search',
        create: {
          name: '技术包装助手',
          description: '技术包装页面默认配置',
          address: 'ai-search',
          displayMode: 'all',
          templateType: 'ai-chat',
        },
      },
      {
        match: (config) => config.templateType === 'speech',
        create: {
          name: '发布会写稿助手',
          description: '发布会稿页面默认配置',
          address: 'speech',
          displayMode: 'all',
          templateType: 'speech',
        },
      },
    ];

    for (const def of defaultConfigs) {
      let existing = updatedConfigs.find(def.match);

      if (!existing) {
        try {
          const created = await this.createConfig(def.create);
          const activated = await this.ensureConfigActive(created);
          updatedConfigs.push(activated);
        } catch (error) {
          console.error('创建默认配置失败:', error);
        }
      } else if (!existing.isActive) {
        try {
          const activated = await this.ensureConfigActive(existing);
          const index = updatedConfigs.findIndex((item) => item.id === existing!.id);
          if (index >= 0) {
            updatedConfigs[index] = activated;
          }
        } catch (error) {
          console.error('激活默认配置失败:', error);
        }
      }
    }

    return updatedConfigs;
  }

  /**
   * 根据ID获取配置
   */
  async getConfigById(id: string): Promise<PublicPageConfig | null> {
    try {
      const response = await api.get<ApiResponse<PublicPageConfig>>(`/public-page-configs/${id}`);
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        return this.normalizeConfig(config);
      }
      return null;
    } catch (error: any) {
      console.error('获取配置失败:', error);
      throw error;
    }
  }

  /**
   * 创建配置
   */
  async createConfig(data: CreatePublicPageConfigRequest): Promise<PublicPageConfig> {
    try {
      const response = await api.post<ApiResponse<PublicPageConfig>>('/public-page-configs', data);
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        return this.normalizeConfig(config);
      }
      throw new Error('创建配置失败');
    } catch (error: any) {
      console.error('创建配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(id: string, data: UpdatePublicPageConfigRequest): Promise<PublicPageConfig> {
    try {
      const response = await api.put<ApiResponse<PublicPageConfig>>(`/public-page-configs/${id}`, data);
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        return this.normalizeConfig(config);
      }
      throw new Error('更新配置失败');
    } catch (error: any) {
      console.error('更新配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除配置
   */
  async deleteConfig(id: string): Promise<boolean> {
    try {
      const response = await api.delete<ApiResponse<null>>(`/public-page-configs/${id}`);
      return response.data.success;
    } catch (error: any) {
      console.error('删除配置失败:', error);
      throw error;
    }
  }

  /**
   * 预览配置（获取角色列表）
   */
  async previewConfig(id: string): Promise<PublicPageConfigPreview> {
    try {
      const response = await api.get<ApiResponse<PublicPageConfigPreview>>(`/public-page-configs/${id}/preview`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('获取预览失败');
    } catch (error: any) {
      console.error('获取预览失败:', error);
      throw error;
    }
  }

  /**
   * 通过访问令牌获取公开配置（用于公开访问页面）
   */
  async getPublicConfig(token: string): Promise<PublicPageConfigPreview> {
    try {
      const response = await api.get<ApiResponse<PublicPageConfigPreview>>(`/public/${token}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('获取公开配置失败');
    } catch (error: any) {
      console.error('获取公开配置失败:', error);
      throw error;
    }
  }

  /**
   * 通过配置ID获取公开配置（用于公开访问页面）
   */
  async getPublicConfigById(configId: string): Promise<PublicPageConfigPreview> {
    try {
      const response = await api.get<ApiResponse<PublicPageConfigPreview>>(`/public-config/${configId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('获取公开配置失败');
    } catch (error: any) {
      console.error('获取公开配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据地址获取配置
   */
  async getConfigByAddress(address: string): Promise<PublicPageConfig | null> {
    try {
      const response = await api.get<ApiResponse<PublicPageConfig>>(`/public-page-configs/by-address/${address}`);
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        return this.normalizeConfig(config);
      }
      return null;
    } catch (error: any) {
      console.error('根据地址获取配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据地址获取公开配置（包含角色列表）
   */
  async getPublicConfigByAddress(address: string): Promise<PublicPageConfigPreview> {
    try {
      const response = await api.get<ApiResponse<PublicPageConfigPreview>>(`/public-by-address/${address}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('获取公开配置失败');
    } catch (error: any) {
      console.error('获取公开配置失败:', error);
      throw error;
    }
  }

  /**
   * 生成公开访问链接（通过token）
   */
  generatePublicUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public-chat/${token}`;
  }

  /**
   * 生成公开访问链接（通过configId）
   */
  generatePublicUrlById(configId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public-chat/${configId}`;
  }

  /**
   * 复制链接到剪贴板
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  }

  /**
   * 导入独立页面配置
   */
  async importIndependentPages(): Promise<{
    results: Array<{ role: any; config: any; status: 'created' | 'exists' | 'error'; error?: string }>;
    summary: { total: number; created: number; exists: number; errors: number };
  }> {
    try {
      const response = await api.post<ApiResponse<{
        results: Array<{ role: any; config: any; status: 'created' | 'exists' | 'error'; error?: string }>;
        summary: { total: number; created: number; exists: number; errors: number };
      }>>('/public-page-configs/import-independent-pages');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('导入失败');
    } catch (error: any) {
      console.error('导入独立页面配置失败:', error);
      throw error;
    }
  }

  /**
   * 切换配置启用状态
   */
  async toggleConfig(id: string, isActive?: boolean): Promise<PublicPageConfig> {
    try {
      const response = await api.patch<ApiResponse<PublicPageConfig>>(
        `/public-page-configs/${id}/toggle`,
        isActive !== undefined ? { isActive } : {}
      );
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        return {
          ...config,
          createdAt: new Date(config.createdAt),
          updatedAt: new Date(config.updatedAt),
        };
      }
      throw new Error('切换状态失败');
    } catch (error: any) {
      console.error('切换状态失败:', error);
      throw error;
    }
  }
}

const publicPageConfigService = new PublicPageConfigService();
export default publicPageConfigService;

