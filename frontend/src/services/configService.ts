// 配置服务 - 管理Dify API配置和工作流配置

export interface DifyAPIConfig {
  id: string;
  name: string;
  description: string;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkflowStepConfig {
  stepId: number;
  stepName: string;
  stepKey: string;
  difyConfigId: string;
  customPrompt?: string;
  enabled?: boolean;
}

// 新增：智能工作流节点配置
export interface SmartWorkflowNodeConfig {
  id: string;
  name: string;
  description: string;
  connectionType: 'chatflow' | 'workflow';
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 新增：独立页面配置
export interface IndependentPageConfig {
  id: string;
  name: string;
  description: string;
  connectionType: 'chatflow';
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface DifyAPITestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}

class ConfigService {
  private readonly STORAGE_KEYS = {
    DIFY_CONFIGS: 'difyConfigs',
    WORKFLOW_CONFIGS: 'workflowConfigs',
    // 已废弃：SMART_WORKFLOW_CONFIGS 和 INDEPENDENT_PAGE_CONFIGS 已迁移到AI角色系统
  };

  // 默认的工作流步骤配置
  private readonly DEFAULT_WORKFLOW_STEPS: Omit<WorkflowStepConfig, 'difyConfigId'>[] = [
    { stepId: 1, stepName: "AI问答", stepKey: "smartSearch" },
    { stepId: 2, stepName: "技术包装", stepKey: "techPackage" },
    { stepId: 3, stepName: "技术策略", stepKey: "techStrategy" },
    { stepId: 4, stepName: "技术通稿", stepKey: "coreDraft" },
    { stepId: 5, stepName: "发布会演讲稿", stepKey: "speechGeneration" },
  ];

  // 已废弃：智能工作流和独立页面配置
  // private readonly DEFAULT_SMART_WORKFLOW_CONFIGS: SmartWorkflowNodeConfig[] = ...
  // private readonly DEFAULT_INDEPENDENT_PAGE_CONFIGS: IndependentPageConfig[] = ...
  // 这些配置已迁移到AI角色管理系统

