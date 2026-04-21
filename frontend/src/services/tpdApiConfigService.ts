// API 配置服务 - 管理外部服务（如 tech-hub）的 API 配置

export interface TechHubAPIConfig {
  id: string;
  name: string;
  description: string;
  apiBaseUrl: string;
  apiKey?: string; // 可选，某些 API 可能需要密钥
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TechHubAPITestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}

class TechHubAPIConfigService {
  private readonly STORAGE_KEY = 'techHubApiConfigs';
  private readonly LEGACY_STORAGE_KEY = 'tpdApiConfigs';

  // 默认的 tech-hub API 配置
  private readonly DEFAULT_CONFIGS: TechHubAPIConfig[] = [
    {
      id: 'default-tech-hub',
      name: 'tech-hub 默认配置',
      description: 'tech-hub 的默认 API 配置',
      apiBaseUrl: import.meta.env.VITE_TECH_HUB_API_URL || import.meta.env.VITE_TPD_API_URL || 'http://localhost:3004/api/external/v1',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  /**
   * 获取所有 tech-hub API 配置
   */
  async getConfigs(): Promise<TechHubAPIConfig[]> {
    try {
      let stored = localStorage.getItem(this.STORAGE_KEY);
      let configs: TechHubAPIConfig[] = [];

      // 兼容旧 key 并自动迁移
      if (!stored) {
        const legacy = localStorage.getItem(this.LEGACY_STORAGE_KEY);
        if (legacy) {
          stored = legacy;
          localStorage.setItem(this.STORAGE_KEY, legacy);
          localStorage.removeItem(this.LEGACY_STORAGE_KEY);
        }
      }

      if (stored) {
        configs = JSON.parse(stored);

        // 确保日期对象正确解析
        configs = configs.map((config: any) => ({
          ...config,
          id: config.id === 'default-tpd2' ? 'default-tech-hub' : config.id,
          createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
          updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
        }));
      }

      // 检查是否缺少默认配置
      const missingDefaults = this.DEFAULT_CONFIGS.filter(
        defaultConfig => !configs.find(config => config.id === defaultConfig.id)
      );

      if (missingDefaults.length > 0) {
        configs.push(...missingDefaults);
        await this.saveConfigs(configs);
      }

      // 如果没有配置，返回默认配置
      if (configs.length === 0) {
        await this.saveConfigs(this.DEFAULT_CONFIGS);
        return this.DEFAULT_CONFIGS;
      }

      return configs;
    } catch (error) {
      console.error('获取 tech-hub API 配置失败:', error);
      await this.saveConfigs(this.DEFAULT_CONFIGS);
      return this.DEFAULT_CONFIGS;
    }
  }

  /**
   * 保存所有 tech-hub API 配置
   */
  async saveConfigs(configs: TechHubAPIConfig[]): Promise<{ success: boolean; message?: string }> {
    try {
      const configsWithTimestamp = configs.map(config => ({
        ...config,
        updatedAt: new Date(),
        createdAt: config.createdAt || new Date(),
      }));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configsWithTimestamp));
      return { success: true, message: 'tech-hub API 配置保存成功' };
    } catch (error) {
      console.error('保存 tech-hub API 配置失败:', error);
      return { success: false, message: '保存 tech-hub API 配置失败' };
    }
  }

  /**
   * 获取单个 tech-hub API 配置
   */
  async getConfig(id: string): Promise<TechHubAPIConfig | null> {
    const configs = await this.getConfigs();
    const config = configs.find(config => config.id === id);
    return (config && config.enabled) ? config : null;
  }

  /**
   * 获取默认启用的配置
   */
  async getDefaultConfig(): Promise<TechHubAPIConfig | null> {
    const configs = await this.getConfigs();
    const enabledConfig = configs.find(config => config.enabled);
    return enabledConfig || configs[0] || null;
  }

