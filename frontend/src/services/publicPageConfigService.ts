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
      // 如果没有提供displayMode，使用默认值'role'
      const requestData = {
        ...data,
        displayMode: data.displayMode || 'role',
      };
      const response = await api.post<ApiResponse<PublicPageConfig>>('/public-page-configs', requestData);
      if (response.data.success && response.data.data) {
        const config = response.data.data;
        // 如果创建时指定了isActive，需要单独更新
        if (data.isActive !== undefined && data.isActive !== config.isActive) {
          return await this.toggleConfig(config.id, data.isActive);
        }
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
      const now = new Date();
      return {
        roles: [],
        config: {
          id: 'default',
          name: '默认公开配置',
          description: '后端未返回公开配置',
          address: 'public',
          displayMode: 'all',
          accessToken: token,
          isActive: false,
          templateType: 'ai-chat',
          createdAt: now,
          updatedAt: now,
        },
      };
    } catch (error: any) {
      const code = error?.code;
      const status = error?.response?.status;
      const now = new Date();
      if (status === 500 || status === 404 || code === 'ECONNREFUSED' || code === 'ERR_NETWORK') {
        return {
          roles: [],
          config: {
            id: 'default',
            name: '默认公开配置',
            description: '后端不可用或未配置公开数据',
            address: 'public',
            displayMode: 'all',
            accessToken: token,
            isActive: false,
            templateType: 'ai-chat',
            createdAt: now,
            updatedAt: now,
          },
        };
      }
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
      const now = new Date();
      return {
        roles: [],
        config: {
          id: configId,
          name: '默认公开配置',
          description: '后端未返回公开配置',
          address: 'public',
          displayMode: 'all',
          accessToken: '',
          isActive: false,
          templateType: 'ai-chat',
          createdAt: now,
          updatedAt: now,
        },
      };
    } catch (error: any) {
      const code = error?.code;
      const status = error?.response?.status;
      const now = new Date();
      if (status === 500 || status === 404 || code === 'ECONNREFUSED' || code === 'ERR_NETWORK') {
        return {
          roles: [],
          config: {
            id: configId,
            name: '默认公开配置',
            description: '后端不可用或未配置公开数据',
            address: 'public',
            displayMode: 'all',
            accessToken: '',
            isActive: false,
            templateType: 'ai-chat',
            createdAt: now,
            updatedAt: now,
          },
        };
      }
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
      const now = new Date();
      return {
        roles: [],
        config: {
          id: 'default',
          name: '默认公开配置',
          description: '后端未返回公开配置',
          address,
          displayMode: 'all',
          accessToken: '',
          isActive: false,
          templateType: 'ai-chat',
          createdAt: now,
          updatedAt: now,
        },
      };
    } catch (error: any) {
      const code = error?.code;
      const status = error?.response?.status;
      const now = new Date();
      if (status === 500 || status === 404 || code === 'ECONNREFUSED' || code === 'ERR_NETWORK') {
        return {
          roles: [],
          config: {
            id: 'default',
            name: '默认公开配置',
            description: '后端不可用或未配置公开数据',
            address,
            displayMode: 'all',
            accessToken: '',
            isActive: false,
            templateType: 'ai-chat',
            createdAt: now,
            updatedAt: now,
          },
        };
      }
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

  /**
   * 初始化/更新默认页面配置
   * 确保技术包装、技术策略、技术通稿、发布会稿这4个页面使用正确的模板并处于开启状态
   * @param templates 模板HTML映射对象，用于获取模板HTML内容
   */
  async ensureDefaultPageConfigs(templates?: Record<string, string>): Promise<PublicPageConfig[]> {
    const existingConfigs = await this.getAllConfigs();
    const updatedConfigs: PublicPageConfig[] = [];

    // 定义需要确保的4个页面配置
    const defaultPageConfigs = [
      {
        name: '技术包装',
        description: '技术内容包装工作流公开页面',
        address: 'tech-package',
        templateType: 'ai-chat-source-tools' as const,
      },
      {
        name: '技术策略',
        description: '技术策略生成工作流公开页面',
        address: 'tech-strategy',
        templateType: 'ai-chat-source-tools' as const,
      },
      {
        name: '技术通稿',
        description: '核心内容生成工作流公开页面',
        address: 'tech-article',
        templateType: 'ai-chat-source-tools' as const,
      },
      {
        name: '发布会稿',
        description: '技术发布内容生成工作流公开页面',
        address: 'press-release',
        templateType: 'ai-chat-source-tools' as const,
      },
    ];

    for (const defaultConfig of defaultPageConfigs) {
      try {
        // 查找是否已存在（通过名称匹配）
        let existing = existingConfigs.find(c => c.name === defaultConfig.name);

        // 获取模板HTML
        const templateHtml = templates?.[defaultConfig.templateType] || '';

        if (!existing) {
          // 如果不存在，创建新配置
          const newConfig = await this.createConfig({
            name: defaultConfig.name,
            description: defaultConfig.description,
            address: defaultConfig.address,
            templateType: defaultConfig.templateType,
            customHtml: templateHtml,
            isActive: true,
          });
          updatedConfigs.push(newConfig);
        } else {
          // 如果存在，检查是否需要更新
          const needsUpdate = 
            existing.templateType !== defaultConfig.templateType ||
            !existing.isActive ||
            existing.address !== defaultConfig.address ||
            (templateHtml && existing.customHtml !== templateHtml);

          if (needsUpdate) {
            // 更新配置
            const updated = await this.updateConfig(existing.id, {
              description: defaultConfig.description,
              address: defaultConfig.address,
              templateType: defaultConfig.templateType,
              customHtml: templateHtml || existing.customHtml,
              isActive: true,
            });
            updatedConfigs.push(updated);
          } else {
            updatedConfigs.push(existing);
          }
        }
      } catch (error) {
        console.error(`初始化/更新配置 "${defaultConfig.name}" 失败:`, error);
        // 如果出错，尝试使用现有配置
        const existing = existingConfigs.find(c => c.name === defaultConfig.name);
        if (existing) {
          updatedConfigs.push(existing);
        }
      }
    }

    return updatedConfigs;
  }
}

const publicPageConfigService = new PublicPageConfigService();
export default publicPageConfigService;