  // 默认的Dify API配置 - 统一代理到本地后端服务
  private readonly DEFAULT_DIFY_CONFIGS: DifyAPIConfig[] = [
    {
      id: "default-ai-search",
      name: "AI问答模型",
      description: "用于处理用户问答的Dify API配置",
      apiUrl: "/api/dify/chat-messages",
      apiKey: "app-t1X4eu8B4eucyO6IfrTbw1t2",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-tech-package",
      name: "技术包装模型",
      description: "用于技术内容包装的Dify API配置",
      apiUrl: "/api/dify/workflows/run",
      apiKey: "app-YDVb91faDHwTqIei4WWSNaTM",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-tech-strategy",
      name: "技术策略模型",
      description: "用于生成技术策略的Dify API配置",
      apiUrl: "/api/dify/workflows/run",
      apiKey: "app-awRZf7tKfvC73DEVANAGGNr8",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-core-draft",
      name: "通稿生成模型",
      description: "用于生成技术通稿的Dify API配置",
      apiUrl: "/api/dify/workflows/run",
      apiKey: "app-3TK9U2F3WwFP7vOoq0Ut84KA",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-speech-generation",
      name: "演讲稿生成模型",
      description: "用于生成发布会演讲稿的Dify API配置",
      apiUrl: "/api/dify/workflows/run",
      apiKey: "app-WcV5IDjuNKbOKIBDPWdb7HF4",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 已废弃：以下默认配置常量已删除，配置已迁移到AI角色管理系统
  // DEFAULT_SMART_WORKFLOW_CONFIGS 和 DEFAULT_INDEPENDENT_PAGE_CONFIGS 已移除

  /**
   * 获取所有Dify API配置
   */
  async getDifyConfigs(): Promise<DifyAPIConfig[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.DIFY_CONFIGS);
      let configs: DifyAPIConfig[] = [];
      
      if (stored) {
        configs = JSON.parse(stored);
        
        // 强制清理包含云端地址的旧配置，确保使用本地代理
        const hasInvalidUrl = configs.some((config: any) => 
          config.apiUrl?.includes('47.113.225.93') || 
          config.apiUrl?.includes(':9999') || 
          config.apiUrl?.includes('8088/api/dify')
        );
        if (hasInvalidUrl) {
          console.log('⚠️ 检测到旧的云端配置，强制更新为本地代理配置');
          await this.saveDifyConfigs(this.DEFAULT_DIFY_CONFIGS);
          return this.DEFAULT_DIFY_CONFIGS;
        }
        
        // 检查是否有禁用的默认配置，如果有则强制启用
        const hasDisabledDefaults = configs.some((config: any) => 
          config.id?.startsWith('default-') && !config.enabled
        );
        if (hasDisabledDefaults) {
          console.log('⚠️ 检测到禁用的默认配置，强制启用Dify API');
          await this.saveDifyConfigs(this.DEFAULT_DIFY_CONFIGS);
          return this.DEFAULT_DIFY_CONFIGS;
        }
        
        // 检查是否有技术包装配置，如果没有或API Key不正确，强制更新
        const techPackageConfig = configs.find((config: any) => config.id === 'default-tech-package');
        if (!techPackageConfig || techPackageConfig.apiKey !== 'app-YDVb91faDHwTqIei4WWSNaTM') {
          console.log('技术包装配置需要更新，强制使用默认配置');
          await this.saveDifyConfigs(this.DEFAULT_DIFY_CONFIGS);
          return this.DEFAULT_DIFY_CONFIGS;
        }
        
        // 检查是否缺少任何默认配置
        const missingConfigs = this.DEFAULT_DIFY_CONFIGS.filter(
          defaultConfig => !configs.find(config => config.id === defaultConfig.id)
        );
        
        if (missingConfigs.length > 0) {
          console.log(`添加缺失的默认配置: ${missingConfigs.map(c => c.id).join(', ')}`);
          configs.push(...missingConfigs);
          await this.saveDifyConfigs(configs);
        }
        
        // 确保日期对象正确解析
        return configs.map((config: any) => ({
          ...config,
          createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
          updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
        }));
      }
      
      // 如果没有存储的配置，返回默认配置
      console.log('未找到Dify配置，初始化默认配置');
      await this.saveDifyConfigs(this.DEFAULT_DIFY_CONFIGS);
      return this.DEFAULT_DIFY_CONFIGS;
    } catch (error) {
      console.error('获取Dify配置失败:', error);
      console.log('使用默认配置');
      await this.saveDifyConfigs(this.DEFAULT_DIFY_CONFIGS);
      return this.DEFAULT_DIFY_CONFIGS;
    }
  }

  /**
   * 保存Dify API配置
   */
  async saveDifyConfigs(configs: DifyAPIConfig[]): Promise<ConfigResponse> {
    try {
      const configsWithTimestamp = configs.map(config => ({
        ...config,
        updatedAt: new Date(),
        createdAt: config.createdAt || new Date(),
      }));
      
      localStorage.setItem(this.STORAGE_KEYS.DIFY_CONFIGS, JSON.stringify(configsWithTimestamp));
      return { success: true, message: 'Dify配置保存成功' };
    } catch (error) {
      console.error('保存Dify配置失败:', error);
      return { success: false, message: '保存Dify配置失败' };
    }
  }

  /**
   * 获取单个Dify API配置
   */
  async getDifyConfig(id: string): Promise<DifyAPIConfig | null> {
    const configs = await this.getDifyConfigs();
    const config = configs.find(config => config.id === id);
    // 如果配置被禁用，返回null，这样API调用就会使用本地后端
    return (config && config.enabled) ? config : null;
  }