  /**
   * 添加新的 tech-hub API 配置
   */
  async addConfig(config: Omit<TechHubAPIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message?: string; data?: TechHubAPIConfig }> {
    try {
      const configs = await this.getConfigs();
      const newConfig: TechHubAPIConfig = {
        ...config,
        id: `tech-hub-api-config-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      configs.push(newConfig);
      const result = await this.saveConfigs(configs);

      if (result.success) {
        return { success: true, message: '配置添加成功', data: newConfig };
      }
      return result;
    } catch (error) {
      console.error('添加 tech-hub API 配置失败:', error);
      return { success: false, message: '添加配置失败' };
    }
  }

  /**
   * 更新 tech-hub API 配置
   */
  async updateConfig(id: string, updates: Partial<TechHubAPIConfig>): Promise<{ success: boolean; message?: string }> {
    try {
      const configs = await this.getConfigs();
      const index = configs.findIndex(config => config.id === id);

      if (index === -1) {
        return { success: false, message: '配置不存在' };
      }

      configs[index] = {
        ...configs[index],
        ...updates,
        id, // 确保 ID 不被修改
        updatedAt: new Date(),
      };

      return await this.saveConfigs(configs);
    } catch (error) {
      console.error('更新 tech-hub API 配置失败:', error);
      return { success: false, message: '更新配置失败' };
    }
  }

  /**
   * 删除 tech-hub API 配置
   */
  async deleteConfig(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const configs = await this.getConfigs();
      const filteredConfigs = configs.filter(config => config.id !== id);

      if (filteredConfigs.length === configs.length) {
        return { success: false, message: '配置不存在' };
      }

      return await this.saveConfigs(filteredConfigs);
    } catch (error) {
      console.error('删除 tech-hub API 配置失败:', error);
      return { success: false, message: '删除配置失败' };
    }
  }

  /**
   * 测试 tech-hub API 连接
   */
  async testConnection(config: TechHubAPIConfig): Promise<TechHubAPITestResult> {
    const startTime = Date.now();

    try {
      if (!config.apiBaseUrl) {
        return {
          success: false,
          message: 'API 地址不能为空',
        };
      }

      // 测试 API 连接 - 尝试获取技术点列表（第一页）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const testUrl = `${config.apiBaseUrl}/tech-points?page=1&pageSize=1`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 如果有 API Key，添加到请求头
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      }).catch((error) => {
        console.error('Fetch error:', error);
        return null;
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response) {
        if (response.ok) {
          const data = await response.json().catch(() => null);
          
          // 验证响应格式（兼容不同外部服务响应格式）
          let isValidResponse = false;
          if (data) {
            // 支持多种响应格式
            if (data.code === 200 || 
                data.success === true || 
                Array.isArray(data) || 
                (data.data && (Array.isArray(data.data) || typeof data.data === 'object'))) {
              isValidResponse = true;
            }
          }
          
          if (isValidResponse || data !== null) {
            return {
              success: true,
              message: `连接测试成功 (${responseTime}ms)`,
              responseTime,
            };
          } else {
            return {
              success: false,
              message: `连接测试失败: API 返回了无效的响应格式 (${responseTime}ms)`,
              responseTime,
              error: 'Invalid response format',
            };
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          return {
            success: false,
            message: `连接测试失败: HTTP ${response.status} - ${errorText} (${responseTime}ms)`,
            responseTime,
            error: errorText,
          };
        }
      } else {
        return {
          success: false,
          message: `连接测试失败，请检查 API 地址 (${responseTime}ms)`,
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorMessage = '未知错误';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '请求超时';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        message: `连接测试失败: ${errorMessage} (${responseTime}ms)`,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 导出配置
   */
  async exportConfigs(): Promise<TechHubAPIConfig[]> {
    return await this.getConfigs();
  }

  /**
   * 导入配置
   */
  async importConfigs(configs: TechHubAPIConfig[]): Promise<{ success: boolean; message?: string }> {
    try {
      return await this.saveConfigs(configs);
    } catch (error) {
      console.error('导入配置失败:', error);
      return { success: false, message: '导入配置失败' };
    }
  }
}

// 创建单例实例
export const techHubApiConfigService = new TechHubAPIConfigService();
export const tpdApiConfigService = techHubApiConfigService;
export type TPDAPIConfig = TechHubAPIConfig;
export type TPDAPITestResult = TechHubAPITestResult;

// 导出类型和服务
export default techHubApiConfigService;