  /**
   * 添加新的Dify API配置
   */
  async addDifyConfig(config: Omit<DifyAPIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigResponse> {
    try {
      const configs = await this.getDifyConfigs();
      const newConfig: DifyAPIConfig = {
        ...config,
        id: `dify-config-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      configs.push(newConfig);
      const result = await this.saveDifyConfigs(configs);
      
      if (result.success) {
        return { success: true, message: '配置添加成功', data: newConfig };
      }
      return result;
    } catch (error) {
      console.error('添加Dify配置失败:', error);
      return { success: false, message: '添加配置失败' };
    }
  }

  /**
   * 更新Dify API配置
   */
  async updateDifyConfig(id: string, updates: Partial<DifyAPIConfig>): Promise<ConfigResponse> {
    try {
      const configs = await this.getDifyConfigs();
      const index = configs.findIndex(config => config.id === id);
      
      if (index === -1) {
        return { success: false, message: '配置不存在' };
      }
      
      configs[index] = {
        ...configs[index],
        ...updates,
        id, // 确保ID不被修改
        updatedAt: new Date(),
      };
      
      return await this.saveDifyConfigs(configs);
    } catch (error) {
      console.error('更新Dify配置失败:', error);
      return { success: false, message: '更新配置失败' };
    }
  }

  /**
   * 删除Dify API配置
   */
  async deleteDifyConfig(id: string): Promise<ConfigResponse> {
    try {
      const configs = await this.getDifyConfigs();
      const filteredConfigs = configs.filter(config => config.id !== id);
      
      if (filteredConfigs.length === configs.length) {
        return { success: false, message: '配置不存在' };
      }
      
      const result = await this.saveDifyConfigs(filteredConfigs);
      
      if (result.success) {
        // 同时更新工作流配置，将使用该配置的步骤重置
        await this.resetWorkflowConfigsUsingDifyConfig(id);
      }
      
      return result;
    } catch (error) {
      console.error('删除Dify配置失败:', error);
      return { success: false, message: '删除配置失败' };
    }
  }

  /**
   * 测试Dify API连接
   */
  async testDifyConnection(config: DifyAPIConfig): Promise<DifyAPITestResult> {
    const startTime = Date.now();
    
    try {
      if (!config.apiUrl || !config.apiKey) {
        return {
          success: false,
          message: 'API地址和密钥不能为空',
        };
      }

      // 使用Dify API的实际端点进行测试
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // 构建正确的Dify API测试请求
      const testUrl = `${config.apiUrl}/chat-messages`;
      const testPayload = {
        inputs: {},
        query: "Hello, this is a connection test.",
        response_mode: "blocking",
        conversation_id: "",
        user: "test-user"
      };
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      }).catch((error) => {
        console.error('Fetch error:', error);
        return null;
      });
      
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response) {
        if (response.ok) {
          return {
            success: true,
            message: `连接测试成功 (${responseTime}ms)`,
            responseTime,
          };
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          return {
            success: false,
            message: `连接测试失败: HTTP ${response.status} - ${errorText} (${responseTime}ms)`,
            responseTime,
          };
        }
      } else {
        return {
          success: false,
          message: `连接测试失败，请检查API地址和密钥 (${responseTime}ms)`,
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
   * 获取工作流配置
   */
  async getWorkflowConfigs(): Promise<WorkflowStepConfig[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.WORKFLOW_CONFIGS);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // 如果没有存储的配置，创建默认配置
      const difyConfigs = await this.getDifyConfigs();
      const defaultWorkflowConfigs: WorkflowStepConfig[] = this.DEFAULT_WORKFLOW_STEPS.map((step, index) => ({
        ...step,
        difyConfigId: difyConfigs[index]?.id || difyConfigs[0]?.id || '',
        enabled: true,
      }));
      
      await this.saveWorkflowConfigs(defaultWorkflowConfigs);
      return defaultWorkflowConfigs;
    } catch (error) {
      console.error('获取工作流配置失败:', error);
      return [];
    }
  }

  /**
   * 保存工作流配置
   */
  async saveWorkflowConfigs(configs: WorkflowStepConfig[]): Promise<ConfigResponse> {
    try {
      localStorage.setItem(this.STORAGE_KEYS.WORKFLOW_CONFIGS, JSON.stringify(configs));
      return { success: true, message: '工作流配置保存成功' };
    } catch (error) {
      console.error('保存工作流配置失败:', error);
      return { success: false, message: '保存工作流配置失败' };
    }
  }

  /**
   * 更新工作流步骤配置
   */
  async updateWorkflowStepConfig(
    stepId: number, 
    updates: Partial<WorkflowStepConfig>
  ): Promise<ConfigResponse> {
    try {
      const configs = await this.getWorkflowConfigs();
      const index = configs.findIndex(config => config.stepId === stepId);
      
      if (index === -1) {
        return { success: false, message: '工作流步骤不存在' };
      }
      
      configs[index] = {
        ...configs[index],
        ...updates,
        stepId, // 确保stepId不被修改
      };
      
      return await this.saveWorkflowConfigs(configs);
    } catch (error) {
      console.error('更新工作流配置失败:', error);
      return { success: false, message: '更新工作流配置失败' };
    }
  }

  /**
   * 根据步骤获取对应的Dify配置
   */
  async getDifyConfigForStep(stepId: number): Promise<DifyAPIConfig | null> {
    try {
      const workflowConfigs = await this.getWorkflowConfigs();
      const stepConfig = workflowConfigs.find(config => config.stepId === stepId);
      
      if (!stepConfig || !stepConfig.difyConfigId) {
        return null;
      }
      
      return await this.getDifyConfig(stepConfig.difyConfigId);
    } catch (error) {
      console.error('获取步骤对应的Dify配置失败:', error);
      return null;
    }
  }

  /**
   * 重置使用指定Dify配置的工作流步骤
   */
  private async resetWorkflowConfigsUsingDifyConfig(difyConfigId: string): Promise<void> {
    try {
      const workflowConfigs = await this.getWorkflowConfigs();
      const difyConfigs = await this.getDifyConfigs();
      const fallbackConfigId = difyConfigs[0]?.id || '';
      
      const updatedConfigs = workflowConfigs.map(config =>
        config.difyConfigId === difyConfigId
          ? { ...config, difyConfigId: fallbackConfigId }
          : config
      );
      
      await this.saveWorkflowConfigs(updatedConfigs);
    } catch (error) {
      console.error('重置工作流配置失败:', error);
    }
  }

  /**
   * 导出配置
   */
  async exportConfigs(): Promise<{ difyConfigs: DifyAPIConfig[], workflowConfigs: WorkflowStepConfig[] }> {
    const difyConfigs = await this.getDifyConfigs();
    const workflowConfigs = await this.getWorkflowConfigs();
    
    return {
      difyConfigs,
      workflowConfigs,
    };
  }

  /**
   * 导入配置
   */
  async importConfigs(data: {
    difyConfigs?: DifyAPIConfig[],
    workflowConfigs?: WorkflowStepConfig[]
  }): Promise<ConfigResponse> {
    try {
      if (data.difyConfigs) {
        await this.saveDifyConfigs(data.difyConfigs);
      }
      
      if (data.workflowConfigs) {
        await this.saveWorkflowConfigs(data.workflowConfigs);
      }
      
      return { success: true, message: '配置导入成功' };
    } catch (error) {
      console.error('导入配置失败:', error);
      return { success: false, message: '导入配置失败' };
    }
  }

  /**
   * 清除所有配置
   */
  async clearAllConfigs(): Promise<ConfigResponse> {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.DIFY_CONFIGS);
      localStorage.removeItem(this.STORAGE_KEYS.WORKFLOW_CONFIGS);
      localStorage.removeItem('smartWorkflowConfigs');
      localStorage.removeItem('independentPageConfigs');
      return { success: true, message: '所有配置已清除' };
    } catch (error) {
      console.error('清除配置失败:', error);
      return { success: false, message: '清除配置失败' };
    }
  }

  // ========== 智能工作流配置管理 ==========
  // 已废弃：这些配置已迁移到AI角色管理系统
  // 以下方法保留以便向后兼容，但返回空数组或执行空操作

  /**
   * 获取智能工作流节点配置（已废弃）
   * @deprecated 已迁移到AI角色管理系统，请使用 aiRoleService.getAIRoles() 并过滤 source === 'smart-workflow'
   */
  async getSmartWorkflowConfigs(): Promise<SmartWorkflowNodeConfig[]> {
    console.warn('getSmartWorkflowConfigs 已废弃，请使用AI角色管理系统');
    return [];
  }

  /**
   * 保存智能工作流节点配置（已废弃）
   * @deprecated 已迁移到AI角色管理系统
   */
  async saveSmartWorkflowConfigs(_configs: SmartWorkflowNodeConfig[]): Promise<ConfigResponse> {
    console.warn('saveSmartWorkflowConfigs 已废弃，请使用AI角色管理系统');
    return { success: true, message: '配置已迁移到AI角色管理系统' };
  }

  /**
   * 更新智能工作流节点配置（已废弃）
   * @deprecated 已迁移到AI角色管理系统
   */
  async updateSmartWorkflowConfig(_id: string, _updates: Partial<SmartWorkflowNodeConfig>): Promise<ConfigResponse> {
    console.warn('updateSmartWorkflowConfig 已废弃，请使用AI角色管理系统');
    return { success: false, message: '配置已迁移到AI角色管理系统' };
  }

  // ========== 独立页面配置管理 ==========
  // 已废弃：这些配置已迁移到AI角色管理系统

  /**
   * 获取独立页面配置（已废弃）
   * @deprecated 已迁移到AI角色管理系统，请使用 aiRoleService.getAIRoles() 并过滤 source === 'independent-page'
   */
  async getIndependentPageConfigs(): Promise<IndependentPageConfig[]> {
    console.warn('getIndependentPageConfigs 已废弃，请使用AI角色管理系统');
    return [];
  }

  /**
   * 保存独立页面配置（已废弃）
   * @deprecated 已迁移到AI角色管理系统
   */
  async saveIndependentPageConfigs(_configs: IndependentPageConfig[]): Promise<ConfigResponse> {
    console.warn('saveIndependentPageConfigs 已废弃，请使用AI角色管理系统');
    return { success: true, message: '配置已迁移到AI角色管理系统' };
  }

  /**
   * 更新独立页面配置（已废弃）
   * @deprecated 已迁移到AI角色管理系统
   */
  async updateIndependentPageConfig(_id: string, _updates: Partial<IndependentPageConfig>): Promise<ConfigResponse> {
    console.warn('updateIndependentPageConfig 已废弃，请使用AI角色管理系统');
    return { success: false, message: '配置已迁移到AI角色管理系统' };
  }

  // ========== 统一配置管理 ==========

  /**
   * 导出所有配置（已更新：智能工作流和独立页面配置已迁移到AI角色系统）
   */
  async exportAllConfigs(): Promise<{
    difyConfigs: DifyAPIConfig[],
    workflowConfigs: WorkflowStepConfig[],
    smartWorkflowConfigs: SmartWorkflowNodeConfig[], // 已废弃，返回空数组
    independentPageConfigs: IndependentPageConfig[] // 已废弃，返回空数组
  }> {
    const [difyConfigs, workflowConfigs] = await Promise.all([
      this.getDifyConfigs(),
      this.getWorkflowConfigs(),
    ]);

    // 智能工作流和独立页面配置已迁移，返回空数组
    return {
      difyConfigs,
      workflowConfigs,
      smartWorkflowConfigs: [],
      independentPageConfigs: []
    };
  }

  /**
   * 导入所有配置（已更新：智能工作流和独立页面配置需迁移到AI角色系统）
   */
  async importAllConfigs(data: {
    difyConfigs?: DifyAPIConfig[],
    workflowConfigs?: WorkflowStepConfig[],
    smartWorkflowConfigs?: SmartWorkflowNodeConfig[], // 已废弃，会被忽略
    independentPageConfigs?: IndependentPageConfig[] // 已废弃，会被忽略
  }): Promise<ConfigResponse> {
    try {
      // 如果包含已废弃的配置，提示用户
      if (data.smartWorkflowConfigs && data.smartWorkflowConfigs.length > 0) {
        console.warn('smartWorkflowConfigs 已废弃，请使用AI角色管理系统迁移');
      }
      if (data.independentPageConfigs && data.independentPageConfigs.length > 0) {
        console.warn('independentPageConfigs 已废弃，请使用AI角色管理系统迁移');
      }

      const results = await Promise.all([
        data.difyConfigs ? this.saveDifyConfigs(data.difyConfigs) : Promise.resolve({ success: true }),
        data.workflowConfigs ? this.saveWorkflowConfigs(data.workflowConfigs) : Promise.resolve({ success: true }),
        // 已废弃的配置不再保存
      ]);

      const failedResults = results.filter(result => !result.success);
      if (failedResults.length > 0) {
        return { success: false, message: '部分配置导入失败' };
      }

      return { success: true, message: '配置导入成功（注意：智能工作流和独立页面配置需通过AI角色管理系统迁移）' };
    } catch (error) {
      console.error('导入配置失败:', error);
      return { success: false, message: '导入配置失败' };
    }
  }
}

// 创建单例实例
export const configService = new ConfigService();

// 导出类型和服务
export default configService;